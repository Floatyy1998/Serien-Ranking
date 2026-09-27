import { useCallback, useEffect, useMemo, useState } from 'react';
import { QuickRatingSheet } from '../../components/ui/overlay/QuickRatingSheet';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useQuickRatingSheet } from '../../hooks/rating/useQuickRatingSheet';
import { useRatingFolders } from '../../hooks/rating/useRatingFolders';
import { hapticTap } from '../../lib/interaction/haptics';
import { readMediaTarget, type MediaTarget } from '../../lib/interaction/mediaTarget';
import { showToast } from '../../lib/interaction/toast';
import { calculateOverallRating, isMovieWatched } from '../../lib/rating/rating';
import { folderItemKey, type RatingFolder } from '../../lib/rating/ratingFolders';
import {
  RatingFolderSheet,
  type RatingFolderSheetState,
} from '../../pages/Ratings/RatingFolderSheet';
import { t } from '../../services/i18n';
import { setRatingFolderItem } from '../../services/rating/ratingFoldersService';
import { markMovieWatched } from '../../services/rating/quickRating';
import { addToLibrary } from '../../services/series/addToLibrary';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { MediaActionsSheet, type MediaActionsState } from './MediaActionsSheet';

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;

const posterOf = (item: Series | Movie | undefined): string | undefined => {
  const raw = item?.poster;
  const path = typeof raw === 'object' ? raw?.poster : raw;
  return typeof path === 'string' && path ? path : undefined;
};

