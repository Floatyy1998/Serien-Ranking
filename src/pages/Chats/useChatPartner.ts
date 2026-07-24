import { useEffect, useMemo, useState } from 'react';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { dbGet } from '../../services/db/ref';
import { t } from '../../services/i18n';

export interface ChatPartner {
  uid: string;
  name: string;
  photoURL?: string;
  isFriend: boolean;
  isOnline?: boolean;
}

/**
 * Anzeige-Daten des Gegenübers: bevorzugt aus der Freundesliste, sonst
 * (Ex-Freund / entfernter Kontakt) aus dem öffentlichen Suchindex.
 */
export function useChatPartner(uid: string | undefined): ChatPartner | null {
  const { friends } = useOptimizedFriends();
  const friend = useMemo(() => friends.find((f) => f.uid === uid), [friends, uid]);
  const [fallback, setFallback] = useState<{ name: string; photoURL?: string } | null>(null);

  useEffect(() => {
    if (!uid || friend) return;
    let cancelled = false;
    dbGet<{ displayName?: string; username?: string; photoURL?: string }>(`userSearchIndex/${uid}`)
      .then((val) => {
        if (cancelled) return;
        setFallback({
          name: val?.displayName || val?.username || t('Unbekannt'),
          photoURL: val?.photoURL,
        });
      })
      .catch(() => {
        if (!cancelled) setFallback({ name: t('Unbekannt') });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, friend]);

  if (!uid) return null;
  if (friend) {
    return {
      uid,
      name: friend.displayName || friend.username,
      photoURL: friend.photoURL,
      isFriend: true,
      isOnline: friend.isOnline,
    };
  }
  if (fallback) return { uid, name: fallback.name, photoURL: fallback.photoURL, isFriend: false };
  return { uid, name: '…', isFriend: false };
}
