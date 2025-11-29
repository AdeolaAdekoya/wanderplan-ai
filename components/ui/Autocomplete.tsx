
import React, { useState, useRef, useEffect } from 'react';

interface AutocompleteProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  allowFreeForm?: boolean; // Allow any input, not just from options
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  className = '',
  allowFreeForm = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
  }, [wrapperRef]);

  // Filter options based on search term
  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow Enter to accept the current input even if not in list
    if (e.key === 'Enter' && searchTerm && allowFreeForm) {
      onChange(searchTerm);
      setIsOpen(false);
    }
    // Allow Escape to close
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && <label className="text-sm font-medium text-stone-700 mb-1 block">{label}</label>}
      <input
        type="text"
        className="w-full px-5 py-3 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all shadow-sm"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.map((option) => (
            <li
              key={option}
              className="px-4 py-2 hover:bg-stone-50 cursor-pointer text-stone-700 transition-colors"
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {isOpen && searchTerm && filteredOptions.length === 0 && (
         <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-xl p-3 text-stone-500 text-sm">
            No match in our list, but you can use <strong>"{searchTerm}"</strong>. Press Enter or click outside.
         </div>
      )}
    </div>
  );
};
