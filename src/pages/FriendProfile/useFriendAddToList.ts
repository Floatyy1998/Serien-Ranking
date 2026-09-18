/**
 * „Auch hinzufügen" auf dem Freundesprofil: der Titel, den der Freund bewertet
 * hat, landet über denselben /add-Pfad wie Suche und Discover in der eigenen
 * Liste. `inList` kommt aus den eigenen Kontexten, damit die Karten sofort den
 * Haken zeigen, sobald der RTDB-Listener den neuen Eintrag liefert.
 */
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { showToast } from '../../lib/interaction/toast';
import { backendFetch } from '../../services/api/backendApi';
import { trackMovieAdded, trackSeriesAdded } from '../../services/firebase/analytics';
import { t } from '../../services/i18n';
import type { FriendItem } from './useFriendProfileData';

export type FriendAddType = 'series' | 'movie';

export const friendAddKey = (type: FriendAddType, id: number) => `${type}-${id}`;

export const useFriendAddToList = () => {
  const { user } = useAuth() || {};
  const { allSeriesList, refetchAfterAdd } = useSeriesList();
  const { movieList } = useMovieList();
  const [addingKey, setAddingKey] = useState<string | null>(null);

  const ownIds = useMemo(
    () => ({
      series: new Set(allSeriesList.map((s) => s.id)),
      movie: new Set(movieList.map((m) => m.id)),
    }),
    [allSeriesList, movieList]
  );

  const isInOwnList = useCallback(
    (type: FriendAddType, id: number) => ownIds[type].has(id),
    [ownIds]
  );

  const addToOwnList = useCallback(
    async (item: FriendItem, type: FriendAddType) => {
      if (!user) {
        showToast(t('Bitte einloggen, um Inhalte hinzuzufügen'), 2500, 'info');
        return;
      }
      const key = friendAddKey(type, item.id);
      if (addingKey || isInOwnList(type, item.id)) return;
      setAddingKey(key);
      try {
        const response = await backendFetch(type === 'series' ? '/add' : '/addMovie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: import.meta.env.VITE_USER, id: item.id, uuid: user.uid }),
        });
        if (!response.ok) throw new Error(`add failed: ${response.status}`);

        if (type === 'series') {
          void refetchAfterAdd(item.id);
          trackSeriesAdded(String(item.id), item.title, 'friend_profile');
          const { logSeriesAdded } = await import('../../features/badges/minimalActivityLogger');
          await logSeriesAdded(user.uid, item.title, item.id);
        } else {
          trackMovieAdded(String(item.id), item.title, 'friend_profile');
          const { logMovieAdded } = await import('../../features/badges/minimalActivityLogger');
          await logMovieAdded(user.uid, item.title, item.id);
        }
        showToast(t('„{title}" hinzugefügt', { title: item.title }), 2500, 'success');
      } catch (error) {
        console.error('Add from friend profile failed:', error);
        showToast(t('Hinzufügen fehlgeschlagen'), 2500, 'error');
      } finally {
        setAddingKey(null);
      }
    },
    [user, addingKey, isInOwnList, refetchAfterAdd]
  );

  return { addingKey, isInOwnList, addToOwnList };
};
