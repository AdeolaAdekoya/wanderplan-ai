

export enum TimePreference {
  MORNING = "Morning Bird (Start early, relax evening)",
  EVENING = "Night Owl (Start late, enjoy nightlife)",
  BALANCED = "Balanced (Standard 9-5 touring)"
}

export type BudgetFlexibility = "Strict" | "Flexible";
export type TravelParty = "Solo" | "Couple" | "Family" | "Friends";

export interface UserPreferences {
  name: string;
  travelParty: TravelParty;
  destinationCountry: string;
  destinationCity: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate: string;   // ISO Date string YYYY-MM-DD
  timePreference: TimePreference;
  interests: string[];
  needsAccommodation: boolean;
  currency: string;
  totalBudget: string;
  budgetFlexibility: BudgetFlexibility;
}

// AI Response Types
export interface Activity {
  id?: string; // For UI handling
  time: string;
  activity: string;
  location: string;
  cost: string; // e.g., "Free", "$20 entry"
  description: string;
  rating?: number; // 1-5 scale
  type?: "Food" | "Attraction" | "Relaxation" | "Adventure";
  sourceUrls?: string[]; // URLs from Google Search Grounding
}

export interface Event {
  name: string;
  date: string;
  location: string;
  description: string;
  link?: string;
}

export interface DayPlan {
  dayNumber: number;
  date?: string; // Optional display date
  theme: string;
  activities: Activity[];
}

export interface Accommodation {
  name: string;
  type: string;
  estimatedCost: string;
  reason: string;
  rating?: number;
}

export interface TravelItinerary {
  id?: string; // Optional ID for saving
  destinationCity?: string; // Metadata for dashboard
  destinationCountry?: string; // Metadata for dashboard
  startDate?: string; // Metadata for dashboard
  endDate?: string; // Metadata for dashboard
  
  tripName: string;
  summary: string;
  localCurrency: string;
  localTransportation: string;
  weatherExpectation: string;
  localEtiquette: string[];
  packingList: string[];
  accommodationRecommendations?: Accommodation[];
  dailyItinerary: DayPlan[];
}

// Auth & Dashboard Types
export interface UserProfile {
  email: string;
  name: string;
  password?: string; // Stored locally for mock auth
  avatar?: string; // Base64 image string
  tripsCount: number;
  countriesVisited: string[];
}

export interface SavedTrip {
  id: string;
  userEmail: string;
  organizerName?: string; // Name of the creator (for shared trips)
  invitedEmails?: string[]; // List of people invited
  tripName: string;
  city: string;
  country: string;
  startDate: string;
  createdAt: string;
  data: TravelItinerary;
}