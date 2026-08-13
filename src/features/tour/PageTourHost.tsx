import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  findTour,
  isNewAccount,
  isTourPending,
  markTourSeen,
  type PageTour,
  type SeenTours,
} from '../../lib/pageTour';
import { loadSeenTours, readSeenTours, writeSeenTours } from '../../services/pageTour';
import { PAGE_TOURS } from './data/pageTours';
import { PageTourSheet } from './PageTourSheet';

/**
 * Zeigt beim ersten Besuch einer Seite einmalig, was man dort tun kann.
 * Einmal in MobileApp gemountet.
 *
 * Nur für Konten, die nach dem Start der Funktion angelegt wurden — wer die App
 * schon benutzt, kennt sie und würde die Hinweise als Störung erleben.
 *
 * Die Verzögerung ist Absicht: erst rendert und animiert die Seite fertig,
 * dann kommt das Sheet. Wer währenddessen weiterklickt, sieht es gar nicht —
 * der Timer wird beim Routenwechsel verworfen.
 */
const OPEN_DELAY_MS = 1200;

export const PageTourHost = () => {
  const { pathname } = useLocation();
  const { user } = useAuth() || {};
  const [tour, setTour] = useState<PageTour | null>(null);
  const openRef = useRef(false);
  const seenRef = useRef<SeenTours>(readSeenTours());

  const uid = user?.uid;
  const eligible = isNewAccount(user?.metadata?.creationTime);

  // Kontostand einmalig nachladen, damit ein zweites Gerät nicht alles wiederholt.
  useEffect(() => {
    if (!eligible || !uid) return;
    let cancelled = false;
    loadSeenTours(uid).then((seen) => {
      if (!cancelled) seenRef.current = seen;
    });
    return () => {
      cancelled = true;
    };
  }, [eligible, uid]);

  useEffect(() => {
    if (!eligible || openRef.current) return;

    const candidate = findTour(PAGE_TOURS, pathname);
    if (!candidate || !isTourPending(seenRef.current, candidate)) return;

    const timer = window.setTimeout(() => {
      if (!isTourPending(seenRef.current, candidate)) return;
      openRef.current = true;
      setTour(candidate);
    }, OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, eligible]);

  const close = useCallback(() => {
    setTour((current) => {
      if (current) {
        seenRef.current = markTourSeen(seenRef.current, current);
        writeSeenTours(seenRef.current, uid);
      }
      return null;
    });
    openRef.current = false;
  }, [uid]);

  if (!eligible) return null;

  return <PageTourSheet tour={tour} onClose={close} />;
};
