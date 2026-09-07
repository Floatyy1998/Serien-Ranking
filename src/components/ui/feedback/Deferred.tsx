import type { ReactNode } from 'react';
import { startTransition, useEffect, useState } from 'react';

interface DeferredProps {
  children: ReactNode;
  placeholder?: ReactNode;
}

// Mountet children erst nach dem ersten Paint (als unterbrechbare Transition)
export const Deferred = ({ children, placeholder = null }: DeferredProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      startTransition(() => setReady(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return <>{ready ? children : placeholder}</>;
};
