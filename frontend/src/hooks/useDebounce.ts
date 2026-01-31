import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * 
 * Delays updating the returned value until the input value hasn't changed for the specified delay
 * Useful for search inputs to avoid excessive API calls while user is typing
 * 
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds before updating (default: 500ms)
 * @returns The debounced value
 */
export const useDebounce = <T,>(value: T, delayMs: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Clean up the timeout if value changes (i.e., another keystroke)
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
};

export default useDebounce;
