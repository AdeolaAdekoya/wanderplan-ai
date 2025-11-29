import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon } from './Icons';
import { formatDate, getMinDate } from '../../utils/dateUtils';

// Custom styles for date picker to match app design
const datePickerStyles = `
  .react-datepicker {
    font-family: 'Inter', sans-serif;
    border: 1px solid #e7e5e4;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  .react-datepicker__header {
    background-color: #fafaf9;
    border-bottom: 1px solid #e7e5e4;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    padding-top: 0.75rem;
  }
  .react-datepicker__current-month {
    color: #1c1917;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .react-datepicker__day-name {
    color: #78716c;
    font-weight: 600;
    font-size: 0.75rem;
    width: 2.25rem;
    line-height: 2.25rem;
  }
  .react-datepicker__day {
    color: #1c1917;
    width: 2.25rem;
    line-height: 2.25rem;
    margin: 0.125rem;
    border-radius: 0.375rem;
  }
  .react-datepicker__day:hover {
    background-color: #f5f5f4;
    border-radius: 0.375rem;
  }
  .react-datepicker__day--selected {
    background-color: #1c1917;
    color: white;
    font-weight: 600;
  }
  .react-datepicker__day--selected:hover {
    background-color: #292524;
  }
  .react-datepicker__day--keyboard-selected {
    background-color: #f5f5f4;
  }
  .react-datepicker__day--today {
    font-weight: 600;
  }
  .react-datepicker__day--disabled {
    color: #d6d3d1;
    cursor: not-allowed;
  }
  .react-datepicker__navigation {
    top: 0.75rem;
  }
  .react-datepicker__navigation-icon::before {
    border-color: #78716c;
  }
  .react-datepicker__navigation:hover *::before {
    border-color: #1c1917;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'wanderplan-datepicker-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = datePickerStyles;
    document.head.appendChild(style);
  }
}

interface DatePickerProps {
  label?: string;
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  minDate?: string;
  placeholder?: string;
  className?: string;
}

export const DatePickerInput: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  minDate,
  placeholder = "Select date",
  className = ""
}) => {
  const selectedDate = value ? new Date(value) : null;
  const minDateObj = minDate ? new Date(minDate) : new Date(getMinDate());

  const handleDateChange = (date: Date | null) => {
    if (date) {
      onChange(formatDate(date));
    }
  };

  return (
    <label className={`block relative ${className}`}>
      {label && (
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">
          {label}
        </span>
      )}
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={minDateObj}
          dateFormat="MMM dd, yyyy"
          placeholderText={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-200 bg-white text-stone-900 focus:border-stone-900 outline-none shadow-sm appearance-none cursor-pointer placeholder-stone-400 uppercase text-sm font-medium tracking-wide"
          wrapperClassName="w-full"
          calendarClassName="font-sans"
        />
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 pointer-events-none" />
      </div>
    </label>
  );
};

