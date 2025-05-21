
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Function to read the value from localStorage or return initialValue
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // State to store our value
  // Pass a function to useState so it's only executed on initial render
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // The setValue function now just calls setStoredValue.
  // It accepts a value or a function that receives the previous value.
  // This function's reference is stable.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(value);
  }, []);

  // useEffect to update localStorage when storedValue changes (React state)
  useEffect(() => {
    // This effect runs after setStoredValue has updated the state and re-render has occurred.
    // So, `storedValue` here is the most up-to-date.
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}” during sync:`, error);
      }
    }
  }, [key, storedValue]); // Re-run if key or the React state `storedValue` changes.

  // useEffect to listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        try {
          // Update React state if localStorage changed in another tab
          const newValueFromStorage = event.newValue ? JSON.parse(event.newValue) : initialValue;
          setStoredValue(newValueFromStorage);
        } catch (error) {
          console.warn(`Error parsing localStorage change for key “${key}”:`, error);
          setStoredValue(initialValue);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
