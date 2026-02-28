import {
  Close,
  EmojiEvents,
  Group,
  LocalFireDepartment,
  Movie,
  PlayCircle,
  Public,
  Timer,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { BackButton, GradientText } from '../../components/ui';
import { Trophy3D } from '../../components/ui/Trophy3D';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useTheme } from '../../contexts/ThemeContext';
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

const CATEGORIES: {
  id: LeaderboardCategory;
  label: string;
  icon: React.ReactNode;
  unit: string;
}[] = [
  {
    id: 'episodesThisMonth',
    label: 'Episoden',
    icon: <PlayCircle sx={{ fontSize: 18 }} />,
    unit: 'Ep.',
  },
  { id: 'moviesThisMonth', label: 'Filme', icon: <Movie sx={{ fontSize: 18 }} />, unit: 'Filme' },
  { id: 'watchtimeThisMonth', label: 'Watchtime', icon: <Timer sx={{ fontSize: 18 }} />, unit: '' },
  {
    id: 'streakThisMonth',
    label: 'Monats-Streak',
    icon: <LocalFireDepartment sx={{ fontSize: 18 }} />,
    unit: 'Tage',
  },
  {
    id: 'streakAllTime',
    label: 'Längste Streak',
    icon: <EmojiEvents sx={{ fontSize: 18 }} />,
    unit: 'Tage',
  },
];

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const PODIUM_HEIGHTS = [140, 110, 90];
const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd

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

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES[month] || month} ${year}`;
}

function formatValue(value: number, category: LeaderboardCategory): string {
  if (category === 'watchtimeThisMonth') {
    if (value >= 60) {
      const h = Math.floor(value / 60);
      const m = value % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${value}m`;
  }
  return String(value);
}

function formatWatchtime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

