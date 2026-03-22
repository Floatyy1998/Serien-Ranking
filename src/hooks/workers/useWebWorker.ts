import { useEffect, useRef, useState } from 'react';

export interface WebWorkerOptions<TInput> {
  /** Worker-Factory-Funktion, die einen neuen Worker erstellt */
  workerFactory: () => Worker;
  /** Nachrichtentyp, der an den Worker gesendet wird */
  messageType: string;
  /** Nachrichtentyp, der vom Worker empfangen wird */
  resultType: string;
  /** Die Eingabedaten, die an den Worker gesendet werden */
  data: TInput | null;
  /** Dep-String fuer Vergleiche (verhindert unnoetige Worker-Nachrichten) */
  depsKey: string;
  /** Optionales Debounce-Intervall in ms (default: 0 = kein Debounce) */
  debounceMs?: number;
  /** Ob Worker-Daten gesendet werden sollen (false = ueberspringen) */
  enabled?: boolean;
}

export interface WebWorkerResult<TOutput> {
  data: TOutput;
  loading: boolean;
  error: Error | null;
}

/**
 * Generischer Hook fuer Web Worker Kommunikation.
 * Kapselt Worker-Lifecycle (Initialisierung, Cleanup), Debouncing
 * und Deduplizierung von Nachrichten ueber depsKey.
 *
 * @template TInput  - Typ der Eingabedaten, die an den Worker gesendet werden
 * @template TOutput - Typ der Ausgabedaten, die vom Worker empfangen werden
 */
export function useWebWorker<TInput, TOutput>(
  initialData: TOutput,
  options: WebWorkerOptions<TInput>
): WebWorkerResult<TOutput> {
  const {
    workerFactory,
    messageType,
    resultType,
    data,
    depsKey,
    debounceMs = 0,
    enabled = true,
  } = options;

  const workerRef = useRef<Worker | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDepsKeyRef = useRef<string>('');

  const [result, setResult] = useState<TOutput>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Worker nur einmal erstellen, Cleanup beim Unmount
  useEffect(() => {
    workerRef.current = workerFactory();

    workerRef.current.addEventListener('message', (event: MessageEvent) => {
      if (event.data?.type === resultType) {
        setError(null);
        requestAnimationFrame(() => {
          setResult(event.data.data as TOutput);
          setLoading(false);
        });
      }
    });

    workerRef.current.addEventListener('error', (event: ErrorEvent) => {
      setError(new Error(event.message));
      setLoading(false);
    });

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Nachrichten an Worker senden, mit optionalem Debounce
  useEffect(() => {
    if (!enabled || data === null || depsKey === lastDepsKeyRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const send = () => {
      if (workerRef.current) {
        lastDepsKeyRef.current = depsKey;
        workerRef.current.postMessage({ type: messageType, data });
      }
    };

    if (debounceMs > 0) {
      debounceTimerRef.current = setTimeout(send, debounceMs);
    } else {
      send();
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [depsKey, data, messageType, debounceMs, enabled]);

  return { data: result, loading, error };
}
