'use client';

import { useEffect, useState } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue?: T
): [T, (value: T) => void, boolean] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue as T);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const item = window.localStorage.getItem(key);
    if (item) {
      try {
        setStoredValue(JSON.parse(item) as T);
      } catch {
        setStoredValue(item as T);
      }
    }
    setLoading(false);
  }, [key]);

  const setValue = (value: T) => {
    setStoredValue(value);
    if (value !== null && value !== undefined && value !== '') {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        window.localStorage.setItem(key, value.toString());
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } else {
      window.localStorage.removeItem(key);
    }
  };

  return [storedValue, setValue, isLoading];
};