export const LeaderboardPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth()!;
  const { friends } = useOptimizedFriends();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'friends' | 'global'>('friends');
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('episodesThisMonth');
  const [statsData, setStatsData] = useState<Record<string, LeaderboardStats>>({});
  const [profiles, setProfiles] = useState<
    Record<string, { displayName: string; photoURL?: string; username?: string }>
  >({});
  const [globalEntries, setGlobalEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [trophies, setTrophies] = useState<MonthlyTrophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState<{
    place: number;
    monthLabel: string;
    score: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll position management
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const savedPosition = sessionStorage.getItem('leaderboard-scroll');
    if (savedPosition) {
      container.scrollTo({ top: parseInt(savedPosition, 10) });
    }
  }, [loading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const saveScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem('leaderboard-scroll', String(container.scrollTop));
      }, 100);
    };

    container.addEventListener('scroll', saveScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', saveScroll);
      clearTimeout(timeoutId);
    };
  }, [loading]);

  const bgDefault = currentTheme.background.default;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;

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
      if (mode === 'friends') {
        await loadFriendsData();
      } else {
        await loadGlobalData();
      }
    } catch (error) {
      console.error('[Leaderboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, mode, loadFriendsData, loadGlobalData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Archive previous month + load trophies on mount
  useEffect(() => {
    checkAndArchiveMonth().catch(() => {});
    fetchTrophyHistory()
      .then((loadedTrophies) => {
        setTrophies(loadedTrophies);

        // Prüfe ob der aktuelle User eine Trophäe gewonnen hat (nur einmal zeigen)
        if (!user?.uid || loadedTrophies.length === 0) return;
        const latestTrophy = loadedTrophies[0]; // Neuester Monat (bereits sortiert)
        const celebrationKey = `trophy_celebrated_${latestTrophy.monthKey}`;
        if (localStorage.getItem(celebrationKey)) return;

        const entries = [latestTrophy.first, latestTrophy.second, latestTrophy.third];
        const userEntry = entries.findIndex((e) => e?.uid === user.uid);
        if (userEntry === -1) return;

        const [, monthNum] = latestTrophy.monthKey.split('-');
        const monthLabel = MONTH_NAMES[monthNum] || monthNum;

        localStorage.setItem(celebrationKey, 'true');
        setCelebration({
          place: userEntry + 1,
          monthLabel,
          score: entries[userEntry]!.score,
        });
      })
      .catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadData]);

  const rankings: LeaderboardEntry[] = useMemo(() => {
    if (!user?.uid) return [];

    if (mode === 'global') {
      const entries = globalEntries.map((entry) => ({
        uid: entry.uid,
        displayName: entry.displayName,
        photoURL: entry.photoURL,
        username: entry.username,
        value: entry[activeCategory] || 0,
        rank: 0,
        isCurrentUser: entry.uid === user.uid,
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
    entries.forEach((entry, i) => {
      entry.rank = i + 1;
    });

    return entries;
  }, [statsData, profiles, activeCategory, user?.uid, mode, globalEntries]);

  const topThree = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const activeCat = CATEGORIES.find((c) => c.id === activeCategory)!;

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: bgDefault,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12), transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '3px solid rgba(245, 158, 11, 0.15)',
            borderTopColor: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmojiEvents style={{ fontSize: '24px', color: '#f59e0b' }} />
          </motion.div>
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: textPrimary }}>
            Rangliste wird geladen...
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: textSecondary }}>
            Daten werden abgerufen
          </p>
        </div>
      </div>
    );
  }

  // No friends state (only in friends mode)
  if (mode === 'friends' && rankings.length <= 1) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: bgDefault,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            padding: '16px 20px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <BackButton />
          <GradientText
            as="h1"
            from="#f59e0b"
            to="#ef4444"
            style={{ margin: 0, fontSize: 22, fontWeight: 800 }}
          >
            Rangliste
          </GradientText>
        </motion.div>

        {/* Mode Toggle */}
        {renderModeToggle()}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <Group style={{ fontSize: '36px', color: '#f59e0b' }} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: textPrimary }}>
            Noch keine Freunde
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: textSecondary, lineHeight: 1.5 }}>
            Füge Freunde hinzu, um in der Rangliste gegeneinander anzutreten!
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/activity')}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Freunde finden
          </motion.button>
        </div>
      </div>
    );
  }

  function renderModeToggle() {
    return (
      <div style={{ padding: '0 16px 12px' }}>
        <div
          style={{
            display: 'flex',
            gap: 0,
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
          }}
        >
          {(
            [
              { id: 'friends', label: 'Freunde', icon: <Group sx={{ fontSize: 16 }} /> },
              { id: 'global', label: 'Alle', icon: <Public sx={{ fontSize: 16 }} /> },
            ] as const
          ).map((opt) => {
            const isActive = mode === opt.id;
            return (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(opt.id)}
                style={{
                  flex: '1 1 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  borderRadius: 0,
                  border: 'none',
                  background: isActive
                    ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                    : 'transparent',
                  color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {opt.icon}
                {opt.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderCelebration() {
    const placeColors = ['', '#FFD700', '#C0C0C0', '#CD7F32'];
    const placeGradients = [
      '',
      'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
      'linear-gradient(135deg, #E8E8E8, #A8A8A8, #E8E8E8)',
      'linear-gradient(135deg, #CD7F32, #E8A050, #CD7F32)',
    ];
    const placeLabels = ['', '1. Platz!', '2. Platz!', '3. Platz!'];
    const confettiColors = [
      '#FFD700',
      '#FFA500',
      '#FF6347',
      '#00CED1',
      '#7B68EE',
      '#FF69B4',
      '#32CD32',
      '#FF4500',
      '#1E90FF',
      '#FFE066',
    ];

    return (
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.92)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              overflow: 'hidden',
            }}
            onClick={() => setCelebration(null)}
          >
            {/* Confetti — 60 particles, falling from top */}
            {Array.from({ length: 60 }).map((_, i) => {
              const w = typeof window !== 'undefined' ? window.innerWidth : 400;
              const h = typeof window !== 'undefined' ? window.innerHeight : 800;
              const startX = Math.random() * w;
              const drift = (Math.random() - 0.5) * 150;
              const pSize = 5 + Math.random() * 9;
              const isCircle = Math.random() > 0.5;
              return (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 1,
                    left: startX,
                    top: -20,
                    rotate: 0,
                  }}
                  animate={{
                    opacity: [1, 1, 1, 0.6, 0],
                    top: [-(Math.random() * 40), h + 40],
                    left: [startX, startX + drift],
                    rotate: Math.random() * 1080,
                  }}
                  transition={{
                    duration: 2.5 + Math.random() * 2.5,
                    delay: Math.random() * 2,
                    ease: 'linear',
                  }}
                  style={{
                    position: 'fixed',
                    width: isCircle ? pSize : pSize * 0.5,
                    height: isCircle ? pSize : pSize * 1.8,
                    borderRadius: isCircle ? '50%' : '2px',
                    background: confettiColors[i % confettiColors.length],
                    pointerEvents: 'none',
                    zIndex: 10000,
                  }}
                />
              );
            })}

            {/* Radial glow behind trophy */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              style={{
                position: 'absolute',
                top: '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${placeColors[celebration.place]}40, ${placeColors[celebration.place]}10, transparent)`,
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />

            {/* Main content (no card — fullscreen layout) */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 60 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                textAlign: 'center',
                position: 'relative',
                maxWidth: '380px',
                width: '100%',
              }}
            >
              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setCelebration(null)}
                style={{
                  position: 'fixed',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                  zIndex: 10001,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Close sx={{ fontSize: 20 }} />
              </motion.button>

              {/* 3D Trophy — large and centered */}
              <motion.div
                initial={{ scale: 0, rotateY: -90 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: 0.15, type: 'spring', damping: 10, stiffness: 100 }}
                style={{ marginBottom: '16px' }}
              >
                <Trophy3D
                  place={celebration.place as 1 | 2 | 3}
                  size={260}
                  autoRotate
                  name={user?.displayName || 'Du'}
                  monthLabel={celebration.monthLabel}
                />
              </motion.div>

              {/* Place badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                style={{
                  display: 'inline-block',
                  background: placeGradients[celebration.place],
                  borderRadius: '20px',
                  padding: '6px 24px',
                  marginBottom: '12px',
                  boxShadow: `0 4px 20px ${placeColors[celebration.place]}50`,
                }}
              >
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#000',
                    letterSpacing: '0.5px',
                  }}
                >
                  {placeLabels[celebration.place]}
                </span>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <p
                  style={{
                    margin: '0 0 20px',
                    fontSize: '16px',
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1.6,
                  }}
                >
                  Watchtime-Rangliste
                  <br />
                  <strong style={{ color: '#fff', fontSize: '18px' }}>
                    {celebration.monthLabel}
                  </strong>
                </p>
              </motion.div>

              {/* Score pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '12px 28px',
                  marginBottom: '28px',
                  border: `1px solid ${placeColors[celebration.place]}35`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Timer style={{ fontSize: '20px', color: placeColors[celebration.place] }} />
                <span
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#fff',
                  }}
                >
                  {formatWatchtime(celebration.score)}
                </span>
              </motion.div>

              {/* Dismiss */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCelebration(null)}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '240px',
                    margin: '0 auto',
                    padding: '14px 32px',
                    borderRadius: '14px',
                    border: 'none',
                    background: placeGradients[celebration.place],
                    color: '#000',
                    fontSize: '16px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 6px 24px ${placeColors[celebration.place]}50`,
                    letterSpacing: '0.3px',
                  }}
                >
                  Weiter
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  function renderTrophySection() {
    if (trophies.length === 0) return null;

    const medalGradients = [
      'linear-gradient(135deg, #FFD700, #FFC300, #FFE066)',
      'linear-gradient(135deg, #E0E0E0, #B8B8B8, #D8D8D8)',
      'linear-gradient(135deg, #CD7F32, #E09050, #D4944A)',
    ];

    return (
      <div style={{ padding: '32px 16px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(255,215,0,0.3)',
            }}
          >
            <EmojiEvents style={{ fontSize: '18px', color: '#000' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: textPrimary }}>
            Trophäen
          </h2>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '4px 0 16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {trophies.map((trophy, trophyIdx) => (
            <motion.div
              key={trophy.monthKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: trophyIdx * 0.1 }}
              style={{
                minWidth: '280px',
                background: currentTheme.background.card,
                border: `1px solid rgba(255, 255, 255, 0.08)`,
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              {/* Header band with gold gradient */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,165,0,0.06))',
                  borderBottom: '1px solid rgba(255,215,0,0.15)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: textPrimary,
                    }}
                  >
                    {formatMonthLabel(trophy.monthKey)}
                  </div>
                  <div style={{ fontSize: '11px', color: textSecondary, marginTop: '2px' }}>
                    Watchtime Rangliste
                  </div>
                </div>
                <EmojiEvents style={{ fontSize: '24px', color: '#FFD700', opacity: 0.7 }} />
              </div>

              {/* Winner entries */}
              <div style={{ padding: '10px 12px 14px' }}>
                {([trophy.first, trophy.second, trophy.third] as const).map((entry, idx) => {
                  if (!entry) return null;
                  const medalColor = MEDAL_COLORS[idx];
                  const isFirst = idx === 0;
                  return (
                    <div
                      key={entry.uid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: isFirst ? '10px 12px' : '8px 12px',
                        borderRadius: '12px',
                        background: isFirst ? `${medalColor}15` : 'transparent',
                        marginBottom: idx < 2 ? '4px' : 0,
                      }}
                    >
                      {/* Medal circle */}
                      <div
                        style={{
                          width: isFirst ? 28 : 24,
                          height: isFirst ? 28 : 24,
                          borderRadius: '50%',
                          background: medalGradients[idx],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: `0 2px 8px ${medalColor}40`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: isFirst ? '14px' : '12px',
                            fontWeight: 900,
                            color: '#000',
                          }}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div
                        style={{
                          width: isFirst ? 34 : 28,
                          height: isFirst ? 34 : 28,
                          borderRadius: '50%',
                          border: `2px solid ${medalColor}60`,
                          overflow: 'hidden',
                          background: bgDefault,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {entry.photoURL ? (
                          <img
                            src={entry.photoURL}
                            alt={entry.displayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: isFirst ? 14 : 11,
                              fontWeight: 700,
                              color: textSecondary,
                            }}
                          >
                            {entry.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <span
                        style={{
                          flex: 1,
                          fontSize: isFirst ? '14px' : '13px',
                          fontWeight: isFirst ? 700 : 600,
                          color: textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.uid === user?.uid ? 'Du' : entry.displayName}
                      </span>

                      {/* Score */}
                      <span
                        style={{
                          fontSize: isFirst ? '14px' : '12px',
                          fontWeight: 700,
                          color: medalColor,
                          whiteSpace: 'nowrap',
                          opacity: 0.9,
                        }}
                      >
                        {formatWatchtime(entry.score)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: bgDefault,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Celebration Popup */}
      {renderCelebration()}

      {/* Decorative Background Gradients */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            left: '-20%',
            width: '60%',
            height: '40%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            right: '-15%',
            width: '50%',
            height: '40%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div style={{ paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
        {/* Sticky Glassmorphism Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '16px 20px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: `${bgDefault}90`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <BackButton />
          <div style={{ flex: 1 }}>
            <GradientText
              as="h1"
              from="#f59e0b"
              to="#ef4444"
              style={{ margin: 0, fontSize: 22, fontWeight: 800 }}
            >
              Rangliste
            </GradientText>
            <p style={{ margin: 0, fontSize: 12, color: textSecondary, marginTop: '2px' }}>
              {activeCat.label}
              {activeCategory !== 'streakAllTime' ? ' · Diesen Monat' : ' · Aller Zeiten'}
              {mode === 'global' ? ' · Alle Nutzer' : ''}
            </p>
          </div>
        </motion.div>

        {/* Mode Toggle */}
        {renderModeToggle()}

        {/* Category Tabs */}
        <div
          style={{
            padding: '0 16px 20px',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 0,
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    flex: '1 1 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '12px 8px',
                    borderRadius: 0,
                    border: 'none',
                    background: isActive
                      ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                      : 'transparent',
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat.icon}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Podium */}
        {topThree.length > 0 && (
          <div style={{ padding: '0 16px 24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '220px',
              }}
            >
              {PODIUM_ORDER.map((podiumIndex) => {
                const entry = topThree[podiumIndex];
                if (!entry) return <div key={podiumIndex} style={{ flex: 1 }} />;

                const medalColor = MEDAL_COLORS[podiumIndex];
                const height = PODIUM_HEIGHTS[podiumIndex];

                return (
                  <motion.div
                    key={entry.uid}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: podiumIndex * 0.15, duration: 0.4 }}
                    onClick={() => {
                      if (!entry.isCurrentUser) navigate(`/friend/${entry.uid}`);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: entry.isCurrentUser ? 'default' : 'pointer',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: podiumIndex === 0 ? 64 : 52,
                        height: podiumIndex === 0 ? 64 : 52,
                        borderRadius: '50%',
                        border: `3px solid ${medalColor}`,
                        overflow: 'hidden',
                        marginBottom: '8px',
                        background: currentTheme.background.card,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: entry.isCurrentUser
                          ? `0 0 12px ${currentTheme.primary}60`
                          : `0 4px 12px ${medalColor}30`,
                      }}
                    >
                      {entry.photoURL ? (
                        <img
                          src={entry.photoURL}
                          alt={entry.displayName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: podiumIndex === 0 ? 24 : 20,
                            fontWeight: 700,
                            color: textSecondary,
                          }}
                        >
                          {entry.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: entry.isCurrentUser ? 700 : 500,
                        color: entry.isCurrentUser ? currentTheme.primary : textPrimary,
                        textAlign: 'center',
                        maxWidth: '90px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '6px',
                      }}
                    >
                      {entry.isCurrentUser ? 'Du' : entry.displayName.split(' ')[0]}
                    </span>

                    {/* Podium Block */}
                    <div
                      style={{
                        width: '100%',
                        height: `${height}px`,
                        borderRadius: '12px 12px 0 0',
                        background: `linear-gradient(180deg, ${medalColor}30, ${medalColor}10)`,
                        borderTop: `1px solid ${medalColor}40`,
                        borderLeft: `1px solid ${medalColor}40`,
                        borderRight: `1px solid ${medalColor}40`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '24px', fontWeight: 800, color: medalColor }}>
                        #{entry.rank}
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: textPrimary }}>
                        {formatValue(entry.value, activeCat.id)}
                      </span>
                      <span style={{ fontSize: '11px', color: textSecondary }}>
                        {activeCat.unit}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rest of Rankings */}
        {rest.length > 0 && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rest.map((entry, i) => (
                <motion.div
                  key={entry.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  onClick={() => {
                    if (!entry.isCurrentUser) navigate(`/friend/${entry.uid}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: entry.isCurrentUser
                      ? `${currentTheme.primary}18`
                      : 'rgba(255, 255, 255, 0.04)',
                    border: entry.isCurrentUser
                      ? `1px solid ${currentTheme.primary}40`
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: entry.isCurrentUser ? 'default' : 'pointer',
                  }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: textSecondary,
                      minWidth: '28px',
                      textAlign: 'center',
                    }}
                  >
                    {entry.rank}
                  </span>

                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: currentTheme.background.card,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {entry.photoURL ? (
                      <img
                        src={entry.photoURL}
                        alt={entry.displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 700, color: textSecondary }}>
                        {entry.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: entry.isCurrentUser ? 700 : 500,
                        color: entry.isCurrentUser ? currentTheme.primary : textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {entry.isCurrentUser ? 'Du' : entry.displayName}
                    </span>
                    {entry.username && !entry.isCurrentUser && (
                      <span style={{ fontSize: '12px', color: textSecondary }}>
                        @{entry.username}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: textPrimary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatValue(entry.value, activeCat.id)}{' '}
                    <span style={{ fontSize: '12px', fontWeight: 400, color: textSecondary }}>
                      {activeCat.unit}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Trophy Section */}
        {renderTrophySection()}
      </div>
    </div>
  );
};
