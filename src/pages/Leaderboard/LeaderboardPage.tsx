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
import { useTheme } from '../../contexts/ThemeContext';
import type { LeaderboardCategory } from '../../types/Leaderboard';
import { CelebrationModal } from './CelebrationModal';
import './LeaderboardPage.css';
import { PodiumSection } from './PodiumSection';
import { RankingList } from './RankingList';
import { TrophyHistory } from './TrophyHistory';
import { useLeaderboardData } from './useLeaderboardData';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';

const CATEGORIES: {
  id: LeaderboardCategory;
  label: string;
  icon: React.ReactNode;
  unit: string;
}[] = [
  {
    id: 'episodesThisMonth',
    label: t('Episoden'),
    icon: <PlayCircle sx={{ fontSize: 16 }} />,
    unit: t('Ep.'),
  },
  {
    id: 'moviesThisMonth',
    label: t('Filme'),
    icon: <Movie sx={{ fontSize: 16 }} />,
    unit: t('Filme'),
  },
  { id: 'watchtimeThisMonth', label: 'Watchtime', icon: <Timer sx={{ fontSize: 16 }} />, unit: '' },
  {
    id: 'streakThisMonth',
    label: t('Monats-Streak'),
    icon: <LocalFireDepartment sx={{ fontSize: 16 }} />,
    unit: t('Tage'),
  },
  {
    id: 'streakAllTime',
    label: t('Längste Streak'),
    icon: <EmojiEvents sx={{ fontSize: 16 }} />,
    unit: t('Tage'),
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

  // Loading state
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
            {t('Rangliste wird geladen...')}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: currentTheme.text.secondary }}>
            {t('Daten werden abgerufen')}
          </p>
        </div>
      </div>
    );
  }

  // No-friends state
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
        <PageHeader title={t('Rangliste')} />

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
            {t('Noch keine Freunde')}
          </h2>
          <p
            style={{ margin: 0, fontSize: 14, color: currentTheme.text.secondary, lineHeight: 1.5 }}
          >
            {t('Füge Freunde hinzu, um in der Rangliste gegeneinander anzutreten!')}
          </p>
          <motion.button
            whileTap={tapScale}
            onClick={() => navigate('/activity')}
            style={{
              marginTop: 24,
              padding: '13px 28px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: currentTheme.primary,
              color: currentTheme.background.default,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--glow-soft)',
            }}
          >
            {t('Freunde finden')}
          </motion.button>
        </div>
      </div>
    );
  }

  // Main leaderboard
  return (
    <div
      ref={scrollContainerRef}
      className="lb-root"
      style={{ background: currentTheme.background.default }}
    >
      <CelebrationModal
        celebration={celebration}
        onClose={() => setCelebration(null)}
        userName={user?.displayName || t('Du')}
      />

      <div style={{ paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
        {/* Sticky Header */}
        <PageHeader
          title={t('Rangliste')}
          subtitle={`${activeCat?.label}${activeCategory !== 'streakAllTime' ? ` · ${t('Diesen Monat')}` : ` · ${t('Aller Zeiten')}`}${mode === 'global' ? ` · ${t('Alle Nutzer')}` : ''}`}
        />

        {/* Controls: Mode Toggle + Category Pills in einer Zeile (Desktop) */}
        <div className="lb-controls">
          <ModeToggle mode={mode} onModeChange={setMode} />

          <div className="lb-category-scroll">
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={tapScale}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`lb-cat-pill ${isActive ? 'lb-cat-pill--active' : ''}`}
                  style={
                    isActive
                      ? undefined
                      : {
                          background: 'var(--glass-subtle)',
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

// Mode toggle
const ModeToggle = React.memo(function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: 'friends' | 'global';
  onModeChange: (m: 'friends' | 'global') => void;
}) {
  const { currentTheme } = useTheme();
  const options = [
    { id: 'friends' as const, label: t('Freunde'), icon: <Group sx={{ fontSize: 16 }} /> },
    { id: 'global' as const, label: t('Alle'), icon: <Public sx={{ fontSize: 16 }} /> },
  ];

  return (
    <div className="lb-mode-toggle">
      {options.map((opt) => {
        const isActive = mode === opt.id;
        return (
          <motion.button
            key={opt.id}
            whileTap={tapScale}
            onClick={() => onModeChange(opt.id)}
            className="lb-mode-btn"
            style={{
              background: isActive
                ? `color-mix(in srgb, ${currentTheme.accent} 20%, rgba(255, 255, 255, 0.04))`
                : 'transparent',
              color: isActive ? currentTheme.accent : currentTheme.text.muted,
              boxShadow: isActive ? `inset 0 0 0 1px ${currentTheme.accent}55` : 'none',
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
