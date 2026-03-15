/**
 * useTasteMatchData - Custom Hook fuer TasteMatch Daten-Loading und State
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import {
  trackTasteMatchTabSwitched,
  trackTasteMatchShared,
  trackTasteMatchViewed,
} from '../../firebase/analytics';
import { calculateTasteMatch, TasteMatchResult } from '../../services/tasteMatchService';

export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#00cec9';
  if (score >= 60) return '#fdcb6e';
  if (score >= 40) return '#e17055';
  return '#636e72';
};

export const getScoreMessage = (score: number): string => {
  if (score >= 80) return 'Seelenverwandte!';
  if (score >= 60) return 'Starke Verbindung';
  if (score >= 40) return 'Interessante Mischung';
  return 'Gegensätze ziehen sich an';
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
  const { user } = useAuth()!;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TasteMatchResult | null>(null);
  const [friendName, setFriendName] = useState('Friend');
  const [friendPhoto, setFriendPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState('Du');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'series' | 'movies' | 'genres'>(
    'overview'
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user || !friendId) return;

      try {
        setLoading(true);

        const [currentUserSnapshot, friendSnapshot] = await Promise.all([
          firebase.database().ref(`users/${user.uid}`).once('value'),
          firebase.database().ref(`users/${friendId}`).once('value'),
        ]);

        const currentUserData = currentUserSnapshot.val();
        setUserName(
          currentUserData?.displayName?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Du'
        );
        setUserPhoto(currentUserData?.photoURL || user.photoURL || null);

        const friendData = friendSnapshot.val();
        setFriendName(friendData?.displayName?.split(' ')[0] || 'Friend');
        setFriendPhoto(friendData?.photoURL || null);

        const matchResult = await calculateTasteMatch(user.uid, friendId);
        setResult(matchResult);
        trackTasteMatchViewed(friendData?.displayName?.split(' ')[0] || 'Friend');
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
    trackTasteMatchShared(friendName);
    const text = `Mein Taste Match mit ${friendName}: ${result.overallMatch}% - ${result.seriesOverlap.sharedSeries.length} gemeinsame Serien und ${result.movieOverlap.sharedMovies.length} gemeinsame Filme!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Taste Match', text });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
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
    setActiveTab: ((tab: 'overview' | 'series' | 'movies' | 'genres') => {
      setActiveTab(tab);
      trackTasteMatchTabSwitched(tab);
    }) as React.Dispatch<React.SetStateAction<'overview' | 'series' | 'movies' | 'genres'>>,
    handleShare,
  };
};
