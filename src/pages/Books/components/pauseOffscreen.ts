let observer: IntersectionObserver | undefined;

const mark = (entries: IntersectionObserverEntry[]) => {
  for (const entry of entries)
    entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting);
};

/** Ref-Callback: Lade-Schimmer außerhalb des Bildschirms ruhen; sichtbare laufen unverändert weiter. */
export function pauseOffscreen(el: Element | null): (() => void) | undefined {
  if (!el || typeof IntersectionObserver === 'undefined') return undefined;
  observer ??= new IntersectionObserver(mark, { rootMargin: '150px' });
  observer.observe(el);
  return () => {
    observer?.unobserve(el);
    el.removeAttribute('data-offscreen');
  };
}
