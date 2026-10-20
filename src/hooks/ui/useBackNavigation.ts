import { useNavigate, useLocation } from 'react-router-dom';
import { useAppFocus } from './useAppFocus';
import { t } from '../../services/i18n';
import { readsFirst } from '../../services/settings/appFocus';

const READING_AREA = /^\/(manga|books|reading)(\/|$)/;

/** Zurück- und Home-Ziel der aktuellen Seite — geteilt von BackButton und der mitwandernden Leiste. */
export const useBackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reader = readsFirst(useAppFocus().focus);
  // Lese-Seiten führen Home zur Lesen-Seite; beim Schwerpunkt Lesen ist das die Startseite.
  const homePath = !reader && READING_AREA.test(location.pathname) ? '/reading' : '/';
  const homeLabel = homePath === '/reading' ? t('Zum Lesen') : t('Zur Startseite');

  const goBack = () => {
    const cameFromRatings = sessionStorage.getItem('cameFromRatings') === 'true';

    const isFromDetailPage =
      location.pathname.includes('/series/') || location.pathname.includes('/movie/');
    const isFromRatingDetail = location.pathname.includes('/rating/');

    // Flag, damit die Discover-Seite ihre Filter beim Zurücknavigieren behält
    if (isFromDetailPage) {
      sessionStorage.setItem('comingFromDetail', 'true');
      sessionStorage.setItem('returnUrl', window.location.pathname);
    }

    // Zurück zu den Ratings: Filter dort ebenfalls erhalten
    if ((isFromDetailPage || isFromRatingDetail) && cameFromRatings) {
      sessionStorage.removeItem('cameFromRatings');
      sessionStorage.setItem('ratingsBackNavigation', 'true');
    }

    // Nur zurückspringen, wenn es eine APP-INTERNE Vorseite gibt. React
    // Router pflegt in BrowserRouter `history.state.idx` (Position im eigenen
    // Verlauf) — idx > 0 heißt "es gibt eine vorherige In-App-Seite".
    // window.history.length war unzuverlässig: es zählt die ganze Browser-
    // Session (auch fremde Einträge), sodass navigate(-1) die App verlassen
    // konnte (z. B. Detailseite als erste Seite via Empfehlungs-Link geöffnet
    // → Zurück landete außerhalb statt auf Home).
    const historyIdx = typeof window.history.state?.idx === 'number' ? window.history.state.idx : 0;
    if (historyIdx > 0) {
      navigate(-1);
    } else {
      navigate(homePath);
    }
  };

  const goHome = () => navigate(homePath);

  return { goBack, goHome, homeLabel };
};
