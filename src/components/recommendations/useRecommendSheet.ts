import { dbRef, userPath } from '../../services/db/ref';
import { useEffect, useMemo, useState } from 'react';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useRecommendations } from '../../hooks/useRecommendations';
import { showToast } from '../../lib/toast';
import type { RecommendationMediaType } from '../../types/Recommendation';

/** Medien-Payload, die im RecommendSheet empfohlen wird. */
export interface RecommendSheetMedia {
  id: number;
  type: RecommendationMediaType;
  title: string;
  posterPath?: string;
  backdropPath?: string;
}

interface UseRecommendSheetArgs {
  isOpen: boolean;
  onClose: () => void;
  media: RecommendSheetMedia;
}

/**
 * Kapselt den kompletten State und die Logik des RecommendSheets:
 * Freundes-Auswahl, Library-Check, Nachricht und Senden.
 */
export const useRecommendSheet = ({ isOpen, onClose, media }: UseRecommendSheetArgs) => {
  const { friends } = useOptimizedFriends();
  const { send } = useRecommendations();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [friendsWithMedia, setFriendsWithMedia] = useState<Set<string>>(new Set());
  const [checkingLibrary, setCheckingLibrary] = useState(false);

  // Check which friends already have this series/movie in their library.
  // Punkt-Query per Friend (~500 Bytes) statt Full-Read der series/movies-Liste.
  useEffect(() => {
    if (!isOpen || friends.length === 0) {
      setFriendsWithMedia(new Set());
      return;
    }
    let cancelled = false;
    setCheckingLibrary(true);
    const subPath = media.type === 'series' ? 'series' : 'movies';
    Promise.all(
      friends.map(async (friend) => {
        try {
          const snap = await dbRef(userPath(friend.uid, subPath, media.id)).once('value');
          return snap.exists() ? friend.uid : null;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setFriendsWithMedia(new Set(results.filter((uid): uid is string => uid !== null)));
      setCheckingLibrary(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, friends, media.id, media.type]);

  // Sort: available first, then those who already have it. Alphabetical within each group.
  const sortedFriends = useMemo(() => {
    const byName = (a: { displayName?: string; username?: string }, b: typeof a) =>
      (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '');
    const available = friends.filter((f) => !friendsWithMedia.has(f.uid)).sort(byName);
    const owned = friends.filter((f) => friendsWithMedia.has(f.uid)).sort(byName);
    return [...available, ...owned];
  }, [friends, friendsWithMedia]);

  const availableCount = friends.length - friendsWithMedia.size;

  const toggleFriend = (uid: string) => {
    if (friendsWithMedia.has(uid)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleClose = () => {
    if (sending) return;
    setSelected(new Set());
    setMessage('');
    onClose();
  };

  const handleSend = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    try {
      const count = await send({
        recipientUids: Array.from(selected),
        media,
        message: message.trim() || undefined,
      });
      showToast(count === 1 ? `Empfehlung gesendet` : `An ${count} Freunde gesendet`, 1800);
      setSelected(new Set());
      setMessage('');
      onClose();
    } catch (err) {
      console.error('Failed to send recommendation', err);
      showToast('Senden fehlgeschlagen', 2000, 'error');
    } finally {
      setSending(false);
    }
  };

  const hasFriends = sortedFriends.length > 0;

  return {
    selected,
    message,
    setMessage,
    sending,
    friendsWithMedia,
    checkingLibrary,
    sortedFriends,
    availableCount,
    hasFriends,
    toggleFriend,
    handleClose,
    handleSend,
  };
};
