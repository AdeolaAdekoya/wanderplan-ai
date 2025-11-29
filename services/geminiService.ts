import { GoogleGenAI } from "@google/genai";
import { UserPreferences, TravelItinerary, Activity, Event } from "../types";
import { MAX_RETRIES, INITIAL_RETRY_DELAY } from "../constants";
import { ApiError, isQuotaError, isServerError } from "../utils/errorHandling";

// Get API key from Vite's injected environment variable
// This is set by vite.config.ts's define option
const rawApiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                  (typeof process !== 'undefined' && process.env?.API_KEY) || 
                  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                  '';
// Trim whitespace in case there's any
const apiKey = typeof rawApiKey === 'string' ? rawApiKey.trim() : '';

// Helper to reliably extract JSON from markdown or text chatter
const cleanAndParseJson = (text: string, isArray: boolean = false): unknown => {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Extract content between first { or [ and last } or ]
    const startChar = isArray ? '[' : '{';
    const endChar = isArray ? ']' : '}';
    const startIndex = text.indexOf(startChar);
    const endIndex = text.lastIndexOf(endChar);
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const jsonStr = text.substring(startIndex, endIndex + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (innerE) {
        console.error("Failed to parse extracted JSON segment", innerE);
      }
    }
    // Return empty fallback
    return isArray ? [] : {};
  }
};

interface GenerateContentParams {
  model: string;
  contents: string;
  config?: {
    tools?: Array<{ googleSearch?: Record<string, never> }>;
  };
}

// Helper to wrap API calls with retry logic for 429/503 errors
const generateWithRetry = async (
  ai: GoogleGenAI, 
  params: GenerateContentParams, 
  retries = MAX_RETRIES, 
  delay = INITIAL_RETRY_DELAY
): Promise<{ text: string; candidates?: Array<{ groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string } }> } }> }> => {
  // Add timeout (60 seconds for itinerary generation)
  const timeout = 60000;
  
  try {
    const responsePromise = ai.models.generateContent(params);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - API call took too long')), timeout);
    });
    
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    // Check if response has the expected structure
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format from API');
    }
    return response;
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; code?: string };
    
    // Log the full error for debugging
    console.error('Gemini API Error:', {
      message: err.message,
      status: err.status,
      code: err.code,
      error
    });
    
    // Check for timeout
    if (err.message?.includes('timeout')) {
      throw new ApiError("Request timed out. The API is taking too long to respond. Please try again.", 408, "TIMEOUT");
    }
    
    // Check for Rate Limit (429) or Server Overload (503)
    const quotaErr = isQuotaError(error);
    const serverErr = isServerError(error);
    
    if ((quotaErr || serverErr) && retries > 0) {
      const status = err.status || 'unknown';
      console.warn(`API Request failed (Status: ${status}). Retrying in ${delay}ms... (${retries} attempts left)`);
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delay));
      // Retry with double the delay (exponential backoff)
      return generateWithRetry(ai, params, retries - 1, delay * 2);
    }
    
    // If not a retry-able error or retries exhausted, throw
    throw error;
  }
};

