import { useEffect, useRef, useState, type RefObject } from 'react';

export function useHeroCtaVisible(ready: boolean): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const node = ref.current;
    if (!ready || !node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting || entry.boundingClientRect.top > 0)
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready]);
  return [ref, visible];
}
