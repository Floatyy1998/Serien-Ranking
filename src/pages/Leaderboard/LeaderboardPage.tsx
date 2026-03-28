import {
  EmojiEvents,
  Group,
  LocalFireDepartment,
  Movie,
  PlayCircle,
  Public,
  Timer,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { LeaderboardCategory } from '../../types/Leaderboard';
import { CelebrationModal } from './CelebrationModal';
import './LeaderboardPage.css';
import { PodiumSection } from './PodiumSection';
import { RankingList } from './RankingList';
import { TrophyHistory } from './TrophyHistory';
import { useLeaderboardData } from './useLeaderboardData';

const CATEGORIES: {
  id: LeaderboardCategory;
  label: string;
  icon: React.ReactNode;
  unit: string;
}[] = [
  {
    id: 'episodesThisMonth',
    label: 'Episoden',
    icon: <PlayCircle sx={{ fontSize: 16 }} />,
    unit: 'Ep.',
  },
  { id: 'moviesThisMonth', label: 'Filme', icon: <Movie sx={{ fontSize: 16 }} />, unit: 'Filme' },
  { id: 'watchtimeThisMonth', label: 'Watchtime', icon: <Timer sx={{ fontSize: 16 }} />, unit: '' },
  {
    id: 'streakThisMonth',
    label: 'Monats-Streak',
    icon: <LocalFireDepartment sx={{ fontSize: 16 }} />,
    unit: 'Tage',
  },
  {
    id: 'streakAllTime',
    label: 'Längste Streak',
    icon: <EmojiEvents sx={{ fontSize: 16 }} />,
    unit: 'Tage',
  },
];

export const LeaderboardPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const {
    user,
    mode,
    setMode,
    activeCategory,
    setActiveCategory,
    rankings,
    trophies,
    loading,
    celebration,
    setCelebration,
    scrollContainerRef,
  } = useLeaderboardData();

  const activeCat = useMemo(
    () => CATEGORIES.find((c) => c.id === activeCategory),
    [activeCategory]
  );
  const topThree = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="lb-loading" style={{ background: currentTheme.background.default }}>
        <motion.div
          className="lb-loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `${currentTheme.accent}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmojiEvents style={{ fontSize: 24, color: currentTheme.accent }} />
          </motion.div>
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: currentTheme.text.primary }}>
            Rangliste wird geladen...
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: currentTheme.text.secondary }}>
            Daten werden abgerufen
          </p>
        </div>
      </div>
    );
  }

  // ── No Friends State ──
  if (mode === 'friends' && rankings.length <= 1) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: currentTheme.background.default,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PageHeader
          title="Rangliste"
          gradientFrom={currentTheme.accent}
          gradientTo={currentTheme.status?.error || '#ef4444'}
        />

        <ModeToggle mode={mode} onModeChange={setMode} />

        <div className="lb-empty">
          <div className="lb-empty-icon">
            <Group style={{ fontSize: 36, color: currentTheme.accent }} />
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: currentTheme.text.primary,
            }}
          >
            Noch keine Freunde
          </h2>
          <p
            style={{ margin: 0, fontSize: 14, color: currentTheme.text.secondary, lineHeight: 1.5 }}
          >
            Füge Freunde hinzu, um in der Rangliste gegeneinander anzutreten!
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/activity')}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.status?.error || '#ef4444'})`,
              color: currentTheme.text.secondary,
              fontSize: 14,
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

  // ── Main Leaderboard ──
  return (
    <div
      ref={scrollContainerRef}
      className="lb-root"
      style={{ background: currentTheme.background.default }}
    >
      <CelebrationModal
        celebration={celebration}
        onClose={() => setCelebration(null)}
        userName={user?.displayName || 'Du'}
      />

      {/* Ambient background */}
      <div className="lb-bg-orbs" />

      <div style={{ paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
        {/* Sticky Header */}
        <PageHeader
          title="Rangliste"
          gradientFrom={currentTheme.accent}
          gradientTo={currentTheme.status?.error || '#ef4444'}
          subtitle={`${activeCat?.label}${activeCategory !== 'streakAllTime' ? ' · Diesen Monat' : ' · Aller Zeiten'}${mode === 'global' ? ' · Alle Nutzer' : ''}`}
        />

        {/* Mode Toggle */}
        <ModeToggle mode={mode} onModeChange={setMode} />

        {/* Category Pills */}
        <div className="lb-category-scroll">
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.id)}
                className={`lb-cat-pill ${isActive ? 'lb-cat-pill--active' : ''}`}
                style={
                  isActive
                    ? undefined
                    : {
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: currentTheme.text.muted,
                      }
                }
              >
                {cat.icon}
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Podium */}
        <PodiumSection topThree={topThree} category={activeCategory} unit={activeCat?.unit ?? ''} />

        {/* Rest of Rankings */}
        <RankingList entries={rest} category={activeCategory} unit={activeCat?.unit ?? ''} />

        {/* Trophy History */}
        <TrophyHistory trophies={trophies} currentUserId={user?.uid} />

        <div className="lb-bottom-pad" />
      </div>
    </div>
  );
};

// ── Mode Toggle Sub-Component ──
const ModeToggle = React.memo(function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: 'friends' | 'global';
  onModeChange: (m: 'friends' | 'global') => void;
}) {
  const { currentTheme } = useTheme();
  const options = [
    { id: 'friends' as const, label: 'Freunde', icon: <Group sx={{ fontSize: 16 }} /> },
    { id: 'global' as const, label: 'Alle', icon: <Public sx={{ fontSize: 16 }} /> },
  ];

  return (
    <div className="lb-mode-toggle">
      {options.map((opt) => {
        const isActive = mode === opt.id;
        return (
          <motion.button
            key={opt.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onModeChange(opt.id)}
            className="lb-mode-btn"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.status?.error || '#ef4444'})`
                : 'transparent',
              color: isActive ? currentTheme.text.secondary : currentTheme.text.muted,
              boxShadow: isActive ? `0 2px 8px ${currentTheme.accent}66` : 'none',
            }}
          >
            {opt.icon}
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
});
