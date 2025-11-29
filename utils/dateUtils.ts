/**
 * Formats a Date object to ISO string (YYYY-MM-DD)
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Calculates the number of days between two dates (inclusive)
 */
export const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

/**
 * Gets tomorrow's date
 */
export const getTomorrow = (): Date => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow;
};

/**
 * Gets a date N days from a given date
 */
export const getDaysFromDate = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
};

/**
 * Gets the minimum date for date inputs (today)
 */
export const getMinDate = (): string => {
  return formatDate(new Date());
};