export const generateItinerary = async (prefs: UserPreferences): Promise<TravelItinerary> => {
  // Debug: Log what we're getting (without exposing the full key)
  if (!apiKey) {
    console.error('API Key check:', {
      hasViteEnv: !!import.meta.env.VITE_GEMINI_API_KEY,
      hasProcessApiKey: typeof process !== 'undefined' && !!process.env?.API_KEY,
      hasProcessGeminiKey: typeof process !== 'undefined' && !!process.env?.GEMINI_API_KEY,
      viteEnvPreview: import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...',
    });
    throw new ApiError("API_KEY is missing in environment variables. Please set GEMINI_API_KEY in Vercel Environment Variables or .env.local", 500, "MISSING_API_KEY");
  }
  
  // Log partial key for debugging (first 10 chars only)
  console.log('Using API key:', apiKey.substring(0, 10) + '...');

  console.log('Starting itinerary generation for:', prefs.destinationCity);
  const startTime = Date.now();
  
  const ai = new GoogleGenAI({ apiKey });

  // Calculate duration
  const start = new Date(prefs.startDate);
  const end = new Date(prefs.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const prompt = `
    Create a detailed, personalized travel itinerary for ${prefs.name}.
    
    Destination: ${prefs.destinationCity}, ${prefs.destinationCountry}.
    Dates: From ${prefs.startDate} to ${prefs.endDate} (${durationDays} days).
    Travel Party: ${prefs.travelParty} (Tailor activities for this group size/dynamic).
    Travel Style/Time: ${prefs.timePreference}.
    Interests: ${prefs.interests.join(", ")}.
    
    Budget Details:
    - Total Budget: ${prefs.totalBudget} ${prefs.currency}
    - Flexibility: ${prefs.budgetFlexibility} (If 'Strict', ensure activities are within this limit. If 'Flexible', you can suggest slightly pricier options if they are worth it).
    
    Needs Accommodation: ${prefs.needsAccommodation ? "Yes, please suggest 5-6 options within the budget. Focus on Hotels or known Apart-hotels." : "No, I have a place."}.

    Requirements:
    1. Organize the itinerary logically by location to minimize travel time between spots.
    2. Respect the Time Preference. 
       - If 'Morning Bird': start early (e.g., 7-8 AM), wind down by 8-9 PM.
       - If 'Night Owl': start later (e.g., 11 AM), include nightlife/clubs/late dinners.
    3. Include specific entry fees or note if free. Try to estimate costs in ${prefs.currency} if possible, or USD.
    4. Provide specific cultural tips for ${prefs.destinationCountry}.
    5. Ensure the tone is exciting and helpful.
    6. Populate the 'date' field in dailyItinerary corresponding to the actual calendar dates.
    7. INCLUDE GOOGLE MAPS RATINGS (e.g., 4.5, 4.8) for every location based on general knowledge.
    8. **Local Transportation**: Provide specific advice on how to get around. Mention specific names of local transport (e.g. Keke, Boda Boda, TukTuk, Subway) and ride-hailing apps (Uber, Bolt, Grab) if available.

    IMPORTANT RULES FOR FINANCIALS:
    - Assess the budget intuitively: ${prefs.totalBudget} ${prefs.currency} for ${durationDays} days. If this seems high, suggest luxury. If low, suggest budget friendly.
    - Provide practical payment advice in 'localCurrency' field. KEEP IT EXTREMELY SHORT (max 6 words). Focus only on Cash vs Card (e.g. "Cash is King", "Cards widely accepted").
    - Do NOT quote specific exchange rates...
    - Do NOT state the currency name (e.g. 'United Arab Emirates Dirham'), just the practical advice.

    CRITICAL INSTRUCTION FOR LOCATIONS (VERIFY STATUS):
    - **USE GOOGLE SEARCH** to check the status of every place you suggest.
    - **DO NOT** recommend places that are "Permanently Closed" or "Temporarily Closed" (e.g., verify that places like museums, galleries, or foundations are still operational).
    - Suggest **SPECIFIC, REAL** places. 
    - Prioritize **modern, contemporary, and trending** spots alongside classics.
    - For meals, you MUST provide a **specific, real restaurant name** (e.g., "Lunch at The Yellow Chilli"). Do NOT use generic phrases like "Lunch at a local eatery".
    
    CRITICAL INSTRUCTION FOR COPYWRITING:
    - **tripName**: Must be SHORT and PUNCHY. Max 6 words. (e.g., "Adeola's Art & Culture Escape", "The Ultimate Lagos Weekend"). No long sentences.
    - **summary**: Must be SHORT. Max 2 sentences. An elevator pitch of the trip vibe.

    OUTPUT FORMAT:
    Return strictly a valid JSON object matching this structure. Do NOT add markdown code blocks.
    {
      "tripName": "string (Max 6 words)",
      "summary": "string (Max 2 sentences)",
      "localCurrency": "string (max 6 words advice)",
      "localTransportation": "string (advice on getting around)",
      "weatherExpectation": "string",
      "localEtiquette": ["string", "string", ...],
      "packingList": ["string", "string", ...],
      "accommodationRecommendations": [
        { "name": "string", "type": "string", "estimatedCost": "string", "reason": "string", "rating": number }
      ],
      "dailyItinerary": [
        {
          "dayNumber": number,
          "date": "string",
          "theme": "string",
          "activities": [
             { 
               "time": "string", 
               "activity": "string", 
               "location": "string", 
               "cost": "string", 
               "description": "string", 
               "rating": number,
               "type": "string" 
             }
          ]
        }
      ]
    }
  `;

  try {
    console.log('Calling Gemini API...');
    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable search to verify open status
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`API call completed in ${elapsed}s`);

    const text = response.text;
    if (!text) throw new ApiError("No response from AI", 500, "NO_RESPONSE");
    
    console.log('Parsing response...');
    console.log('Response text length:', text.length);
    console.log('Response preview:', text.substring(0, 200));
    
    // Attempt to parse. The search tool usage might add some grounding metadata we ignore here for the main JSON
    const parsed = cleanAndParseJson(text) as TravelItinerary;
    
    // Validate the parsed response has required fields
    if (!parsed || typeof parsed !== 'object') {
      throw new ApiError("Invalid response format from API", 500, "INVALID_RESPONSE");
    }
    
    // Ensure all required arrays exist
    if (!parsed.dailyItinerary || !Array.isArray(parsed.dailyItinerary)) {
      console.error('Missing or invalid dailyItinerary:', parsed);
      throw new ApiError("Response missing daily itinerary", 500, "MISSING_ITINERARY");
    }
    
    if (!parsed.localEtiquette || !Array.isArray(parsed.localEtiquette)) {
      parsed.localEtiquette = [];
    }
    
    if (!parsed.packingList || !Array.isArray(parsed.packingList)) {
      parsed.packingList = [];
    }
    
    // Ensure each day has activities array
    parsed.dailyItinerary = parsed.dailyItinerary.map(day => ({
      ...day,
      activities: Array.isArray(day.activities) ? day.activities : []
    }));
    
    console.log('Itinerary generated successfully:', {
      tripName: parsed.tripName,
      days: parsed.dailyItinerary.length,
      activities: parsed.dailyItinerary.reduce((sum, day) => sum + (day.activities?.length || 0), 0)
    });
    
    return parsed;
  } catch (error) {
    console.error("Error generating itinerary:", error);
    
    // Provide more specific error messages
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Check for specific API errors
    const err = error as { message?: string; status?: number; code?: string };
    if (err.message?.includes('API key') || err.message?.includes('authentication') || err.message?.includes('401') || err.status === 401) {
      const keyPreview = apiKey ? apiKey.substring(0, 10) + '...' : 'not found';
      throw new ApiError(
        `Invalid API key detected (${keyPreview}). This key may have been revoked. Please:\n1. Check your GEMINI_API_KEY in .env.local\n2. If it was exposed in git, generate a new key at https://aistudio.google.com/apikey\n3. Update .env.local and restart the server`,
        401,
        "INVALID_API_KEY"
      );
    }
    if (err.message?.includes('model') || err.message?.includes('not found') || err.message?.includes('404')) {
      throw new ApiError("Model not available. Please check the model name.", 404, "MODEL_NOT_FOUND");
    }
    if (err.message?.includes('quota') || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new ApiError("API quota exceeded. Please try again later.", 429, "QUOTA_EXCEEDED");
    }
    
    const errorMessage = err.message || "Failed to generate itinerary. Please check your API key and try again.";
    throw new ApiError(errorMessage, err.status || 500, "GENERATION_FAILED");
  }
};

