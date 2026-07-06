import type { ReactNode } from 'react';
import { MangaListProvider } from './contexts/MangaListProvider';
import { MovieListProvider } from './contexts/MovieListProvider';
import { NotificationProvider as GeneralNotificationProvider } from './contexts/NotificationProvider';
import { OptimizedFriendsProvider } from './contexts/OptimizedFriendsProvider';
import { SeriesListProvider } from './contexts/OptimizedSeriesListProvider';
import { RatingsStateProvider } from './contexts/RatingsStateProvider';
import { BadgeProvider } from './features/badges/BadgeProvider';
import { StatsProvider } from './features/stats/StatsProvider';

/**
 * Bündelt alle Daten-Provider der App in fester Reihenfolge (außen → innen):
 * Friends → Notifications → Series → Movies → Manga → Stats → Badges → RatingsState.
 * Die Reihenfolge ist load-bearing (innere Provider konsumieren äußere Contexts) —
 * beim Ergänzen neuer Provider hier einhängen, nicht in App.tsx.
 * Alle Context-values müssen useMemo-memoized bleiben (Performance-Regel).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <OptimizedFriendsProvider>
      <GeneralNotificationProvider>
        <SeriesListProvider>
          <MovieListProvider>
            <MangaListProvider>
              <StatsProvider>
                <BadgeProvider>
                  <RatingsStateProvider>{children}</RatingsStateProvider>
                </BadgeProvider>
              </StatsProvider>
            </MangaListProvider>
          </MovieListProvider>
        </SeriesListProvider>
      </GeneralNotificationProvider>
    </OptimizedFriendsProvider>
  );
}
