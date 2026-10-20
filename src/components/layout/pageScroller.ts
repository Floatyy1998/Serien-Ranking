let activeScroller: HTMLElement | null = null;

export const isRendered = (el: Element) => el.isConnected && el.getClientRects().length > 0;

export const setActiveScroller = (el: HTMLElement | null) => {
  activeScroller = el;
};

export const currentScroller = (): HTMLElement | null => {
  if (activeScroller && isRendered(activeScroller)) return activeScroller;
  const fallback = Array.from(document.querySelectorAll<HTMLElement>('.mobile-content')).find(
    isRendered
  );
  return fallback ?? null;
};

/** Scrollt den gerade sichtbaren Seiten-Scroller nach oben (Dock-Doppeltipp, Nach-oben-Knopf). */
export const scrollPageToTop = () => {
  currentScroller()?.scrollTo({ top: 0, behavior: 'smooth' });
};
