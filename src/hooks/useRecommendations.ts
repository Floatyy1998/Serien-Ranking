import type firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { dbRef, userPath } from '../services/db/ref';
import { queuePush } from '../services/pushQueue';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type {
  Recommendation,
  RecommendationMediaType,
  RecommendationStatus,
} from '../types/Recommendation';

interface SendRecommendationInput {
  recipientUids: string[];
  media: {
    id: number;
    type: RecommendationMediaType;
    title: string;
    posterPath?: string;
    backdropPath?: string;
  };
  message?: string;
}

interface UseRecommendationsReturn {
  recommendations: Recommendation[];
  pendingCount: number;
  loading: boolean;
  send: (input: SendRecommendationInput) => Promise<number>;
  accept: (id: string) => Promise<void>;
  decline: (id: string) => Promise<void>;
}

export function useRecommendations(): UseRecommendationsReturn {
  const { user } = useAuth() || {};
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = dbRef(userPath(user.uid, 'recommendations'));

    const handle = (snap: firebase.database.DataSnapshot) => {
      const data = snap.val();
      if (!data) {
        setRecommendations([]);
        setLoading(false);
        return;
      }
      const list: Recommendation[] = Object.entries(
        data as Record<string, Omit<Recommendation, 'id'>>
      ).map(([id, rec]) => ({ id, ...rec }));
      list.sort((a, b) => b.timestamp - a.timestamp);
      setRecommendations(list);
      setLoading(false);
    };

    ref.on('value', handle);
    return () => {
      ref.off('value', handle);
    };
  }, [user]);

  const pendingCount = useMemo(
    () => recommendations.filter((r) => r.status === 'pending').length,
    [recommendations]
  );

  const send = useCallback(
    async ({ recipientUids, media, message }: SendRecommendationInput): Promise<number> => {
      if (!user || recipientUids.length === 0) return 0;

      const senderName =
        (user.displayName && user.displayName.trim()) ||
        (user.email && user.email.split('@')[0]) ||
        'Unbekannt';

      const base: Omit<Recommendation, 'id'> = {
        mediaId: media.id,
        mediaType: media.type,
        mediaTitle: media.title,
        ...(media.posterPath ? { mediaPoster: media.posterPath } : {}),
        ...(media.backdropPath ? { mediaBackdrop: media.backdropPath } : {}),
        senderUid: user.uid,
        senderName,
        ...(user.photoURL ? { senderPhotoURL: user.photoURL } : {}),
        ...(message && message.trim() ? { message: message.trim() } : {}),
        timestamp: Date.now(),
        status: 'pending',
      };

      await Promise.all(
        recipientUids.map((uid) => dbRef(userPath(uid, 'recommendations')).push(base))
      );
      const pushBody =
        message && message.trim() ? `${media.title} — „${message.trim()}“` : media.title;
      await Promise.all(
        recipientUids.map((uid) =>
          queuePush(uid, { title: `🎬 Empfehlung von ${senderName}`, body: pushBody, url: '/' })
        )
      );
      return recipientUids.length;
    },
    [user]
  );

  const updateStatus = useCallback(
    async (id: string, status: RecommendationStatus): Promise<void> => {
      if (!user) return;
      await dbRef(userPath(user.uid, 'recommendations', id, 'status')).set(status);
    },
    [user]
  );

  const accept = useCallback((id: string) => updateStatus(id, 'accepted'), [updateStatus]);
  const decline = useCallback((id: string) => updateStatus(id, 'declined'), [updateStatus]);

  return { recommendations, pendingCount, loading, send, accept, decline };
}
