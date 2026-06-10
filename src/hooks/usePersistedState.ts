import { useEffect, useRef, useState } from 'react';

type Serializer<T> = {
  parse: (raw: string) => T;
  stringify: (value: T) => string;
};

const defaultSerializer: Serializer<unknown> = {
  parse: (raw) => JSON.parse(raw),
  stringify: (value) => JSON.stringify(value),
};

const stringSerializer: Serializer<string> = {
  parse: (raw) => raw,
  stringify: (value) => value,
};

const booleanSerializer: Serializer<boolean> = {
  parse: (raw) => raw === 'true',
  stringify: (value) => String(value),
};

function pickSerializer<T>(initial: T): Serializer<T> {
  if (typeof initial === 'string') return stringSerializer as unknown as Serializer<T>;
  if (typeof initial === 'boolean') return booleanSerializer as unknown as Serializer<T>;
  return defaultSerializer as Serializer<T>;
}

/**
 * useState that persists to localStorage. Replaces the scattered
 * `useState(() => localStorage.getItem(...) ?? default)` + `useEffect(() => localStorage.setItem(...))`
 * pattern that was duplicated across pages.
 *
 * String, boolean and JSON-serializable values are detected automatically from
 * the initial value. Pass a custom `serializer` for anything else.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options?: { serializer?: Serializer<T> }
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const serializer = options?.serializer ?? pickSerializer(initialValue);
  const serializerRef = useRef(serializer);
  // Sync the serializer ref via effect — assigning to .current during render
  // would violate the React-19 purity rule. The setItem effect already reads
  // serializerRef in a deferred phase, so the timing works out.
  useEffect(() => {
    serializerRef.current = serializer;
  }, [serializer]);

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initialValue;
      return serializer.parse(raw);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, serializerRef.current.stringify(value));
    } catch {
      // Quota exceeded / private mode — silently ignore, behaves like in-memory state.
    }
  }, [key, value]);

  return [value, setValue];
}
