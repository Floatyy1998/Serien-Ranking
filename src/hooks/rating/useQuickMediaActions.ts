import { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { isMovieWatched, overallRatingValue } from '../../lib/rating/rating';
import { t } from '../../services/i18n';
import { markMovieWatched } from '../../services/rating/quickRating';
import { addToLibrary, type AddToLibraryResult } from '../../services/series/addToLibrary';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { useQuickRatingSheet } from './useQuickRatingSheet';

export interface QuickMediaItem {
  id: number;
  type: 'series' | 'movie';
  title: string;
  poster_path?: string;
}

interface Options {
  source: string;
  notify: (message: string) => void;
}

export const quickMediaKey = (item: Pick<QuickMediaItem, 'id' | 'type'>) =>
  `${item.type}-${item.id}`;

export function useQuickMediaActions({ source, notify }: Options) {
  const { user } = useAuth() || {};
  const { allSeriesList, refetchAfterAdd } = useSeriesList();
  const { movieList } = useMovieList();
  const [addedKeys, setAddedKeys] = useState<Set<string>>(() => new Set());
  const [watchedKeys, setWatchedKeys] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState<{ key: string; action: 'add' | 'watched' } | null>(null);
  const sheet = useQuickRatingSheet({ onSaved: notify, onError: notify });
  const { openQuickRating } = sheet;

  const ownedOf = useCallback(
    (item: Pick<QuickMediaItem, 'id' | 'type'>): Series | Movie | undefined =>
      item.type === 'series'
        ? allSeriesList.find((s: Series) => s.id === item.id)
        : movieList.find((m: Movie) => m.id === item.id),
    [allSeriesList, movieList]
  );

  const requestAdd = useCallback(
    async (item: QuickMediaItem, uid: string): Promise<AddToLibraryResult> => {
      const result = await addToLibrary(
        uid,
        { id: item.id, type: item.type, title: item.title, posterPath: item.poster_path },
        source
      );
      if (result === 'added') {
        setAddedKeys((prev) => new Set(prev).add(quickMediaKey(item)));
        if (item.type === 'series') void refetchAfterAdd(item.id);
      }
      return result;
    },
    [refetchAfterAdd, source]
  );

  const add = useCallback(
    async (item: QuickMediaItem, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      setPending({ key: quickMediaKey(item), action: 'add' });
      const isSeries = item.type === 'series';
      const failedText = isSeries
        ? t('Fehler beim Hinzufügen der Serie.')
        : t('Fehler beim Hinzufügen des Films.');
      try {
        const result = await requestAdd(item, user.uid);
        if (result === 'added') {
          notify(t('„{title}" hinzugefügt', { title: item.title }));
        } else if (result === 'exists') {
          notify(
            isSeries
              ? t('Serie ist bereits in deiner Liste!')
              : t('Film ist bereits in deiner Liste!')
          );
        } else {
          notify(failedText);
        }
      } catch (err) {
        console.error('Quick add failed:', err);
        notify(failedText);
      } finally {
        setPending(null);
      }
    },
    [user, requestAdd, notify]
  );

  const markWatched = useCallback(
    async (item: QuickMediaItem, inList: boolean, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user || item.type !== 'movie') return;
      const key = quickMediaKey(item);
      setPending({ key, action: 'watched' });
      try {
        if (!inList && (await requestAdd(item, user.uid)) === 'failed') {
          throw new Error('add failed');
        }
        await markMovieWatched(user.uid, item.id);
        setWatchedKeys((prev) => new Set(prev).add(key));
        openQuickRating({ id: item.id, type: item.type, title: item.title }, true);
      } catch (err) {
        console.error('Quick mark watched failed:', err);
        notify(t('Der Gesehen-Status konnte nicht gespeichert werden.'));
      } finally {
        setPending(null);
      }
    },
    [user, requestAdd, openQuickRating, notify]
  );

  const rate = useCallback(
    (item: QuickMediaItem, userRating: number, e: React.MouseEvent) => {
      e.stopPropagation();
      openQuickRating({ id: item.id, type: item.type, title: item.title, userRating });
    },
    [openQuickRating]
  );

  const statusOf = useCallback(
    (item: Pick<QuickMediaItem, 'id' | 'type'>) => {
      const key = quickMediaKey(item);
      const owned = ownedOf(item);
      const watched =
        item.type === 'movie' &&
        (watchedKeys.has(key) || (owned !== undefined && isMovieWatched(owned as Movie)));
      return {
        owned,
        added: addedKeys.has(key) || owned !== undefined,
        ownRating: owned ? overallRatingValue(owned) : 0,
        watched,
        busyAction: pending?.key === key ? pending.action : null,
      };
    },
    [ownedOf, addedKeys, watchedKeys, pending]
  );

  return { statusOf, add, markWatched, rate, ...sheet };
}