/** Langer Druck oder Rechtsklick auf markierte Serien-/Filmkarten öffnet das Aktions-Sheet. */
export const MediaActionsHost = () => {
  const { user } = useAuth() || {};
  const { allSeriesList, refetchAfterAdd } = useSeriesList();
  const { movieList } = useMovieList();
  const { folders } = useRatingFolders();
  const [target, setTarget] = useState<MediaTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  const [folderSheet, setFolderSheet] = useState<RatingFolderSheetState>({ open: false });
  const notify = useCallback((message: string) => showToast(message, 2500), []);
  const { quickRating, openQuickRating, closeQuickRating, saveQuickRating } = useQuickRatingSheet({
    onSaved: notify,
    onError: notify,
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let start: { x: number; y: number } | null = null;
    let fired: { el: Element; at: number } | null = null;
    const recentlyFired = () => !!fired && Date.now() - fired.at < 1500;

    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      start = null;
    };
    const fire = (el: Element, found: MediaTarget) => {
      fired = { el, at: Date.now() };
      hapticTap();
      setTarget(found);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = e.target as Element;
      const found = readMediaTarget(el);
      if (!found) return;
      start = { x: e.clientX, y: e.clientY };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fire(el.closest('[data-media-id]') ?? el, found);
      }, LONG_PRESS_MS);
    };
    const onMove = (e: PointerEvent) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE) cancel();
    };
    const onContextMenu = (e: MouseEvent) => {
      const el = e.target as Element;
      const found = readMediaTarget(el);
      if (!found) return;
      e.preventDefault();
      cancel();
      if (recentlyFired()) return;
      fire(el.closest('[data-media-id]') ?? el, found);
    };
    const onClick = (e: MouseEvent) => {
      if (!fired) return;
      const swallow = recentlyFired() && fired.el.contains(e.target as Node);
      fired = null;
      if (!swallow) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const opts = { capture: true } as const;
    document.addEventListener('pointerdown', onDown, opts);
    document.addEventListener('pointermove', onMove, opts);
    document.addEventListener('pointerup', cancel, opts);
    document.addEventListener('pointercancel', cancel, opts);
    document.addEventListener('scroll', cancel, opts);
    document.addEventListener('contextmenu', onContextMenu, opts);
    document.addEventListener('click', onClick, opts);
    return () => {
      cancel();
      document.removeEventListener('pointerdown', onDown, opts);
      document.removeEventListener('pointermove', onMove, opts);
      document.removeEventListener('pointerup', cancel, opts);
      document.removeEventListener('pointercancel', cancel, opts);
      document.removeEventListener('scroll', cancel, opts);
      document.removeEventListener('contextmenu', onContextMenu, opts);
      document.removeEventListener('click', onClick, opts);
    };
  }, []);

  const owned = useMemo<Series | Movie | undefined>(() => {
    if (!target) return undefined;
    return target.type === 'series'
      ? allSeriesList.find((s) => s.id === target.id)
      : movieList.find((m) => m.id === target.id);
  }, [target, allSeriesList, movieList]);

  const state = useMemo<MediaActionsState | null>(() => {
    if (!target) return null;
    const rating = owned ? parseFloat(calculateOverallRating(owned)) || 0 : 0;
    return {
      target,
      title: owned?.title || (owned as Series | undefined)?.name || target.title || '',
      poster: posterOf(owned) ?? target.poster ?? undefined,
      owned: !!owned || added.has(`${target.type}-${target.id}`),
      rating,
      watched: target.type === 'movie' && !!owned && isMovieWatched(owned as Movie),
    };
  }, [target, owned, added]);

  const close = useCallback(() => setTarget(null), []);

  const ensureOwned = useCallback(async (): Promise<boolean> => {
    if (!user || !state) return false;
    if (state.owned) return true;
    setBusy(true);
    try {
      const result = await addToLibrary(
        user.uid,
        {
          id: state.target.id,
          type: state.target.type,
          title: state.title,
          posterPath: state.poster,
        },
        'long_press'
      );
      if (result === 'failed') {
        showToast(t('Hinzufügen fehlgeschlagen'), 2500, 'error');
        return false;
      }
      setAdded((prev) => new Set(prev).add(`${state.target.type}-${state.target.id}`));
      if (state.target.type === 'series') void refetchAfterAdd(state.target.id);
      if (result === 'added') {
        showToast(t('„{title}" hinzugefügt', { title: state.title }), 2000);
      }
      return true;
    } catch {
      showToast(t('Hinzufügen fehlgeschlagen'), 2500, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }, [user, state, refetchAfterAdd]);

  const handleAdd = useCallback(async () => {
    if (await ensureOwned()) close();
  }, [ensureOwned, close]);

  const handleRate = useCallback(async () => {
    if (!state || !(await ensureOwned())) return;
    close();
    openQuickRating({
      id: state.target.id,
      type: state.target.type,
      title: state.title,
      userRating: state.rating,
    });
  }, [state, ensureOwned, close, openQuickRating]);

  const handleMarkWatched = useCallback(async () => {
    if (!user || !state || !(await ensureOwned())) return;
    close();
    try {
      await markMovieWatched(user.uid, state.target.id);
      openQuickRating({ id: state.target.id, type: 'movie', title: state.title }, true);
    } catch {
      showToast(t('Der Gesehen-Status konnte nicht gespeichert werden.'), 2500, 'error');
    }
  }, [user, state, ensureOwned, close, openQuickRating]);

  const handleToggleFolder = useCallback(
    async (folder: RatingFolder) => {
      if (!user || !state || !(await ensureOwned())) return;
      hapticTap();
      const key = folderItemKey(state.target.type, state.target.id);
      try {
        await setRatingFolderItem(user.uid, folder.id, key, !folder.items.has(key));
      } catch {
        showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
      }
    },
    [user, state, ensureOwned]
  );

  const handleCreateFolder = useCallback(async () => {
    if (!state || !(await ensureOwned())) return;
    const key = folderItemKey(state.target.type, state.target.id);
    close();
    setFolderSheet({ open: true, folder: null, preselect: [key] });
  }, [state, ensureOwned, close]);

  if (!user) return null;

  return (
    <>
      <MediaActionsSheet
        state={state}
        folders={folders}
        busy={busy}
        onClose={close}
        onAdd={() => void handleAdd()}
        onRate={() => void handleRate()}
        onMarkWatched={() => void handleMarkWatched()}
        onToggleFolder={(folder) => void handleToggleFolder(folder)}
        onCreateFolder={() => void handleCreateFolder()}
      />
      <QuickRatingSheet
        isOpen={quickRating.open}
        onClose={closeQuickRating}
        seriesTitle={quickRating.title}
        eyebrow={quickRating.afterWatched ? t('Als gesehen markiert') : t('In deiner Liste')}
        initialRating={quickRating.initialRating}
        genres={quickRating.genres}
        mediaType={quickRating.mediaType}
        itemId={quickRating.itemId}
        initialGenreRatings={quickRating.genreRatings}
        onRate={saveQuickRating}
      />
      <RatingFolderSheet
        state={folderSheet}
        onClose={() => setFolderSheet({ open: false })}
        onDeleted={() => {}}
      />
    </>
  );
};
