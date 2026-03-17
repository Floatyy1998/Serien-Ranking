import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import {
  checkAndArchiveMonth,
  fetchGlobalLeaderboard,
  fetchLeaderboardData,
  fetchLeaderboardProfiles,
  fetchTrophyHistory,
} from '../../services/leaderboardService';
import type {
  GlobalLeaderboardEntry,
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardStats,
  MonthlyTrophy,
} from '../../types/Leaderboard';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Januar',
  '02': 'Februar',
  '03': 'März',
  '04': 'April',
  '05': 'Mai',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'August',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Dezember',
};

export interface CelebrationData {
  place: number;
  monthLabel: string;
  score: number;
}

export function useLeaderboardData() {
  const { user } = useAuth()!;
  const { friends } = useOptimizedFriends();

  const [mode, setMode] = useState<'friends' | 'global'>('friends');
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('episodesThisMonth');
  const [statsData, setStatsData] = useState<Record<string, LeaderboardStats>>({});
  const [profiles, setProfiles] = useState<
    Record<string, { displayName: string; photoURL?: string; username?: string }>
  >({});
  const [globalEntries, setGlobalEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [trophies, setTrophies] = useState<MonthlyTrophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll position management
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const saved = sessionStorage.getItem('leaderboard-scroll');
    if (saved) container.scrollTo({ top: parseInt(saved, 10) });
  }, [loading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    let tid: ReturnType<typeof setTimeout>;
    const save = () => {
      clearTimeout(tid);
      tid = setTimeout(
        () => sessionStorage.setItem('leaderboard-scroll', String(container.scrollTop)),
        100
      );
    };
    container.addEventListener('scroll', save, { passive: true });
    return () => {
      container.removeEventListener('scroll', save);
      clearTimeout(tid);
    };
  }, [loading]);

  const loadFriendsData = useCallback(async () => {
    if (!user?.uid) return;
    const friendUids = friends.map((f) => f.uid);
    const [data, profileData] = await Promise.all([
      fetchLeaderboardData(user.uid, friendUids),
      fetchLeaderboardProfiles([user.uid, ...friendUids]),
    ]);
    setStatsData(data);
    setProfiles(profileData);
  }, [user?.uid, friends]);

  const loadGlobalData = useCallback(async () => {
    const entries = await fetchGlobalLeaderboard();
    setGlobalEntries(entries);
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      if (mode === 'friends') await loadFriendsData();
      else await loadGlobalData();
    } catch (error) {
      console.error('[Leaderboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, mode, loadFriendsData, loadGlobalData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Archive previous month + load trophies
  useEffect(() => {
    checkAndArchiveMonth().catch(() => {});
    fetchTrophyHistory()
      .then((loaded) => {
        setTrophies(loaded);
        if (!user?.uid || loaded.length === 0) return;
        const latest = loaded[0];
        const key = `trophy_celebrated_${latest.monthKey}`;
        if (localStorage.getItem(key)) return;
        const entries = [latest.first, latest.second, latest.third];
        const idx = entries.findIndex((e) => e?.uid === user.uid);
        if (idx === -1) return;
        const [, m] = latest.monthKey.split('-');
        localStorage.setItem(key, 'true');
        setCelebration({
          place: idx + 1,
          monthLabel: MONTH_NAMES[m] || m,
          score: entries[idx]!.score,
        });
      })
      .catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [loadData]);

  const rankings: LeaderboardEntry[] = useMemo(() => {
    if (!user?.uid) return [];
    if (mode === 'global') {
      const entries = globalEntries.map((e) => ({
        uid: e.uid,
        displayName: e.displayName,
        photoURL: e.photoURL,
        username: e.username,
        value: e[activeCategory] || 0,
        rank: 0,
        isCurrentUser: e.uid === user.uid,
      }));
      entries.sort((a, b) => b.value - a.value);
      entries.forEach((e, i) => {
        e.rank = i + 1;
      });
      return entries;
    }
    const entries = Object.entries(statsData).map(([uid, stats]) => ({
      uid,
      displayName: profiles[uid]?.displayName || 'Unbekannt',
      photoURL: profiles[uid]?.photoURL,
      username: profiles[uid]?.username,
      value: stats[activeCategory] || 0,
      rank: 0,
      isCurrentUser: uid === user.uid,
    }));
    entries.sort((a, b) => b.value - a.value);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });
    return entries;
  }, [statsData, profiles, activeCategory, user?.uid, mode, globalEntries]);

  const handleSetMode = useCallback((newMode: 'friends' | 'global') => {
    setMode(newMode);
  }, []);

  const handleSetActiveCategory = useCallback((newCategory: LeaderboardCategory) => {
    setActiveCategory(newCategory);
  }, []);

  return {
    user,
    mode,
    setMode: handleSetMode,
    activeCategory,
    setActiveCategory: handleSetActiveCategory,
    rankings,
    trophies,
    loading,
    celebration,
    setCelebration,
    scrollContainerRef,
  };
}
