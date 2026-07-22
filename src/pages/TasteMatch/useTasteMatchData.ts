import { dbRef, paths } from '../../services/db/ref';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPublicUserFields } from '../../services/firebase/userDisplayData';
import type { TasteMatchResult } from '../../services/tasteMatchService';
import { calculateTasteMatch } from '../../services/tasteMatchService';
import { t } from '../../services/i18n';
import { copyTextToClipboard } from '../../utils/clipboard';

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#00cec9';
  if (score >= 60) return '#fdcb6e';
  if (score >= 40) return '#e17055';
  return '#636e72';
};

export const getScoreMessage = (score: number): string => {
  if (score >= 80) return t('Seelenverwandte!');
  if (score >= 60) return t('Starke Verbindung');
  if (score >= 40) return t('Interessante Mischung');
  return t('Gegensätze ziehen sich an');
};

export interface TasteMatchData {
  loading: boolean;
  result: TasteMatchResult | null;
  friendName: string;
  friendPhoto: string | null;
  userName: string;
  userPhoto: string | null;
  activeTab: 'overview' | 'series' | 'movies' | 'genres';
  setActiveTab: React.Dispatch<React.SetStateAction<'overview' | 'series' | 'movies' | 'genres'>>;
  handleShare: () => Promise<void>;
}

export const useTasteMatchData = (): TasteMatchData => {
  const { friendId } = useParams<{ friendId: string }>();
  const { user } = useAuth() || {};

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TasteMatchResult | null>(null);
  const [friendName, setFriendName] = useState('Friend');
  const [friendPhoto, setFriendPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState(t('Du'));
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'series' | 'movies' | 'genres'>(
    'overview'
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user || !friendId) return;

      try {
        setLoading(true);

        // Eigener User: Vollknoten-Read bleibt (Owner darf das). Freund:
        // Punkt-Reads, weil users/$other unter den gehärteten Rules nicht
        // mehr komplett lesbar ist — displayName/photoURL bleiben es einzeln.
        const [currentUserSnapshot, friendFields] = await Promise.all([
          dbRef(paths.user(user.uid)).once('value'),
          fetchPublicUserFields(friendId),
        ]);

        const currentUserData = currentUserSnapshot.val();
        setUserName(
          currentUserData?.displayName?.split(' ')[0] || user.displayName?.split(' ')[0] || t('Du')
        );
        setUserPhoto(currentUserData?.photoURL || user.photoURL || null);

        setFriendName(friendFields.displayName?.split(' ')[0] || 'Friend');
        setFriendPhoto(friendFields.photoURL || null);

        const matchResult = await calculateTasteMatch(user.uid, friendId);
        setResult(matchResult);
      } catch (error) {
        console.error('Error calculating taste match:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, friendId]);

  const handleShare = async () => {
    if (!result) return;
    const text = t(
      'Mein Taste Match mit {friend}: {score}% - {series} gemeinsame Serien und {movies} gemeinsame Filme!',
      {
        friend: friendName,
        score: result.overallMatch,
        series: result.seriesOverlap.sharedSeries.length,
        movies: result.movieOverlap.sharedMovies.length,
      }
    );

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Taste Match', text });
      } catch {
        // cancelled
      }
    } else {
      void copyTextToClipboard(text);
    }
  };

  return {
    loading,
    result,
    friendName,
    friendPhoto,
    userName,
    userPhoto,
    activeTab,
    setActiveTab,
    handleShare,
  };
};
