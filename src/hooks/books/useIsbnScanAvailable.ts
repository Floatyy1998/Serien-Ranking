import { useEffect, useState } from 'react';
import { isbnScanAvailable } from '../../services/books/isbnScanner';

export function useIsbnScanAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let alive = true;
    void isbnScanAvailable().then((ok) => {
      if (alive) setAvailable(ok);
    });
    return () => {
      alive = false;
    };
  }, []);
  return available;
}
