import { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { hapticSuccess } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';
import {
  folderDisplayName,
  folderItemKey,
  type RatingFolder,
} from '../../lib/rating/ratingFolders';
import { t } from '../../services/i18n';
import {
  addRatingFolderItems,
  removeRatingFolderItems,
} from '../../services/rating/ratingFoldersService';
import {
  markMoviesWatched,
  markSeriesWatched,
  setMediaOwned,
} from '../../services/series/mediaBulk';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import type { PreparedItem } from './ratingsHelpers';

const refOf = (item: PreparedItem) => ({
  type: item.isMovie ? ('movie' as const) : ('series' as const),
  id: item.id,
});

const keyOf = (item: PreparedItem) => folderItemKey(item.isMovie ? 'movie' : 'series', item.id);

/** Sammelaktionen für ausgewählte Serien und Filme auf der Bewertungsseite. */
export function useRatingsBulk() {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const { movieList } = useMovieList();
  const { allSeriesList } = useSeriesList();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (work: (uid: string) => Promise<string>) => {
      if (!uid) return false;
      setBusy(true);
      try {
        const message = await work(uid);
        hapticSuccess();
        showToast(message, 2200);
        return true;
      } catch {
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [uid]
  );

  const setOwned = useCallback(
    (items: PreparedItem[], owned: boolean) =>
      run(async (id) => {
        await setMediaOwned(id, items.filter((i) => !!i.owned !== owned).map(refOf), owned);
        return owned
          ? t('{n} Titel als Besitz markiert', { n: items.length })
          : t('{n} Titel nicht mehr im Besitz', { n: items.length });
      }),
    [run]
  );

  /** Filme: `earlier` = früher gesehen (ohne Datum). Serien: alle erschienenen Folgen. */
  const markWatched = useCallback(
    (items: PreparedItem[], earlier: boolean) =>
      run(async (id) => {
        const movieIds = new Set(items.filter((i) => i.isMovie).map((i) => i.id));
        const seriesIds = new Set(items.filter((i) => !i.isMovie).map((i) => i.id));
        const movies = movieList.filter((m): m is Movie => movieIds.has(m.id));
        const series = allSeriesList.filter((s): s is Series => seriesIds.has(s.id));
        const films = movies.length ? await markMoviesWatched(id, movies, earlier) : 0;
        const episodes = series.length ? await markSeriesWatched(id, series) : 0;
        if (!films && !episodes) return t('Alle schon gesehen');
        return t('{n} Titel als gesehen markiert', { n: items.length });
      }),
    [run, movieList, allSeriesList]
  );

  const addToFolder = useCallback(
    (items: PreparedItem[], folder: RatingFolder) =>
      run(async (id) => {
        await addRatingFolderItems(id, folder.id, items.map(keyOf));
        return t('{n} Titel zu „{name}" hinzugefügt', {
          n: items.length,
          name: folderDisplayName(folder),
        });
      }),
    [run]
  );

  const removeFromFolder = useCallback(
    (items: PreparedItem[], folder: RatingFolder) =>
      run(async (id) => {
        await removeRatingFolderItems(id, folder.id, items.map(keyOf));
        return t('{n} Titel aus „{name}" entfernt', {
          n: items.length,
          name: folderDisplayName(folder),
        });
      }),
    [run]
  );

  return { busy, setOwned, markWatched, addToFolder, removeFromFolder };
}
