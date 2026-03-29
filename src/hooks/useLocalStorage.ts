import { useCallback, useState } from 'react';

/**
 * Typsicherer Hook für localStorage mit automatischer JSON-Serialisierung.
 * Liest initial aus localStorage und bleibt synchron beim Schreiben.
 *
 * @param key          - localStorage-Schlüssel
 * @param defaultValue - Standardwert wenn kein Eintrag vorhanden oder bei Parse-Fehler
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // localStorage kann in Private-Browsing-Modi oder bei vollem Speicher fehlschlagen
        console.warn(`useLocalStorage: Konnte Wert für "${key}" nicht speichern.`);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
