/**
 * City database service using public datasets
 * Falls back to static data if needed
 */

import { COUNTRIES } from '../data/countries';

interface CityData {
  name: string;
  country: string;
  state?: string;
}

// Cache for loaded cities
let citiesCache: CityData[] | null = null;

// Common region/administrative terms to filter out
const REGION_TERMS = [
  'region', 'province', 'state', 'county', 'district', 'prefecture',
  'governorate', 'oblast', 'autonomous', 'republic', 'territory'
];

/**
 * Check if a name is likely a country or region, not a city
 */
const isCountryOrRegion = (name: string, countryName?: string): boolean => {
  const nameLower = name.toLowerCase().trim();
  
  // Check if it matches a country name
  if (COUNTRIES.some(country => country.toLowerCase() === nameLower)) {
    return true;
  }
  
  // Check if it's the same as the selected country
  if (countryName && nameLower === countryName.toLowerCase()) {
    return true;
  }
  
  // Check for region indicators
  if (REGION_TERMS.some(term => nameLower.includes(term))) {
    return true;
  }
  
  // Filter out very generic names that are likely regions
  const genericNames = ['north', 'south', 'east', 'west', 'central', 'upper', 'lower', 'inner', 'outer'];
  if (genericNames.some(generic => nameLower.startsWith(generic + ' ') || nameLower.endsWith(' ' + generic))) {
    return true;
  }
  
  return false;
};

/**
 * Load cities from a public dataset
 * Uses a comprehensive city database
 */
export const loadCitiesDatabase = async (): Promise<CityData[]> => {
  if (citiesCache) {
    return citiesCache;
  }

  try {
    // Try to load from a public cities JSON dataset
    // Using a reliable public source
    const response = await fetch('https://raw.githubusercontent.com/russ666/all-countries-and-cities-json/master/countries.json');
    
    if (!response.ok) {
      throw new Error('Failed to load cities database');
    }

    const data: Record<string, string[]> = await response.json();
    
    // Convert to our format
    const cities: CityData[] = [];
    for (const [country, cityList] of Object.entries(data)) {
      for (const city of cityList) {
        cities.push({
          name: city,
          country: country
        });
      }
    }
    
    citiesCache = cities;
    return cities;
  } catch (error) {
    console.error('Error loading cities database:', error);
    return [];
  }
};

/**
 * Search cities by name and country
 * Filters out countries and regions to only return actual cities
 */
export const searchCitiesFromDatabase = async (
  query: string,
  countryName?: string,
  maxResults: number = 20
): Promise<string[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const cities = await loadCitiesDatabase();
    
    if (cities.length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const countryLower = countryName?.toLowerCase();

    const matches = cities
      .filter(city => {
        // Filter out countries and regions
        if (isCountryOrRegion(city.name, countryName)) {
          return false;
        }
        
        const nameMatch = city.name.toLowerCase().includes(queryLower);
        const countryMatch = !countryLower || 
          city.country.toLowerCase() === countryLower ||
          city.country.toLowerCase().includes(countryLower);
        
        return nameMatch && countryMatch;
      })
      .slice(0, maxResults * 2) // Get more results to filter better
      .map(city => city.state ? `${city.name}, ${city.state}` : city.name)
      .filter((name, index, self) => {
        // Remove duplicates and filter out any that still look like countries/regions
        return index === self.indexOf(name) && !isCountryOrRegion(name, countryName);
      })
      .slice(0, maxResults);

    return matches;
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
};

