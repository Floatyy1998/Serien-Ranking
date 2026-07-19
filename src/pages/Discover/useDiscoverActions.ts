import { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { trackMovieAdded, trackSeriesAdded } from '../../services/firebase/analytics';
import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { backendFetch } from '../../services/backendApi';
import { t } from '../../services/i18n';
import type { DiscoverItem } from './discoverItemHelpers';

interface UseDiscoverActionsResult {
  addingItem: string | null;
  snackbar: { open: boolean; message: string };
  dialog: { open: boolean; message: string; type: 'success' | 'error' | 'info' | 'warning' };
  setDialog: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
    }>
  >;
  addToList: (item: DiscoverItem, event?: React.MouseEvent) => Promise<void>;
  removeFromResults: (itemId: number) => void;
  markInList: (item: DiscoverItem) => void;
}

export const useDiscoverActions = (
  setResults: React.Dispatch<React.SetStateAction<DiscoverItem[]>>,
  setSearchResults: React.Dispatch<React.SetStateAction<DiscoverItem[]>>,
  setRecommendations: React.Dispatch<React.SetStateAction<DiscoverItem[]>>
): UseDiscoverActionsResult => {
  const { user } = useAuth() || {};

  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [dialog, setDialog] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', type: 'info' });

  const removeFromResults = useCallback(
    (itemId: number) => {
      setResults((prev) => prev.filter((r) => r.id !== itemId));
      setSearchResults((prev) => prev.filter((r) => r.id !== itemId));
      setRecommendations((prev) => prev.filter((r) => r.id !== itemId));
    },
    [setResults, setSearchResults, setRecommendations]
  );

  // Nach dem Hinzufügen das Item NICHT entfernen, sondern als „in Liste" markieren:
  // Die Karte bleibt sichtbar (nur der +-Button verschwindet) und antippbar, damit
  // man weiterhin auf die Detailseite kommt. (id+type, da TMDB-IDs zwischen tv/movie
  // kollidieren können.)
  const markInList = useCallback(
    (item: DiscoverItem) => {
      const mark = (r: DiscoverItem) =>
        r.id === item.id && r.type === item.type ? { ...r, inList: true } : r;
      setResults((prev) => prev.map(mark));
      setSearchResults((prev) => prev.map(mark));
      setRecommendations((prev) => prev.map(mark));
    },
    [setResults, setSearchResults, setRecommendations]
  );

  const addToList = useCallback(
    async (item: DiscoverItem, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }

      if (!user) {
        setDialog({
          open: true,
          message: t('Bitte einloggen um Inhalte hinzuzufügen!'),
          type: 'warning',
        });
        return;
      }

      const itemKey = `${item.type}-${item.id}`;
      setAddingItem(itemKey);

      try {
        const response = await backendFetch(item.type === 'series' ? '/add' : '/addMovie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: import.meta.env.VITE_USER,
            id: item.id,
            uuid: user.uid,
          }),
        });

        if (response.ok) {
          markInList(item);

          const addedTitle = item.title || item.name;
          setSnackbar({
            open: true,
            message: t('"{title}" wurde erfolgreich hinzugefügt!', { title: addedTitle ?? '' }),
          });

          if (item.type === 'series') {
            trackSeriesAdded(String(item.id), addedTitle || '', 'discover');
          } else {
            trackMovieAdded(String(item.id), addedTitle || '', 'discover');
          }

          const posterPath = item.poster_path ?? undefined;
          if (item.type === 'series') {
            await logSeriesAdded(
              user.uid,
              item.name || item.title || 'Unbekannte Serie',
              item.id,
              posterPath
            );
          } else {
            await logMovieAdded(user.uid, item.title || 'Unbekannter Film', item.id, posterPath);
          }

          setTimeout(() => {
            setSnackbar({ open: false, message: '' });
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to add item:', error);
      } finally {
        setAddingItem(null);
      }
    },
    [user, markInList]
  );

  return {
    addingItem,
    snackbar,
    dialog,
    setDialog,
    addToList,
    removeFromResults,
    markInList,
  };
};