export const getRealTimeExchangeRate = async (fromCurrency: string, country: string): Promise<string | null> => {
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Find the CURRENT real-time exchange rate between ${fromCurrency} and the local currency of ${country}.
    If they are the same currency, return "Same Currency".
    
    STRICT OUTPUT FORMAT:
    Return ONLY the conversion string. 
    Example: "1 ${fromCurrency} ≈ 1,600 NGN"
    
    DO NOT write sentences like "The current rate is..." or "The currency is...".
    DO NOT mention the full currency name.
    Just the math.
  `;

  try {
    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text ? response.text.trim() : null;
  } catch (e) {
    console.error("Failed to fetch exchange rate", e);
    return null;
  }
};

export const getDestinationEvents = async (city: string, startDate: string, endDate: string): Promise<Event[]> => {
  if (!apiKey) return [];
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Search for upcoming events, concerts, festivals, art exhibitions, or special nightlife events happening in ${city} 
    specifically between ${startDate} and ${endDate}.
    
    Return a raw JSON array of objects with this structure (no markdown):
    [
      {
        "name": "Event Name",
        "date": "Date and Time",
        "location": "Venue",
        "description": "Very short description",
        "link": "URL to event page or ticket site if available"
      }
    ]
    If no specific events are found, return generic recurring events (e.g. "Weekly Jazz Night at X").
  `;

  try {
    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const parsed = cleanAndParseJson(response.text || "[]", true) as Event[];
    return parsed;
  } catch (e) {
    console.error("Failed to fetch events", e);
    return [];
  }
};

export const getExtraRecommendations = async (city: string, interests: string[]): Promise<Activity[]> => {
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  
  // We use Google Search to find real, grounded results
  const prompt = `
    Using Google Search, find 5 real, highly-rated places in ${city} that match these interests: ${interests.join(", ")}.
    Focus on specific venues, parks, museums, or restaurants that are currently popular or "hidden gems".
    
    Return a raw JSON array (no markdown formatting, no code blocks) of objects with this structure:
    [
      {
        "activity": "Name of place",
        "description": "Short compelling description (max 1 sentence)",
        "rating": 4.5,
        "cost": "Entry fee or price range",
        "location": "Address or neighborhood",
        "type": "Attraction" 
      }
    ]
  `;

  try {
    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const parsed = cleanAndParseJson(response.text || "[]", true) as Activity[];
    let items: Activity[] = parsed;

    // Extract Grounding Metadata (Source URLs)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const urls = chunks
      .map((c) => c.web?.uri)
      .filter((u): u is string => typeof u === 'string');
    
    const uniqueUrls = Array.from(new Set(urls)) as string[];

    // Attach sources to items for display
    return items.map(item => ({
      ...item,
      time: "Flex", // Default time for extra recs
      sourceUrls: uniqueUrls
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}