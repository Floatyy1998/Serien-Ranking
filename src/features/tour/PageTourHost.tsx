import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { findTour, isTourPending, markTourSeen, type PageTour } from '../../lib/pageTour';
import { readSeenTours, writeSeenTours } from '../../services/pageTour';
import { PAGE_TOURS } from './data/pageTours';
import { PageTourSheet } from './PageTourSheet';

/**
 * Zeigt beim ersten Besuch einer Seite einmalig, was man dort tun kann.
 * Einmal in MobileApp gemountet.
 *
 * Die Verzögerung ist Absicht: erst rendert und animiert die Seite fertig,
 * dann kommt das Sheet. Wer währenddessen weiterklickt, sieht es gar nicht —
 * der Timer wird beim Routenwechsel verworfen.
 */
const OPEN_DELAY_MS = 1200;

export const PageTourHost = () => {
  const { pathname } = useLocation();
  const [tour, setTour] = useState<PageTour | null>(null);
  const openRef = useRef(false);

  useEffect(() => {
    if (openRef.current) return;

    const candidate = findTour(PAGE_TOURS, pathname);
    if (!candidate || !isTourPending(readSeenTours(), candidate)) return;

    const timer = window.setTimeout(() => {
      openRef.current = true;
      setTour(candidate);
    }, OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const close = useCallback(() => {
    setTour((current) => {
      if (current) writeSeenTours(markTourSeen(readSeenTours(), current));
      return null;
    });
    openRef.current = false;
  }, []);

  return <PageTourSheet tour={tour} onClose={close} />;
};
