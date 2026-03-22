import { useCallback, useState } from 'react';
import { useAuth } from '../../App';
import { trackMovieAdded, trackSeriesAdded } from '../../firebase/analytics';
import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import type { DiscoverItem } from './DiscoverItemCard';

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
}

export const useDiscoverActions = (
  setResults: React.Dispatch<React.SetStateAction<DiscoverItem[]>>,
  setSearchResults: React.Dispatch<React.SetStateAction<DiscoverItem[]>>,
  setRecommendations: React.Dispatch<React.SetStateAction<DiscoverItem[]>>
): UseDiscoverActionsResult => {
  const { user } = useAuth()!;

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

  const addToList = useCallback(
    async (item: DiscoverItem, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }

      if (!user) {
        setDialog({
          open: true,
          message: 'Bitte einloggen um Inhalte hinzuzufügen!',
          type: 'warning',
        });
        return;
      }

      const itemKey = `${item.type}-${item.id}`;
      setAddingItem(itemKey);

      const endpoint =
        item.type === 'series'
          ? `${import.meta.env.VITE_BACKEND_API_URL}/add`
          : `${import.meta.env.VITE_BACKEND_API_URL}/addMovie`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: import.meta.env.VITE_USER,
            id: item.id,
            uuid: user.uid,
          }),
        });

        if (response.ok) {
          removeFromResults(item.id);

          const addedTitle = item.title || item.name;
          setSnackbar({
            open: true,
            message: `"${addedTitle}" wurde erfolgreich hinzugefügt!`,
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
    [user, removeFromResults]
  );

  return {
    addingItem,
    snackbar,
    dialog,
    setDialog,
    addToList,
    removeFromResults,
  };
};
