import {
  EmojiEvents,
  LocalFireDepartment,
  Movie,
  PlayCircle,
  Timer,
  Group,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { BackButton, GradientText } from '../../components/ui';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchLeaderboardData, fetchLeaderboardProfiles } from '../../services/leaderboardService';
import type { LeaderboardCategory, LeaderboardEntry, LeaderboardStats } from '../../types/Leaderboard';

const CATEGORIES: {
  id: LeaderboardCategory;
  label: string;
  icon: React.ReactNode;
  unit: string;
}[] = [
  { id: 'episodesThisMonth', label: 'Episoden', icon: <PlayCircle sx={{ fontSize: 18 }} />, unit: 'Ep.' },
  { id: 'moviesThisMonth', label: 'Filme', icon: <Movie sx={{ fontSize: 18 }} />, unit: 'Filme' },
  { id: 'watchtimeThisMonth', label: 'Watchtime', icon: <Timer sx={{ fontSize: 18 }} />, unit: '' },
  { id: 'streakThisMonth', label: 'Monats-Streak', icon: <LocalFireDepartment sx={{ fontSize: 18 }} />, unit: 'Tage' },
  { id: 'streakAllTime', label: 'Längste Streak', icon: <EmojiEvents sx={{ fontSize: 18 }} />, unit: 'Tage' },
];

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const PODIUM_HEIGHTS = [140, 110, 90];
const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd

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

export const LeaderboardPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth()!;
  const { friends } = useOptimizedFriends();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('episodesThisMonth');
  const [statsData, setStatsData] = useState<Record<string, LeaderboardStats>>({});
  const [profiles, setProfiles] = useState<Record<string, { displayName: string; photoURL?: string; username?: string }>>({});
  const [loading, setLoading] = useState(true);

  const bgDefault = currentTheme.background.default;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const friendUids = friends.map((f) => f.uid);
      const [data, profileData] = await Promise.all([
        fetchLeaderboardData(user.uid, friendUids),
        fetchLeaderboardProfiles([user.uid, ...friendUids]),
      ]);
      setStatsData(data);
      setProfiles(profileData);
    } catch (error) {
      console.error('[Leaderboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, friends]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  }, [statsData, profiles, activeCategory, user?.uid]);

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
          gap: '28px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: '3px solid rgba(245, 158, 11, 0.15)',
              borderTopColor: '#f59e0b',
              position: 'absolute',
              top: -10,
              left: -10,
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmojiEvents style={{ fontSize: 36, color: '#f59e0b' }} />
          </motion.div>
        </div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ color: textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}
        >
          Lade Rangliste...
        </motion.p>
      </div>
    );
  }

  // Empty state
  if (friends.length === 0) {
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
        <div
          style={{
            padding: '16px 20px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <BackButton />
          <GradientText as="h1" from="#f59e0b" to="#ef4444" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            Rangliste
          </GradientText>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
          <Group style={{ fontSize: 80, color: `${textSecondary}30`, marginBottom: 24 }} />
          <h2 style={{ color: textPrimary, fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            Noch keine Freunde
          </h2>
          <p style={{ color: textSecondary, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
            Füge Freunde hinzu, um euch in der Rangliste zu vergleichen!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
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
            <GradientText as="h1" from="#f59e0b" to="#ef4444" style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              Rangliste
            </GradientText>
            <p style={{ margin: 0, fontSize: 12, color: textSecondary, marginTop: '2px' }}>
              {activeCat.label}{activeCategory !== 'streakAllTime' ? ' · Diesen Monat' : ' · Aller Zeiten'}
            </p>
          </div>
        </motion.div>

        {/* Category Tabs - WatchJourney style connected bar */}
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
                        <span style={{ fontSize: podiumIndex === 0 ? 24 : 20, fontWeight: 700, color: textSecondary }}>
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
                        border: `1px solid ${medalColor}40`,
                        borderBottom: 'none',
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
                        {formatValue(entry.value, activeCategory)}
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
                    {formatValue(entry.value, activeCategory)}{' '}
                    <span style={{ fontSize: '12px', fontWeight: 400, color: textSecondary }}>
                      {activeCat.unit}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
