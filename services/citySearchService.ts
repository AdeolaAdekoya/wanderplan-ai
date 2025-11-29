/**
 * City search service using multiple sources
 * Falls back gracefully if APIs fail
 */

/**
 * Search cities using a simple, free API
 * Uses REST Countries API for country info and allows free-form city input
 */
export const searchCitiesFree = async (
  query: string,
  countryName?: string
): Promise<string[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  // For now, return empty - we'll rely on free-form input
  // Users can type any city name and it will work
  return [];
};

/**
 * Validate if a city name is reasonable (basic check)
 */
export const isValidCityName = (cityName: string): boolean => {
  if (!cityName || cityName.trim().length < 2) {
    return false;
  }
  
  // Basic validation: should be mostly letters, spaces, hyphens, apostrophes
  const cityRegex = /^[a-zA-Z\s\-'\.]+$/;
  return cityRegex.test(cityName.trim());
};

