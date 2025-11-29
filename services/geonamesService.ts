/**
 * Geonames API service for fetching cities and regions
 * Free API: https://www.geonames.org/export/web-services.html
 * No API key required for basic usage (up to 1000 requests/hour)
 */

interface GeonamesCity {
  name: string;
  countryName: string;
  adminName1?: string; // State/Province
  lat: string;
  lng: string;
  population?: number;
  geonameId: number;
}

interface GeonamesSearchResult {
  geonames: GeonamesCity[];
}

/**
 * Search for cities by name and country (optional)
 * @param query - City name to search for
 * @param countryName - Optional country name to filter results
 * @param maxResults - Maximum number of results to return
 */
export const searchCities = async (
  query: string,
  countryName?: string,
  maxResults: number = 15
): Promise<string[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Use demo username (free tier, 1000 requests/hour)
    // For production, register at geonames.org for higher limits
    const url = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=${maxResults * 2}&featureClass=P&orderby=population&username=demo`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geonames API error: ${response.status}`);
    }

    const data: GeonamesSearchResult = await response.json();
    
    // Extract unique city names, prioritizing by population
    const cities = new Set<string>();
    
    let filtered = data.geonames;
    
    // Filter by country if provided
    if (countryName) {
      filtered = filtered.filter(city => 
        city.countryName.toLowerCase() === countryName.toLowerCase() ||
        city.countryName.toLowerCase().includes(countryName.toLowerCase())
      );
    }
    
    filtered
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .forEach(city => {
        // Format: "City Name, State" or "City Name"
        const displayName = city.adminName1 
          ? `${city.name}, ${city.adminName1}`
          : city.name;
        cities.add(displayName);
      });

    return Array.from(cities).slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching cities from Geonames:', error);
    // Fallback to empty array on error
    return [];
  }
};

/**
 * Get country code from country name
 */
const getCountryCode = async (countryName: string): Promise<string | null> => {
  try {
    const url = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(countryName)}&maxRows=1&featureClass=A&username=demo`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data: GeonamesSearchResult = await response.json();
    if (data.geonames && data.geonames.length > 0) {
      // Geonames returns countryCode in the response
      return (data.geonames[0] as any).countryCode || null;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Get cities for a specific country
 */
export const getCitiesByCountry = async (
  countryName: string,
  maxResults: number = 50
): Promise<string[]> => {
  if (!countryName) {
    return [];
  }

  try {
    // First try to get country code, then search cities
    const countryCode = await getCountryCode(countryName);
    
    let url: string;
    if (countryCode) {
      // Use country code for better filtering
      url = `https://secure.geonames.org/searchJSON?country=${countryCode}&maxRows=${maxResults}&featureClass=P&orderby=population&username=demo`;
    } else {
      // Fallback: search by country name and filter
      url = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(countryName)}&maxRows=${maxResults * 2}&featureClass=P&orderby=population&username=demo`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geonames API error: ${response.status}`);
    }

    const data: GeonamesSearchResult = await response.json();
    
    if (!data.geonames || data.geonames.length === 0) {
      return [];
    }
    
    // Filter cities that match the country and extract unique names
    const cities = new Set<string>();
    
    let filtered = data.geonames;
    
    // If we didn't use country code, filter by country name
    if (!countryCode) {
      filtered = filtered.filter(city => 
        city.countryName.toLowerCase() === countryName.toLowerCase() ||
        city.countryName.toLowerCase().includes(countryName.toLowerCase())
      );
    }
    
    filtered
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .forEach(city => {
        const displayName = city.adminName1 
          ? `${city.name}, ${city.adminName1}`
          : city.name;
        cities.add(displayName);
      });

    return Array.from(cities).slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching cities by country from Geonames:', error);
    return [];
  }
};

/**
 * Get all countries (with fallback to static data)
 */
export const getCountries = async (): Promise<string[]> => {
  try {
    const url = 'https://secure.geonames.org/countryInfoJSON?username=demo';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geonames API error: ${response.status}`);
    }

    const data = await response.json();
    return data.geonames
      .map((country: { countryName: string }) => country.countryName)
      .sort();
  } catch (error) {
    console.error('Error fetching countries from Geonames:', error);
    // Fallback to static data
    return [];
  }
};

