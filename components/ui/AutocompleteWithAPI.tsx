import React, { useState, useRef, useEffect, useCallback } from 'react';
import { searchCities, getCitiesByCountry } from '../../services/geonamesService';

interface AutocompleteWithAPIProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  countryCode?: string; // For filtering cities by country
  useAPI?: boolean; // Toggle API usage
  staticOptions?: string[]; // Fallback static options
}

export const AutocompleteWithAPI: React.FC<AutocompleteWithAPIProps> = ({
  value,
  onChange,
  placeholder,
  label,
  className = '',
  countryCode,
  useAPI = true,
  staticOptions = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [options, setOptions] = useState<string[]>(staticOptions);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced API search
  const fetchCities = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      // Show static options when query is too short
      setOptions(staticOptions);
      return;
    }

    // First, show filtered static options immediately
    const filteredStatic = staticOptions.filter(opt =>
      opt.toLowerCase().includes(query.toLowerCase())
    );
    setOptions(filteredStatic);
    
    // Then try to enhance with API results in the background
    if (useAPI) {
      setIsLoading(true);
      try {
        // Use Geonames API (countryCode is actually countryName here)
        const apiResults = await searchCities(query, countryCode, 15);
        
        // Merge API results with filtered static options, prioritizing API
        if (apiResults.length > 0) {
          const combined = [...new Set([...apiResults, ...filteredStatic])];
          setOptions(combined);
        }
      } catch (error) {
        console.error('Error fetching cities from API:', error);
        // Keep the filtered static options on error
      } finally {
        setIsLoading(false);
      }
    }
  }, [useAPI, countryCode, staticOptions]);

  // Load cities when country is selected (for city autocomplete)
  useEffect(() => {
    // Always show static options first
    if (staticOptions.length > 0) {
      setOptions(staticOptions);
    }
    
    // Then try to enhance with API data if enabled
    if (countryCode && useAPI) {
      setIsLoading(true);
      getCitiesByCountry(countryCode, 30)
        .then(cities => {
          // Merge API results with static options, prioritizing API results
          const combined = [...new Set([...cities, ...staticOptions])];
          setOptions(combined);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load cities from API:', error);
          // Keep static options on error
          setIsLoading(false);
        });
    }
  }, [countryCode, useAPI, staticOptions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce API calls
    debounceTimerRef.current = setTimeout(() => {
      fetchCities(newValue);
    }, 300);
  };

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="text-sm font-medium text-stone-700 mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          className="w-full px-5 py-3 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all shadow-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            // Show options when focused if we have them
            if (options.length === 0 && countryCode && useAPI) {
              // Trigger city loading if country is selected
              getCitiesByCountry(countryCode, 30)
                .then(cities => {
                  const combined = [...new Set([...cities, ...staticOptions])];
                  setOptions(combined);
                })
                .catch(() => {
                  setOptions(staticOptions);
                });
            } else if (options.length === 0 && staticOptions.length > 0) {
              setOptions(staticOptions);
            }
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {isOpen && options.length > 0 && !isLoading && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <li
              key={`${option}-${index}`}
              className="px-4 py-2 hover:bg-stone-50 cursor-pointer text-stone-700 transition-colors"
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {isOpen && searchTerm && options.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-xl p-3 text-stone-500 text-sm">
          {useAPI 
            ? `No cities found for "${searchTerm}". You can still use this location.`
            : `No match in our list, but you can use "${searchTerm}". Press Enter or click outside.`
          }
        </div>
      )}
    </div>
  );
};

