/**
 * TasteMatchPage - Geschmacks-Vergleich zwischen zwei Usern
 * Premium Design mit Tabs - Slim Composition
 */

import {
  AutoAwesome,
  Category,
  CompareArrows,
  Favorite,
  Movie,
  Share,
  Star,
  Tv,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PageHeader } from '../../components/ui';
import { USER_COLOR, FRIEND_COLOR, ACCENT_COLORS } from './constants';
import { StatRing } from './StatRing';
import { ScoreHeader } from './ScoreHeader';
import { OverviewTab } from './OverviewTab';
import { SeriesTab } from './SeriesTab';
import { MoviesTab } from './MoviesTab';
import { GenresTab } from './GenresTab';
import { useTasteMatchData } from './useTasteMatchData';
import './TasteMatchPage.css';

// ==================== Loading State ====================
const LoadingState: React.FC<{ bgDefault: string; textPrimary: string }> = ({
  bgDefault,
  textPrimary,
}) => (
  <div className="tm-loading-container" style={{ background: bgDefault }}>
    <div
      className="tm-loading-bg-orb tm-loading-bg-orb--user"
      style={{ background: `radial-gradient(circle, ${USER_COLOR}30, transparent 70%)` }}
    />
    <div
      className="tm-loading-bg-orb tm-loading-bg-orb--friend"
      style={{ background: `radial-gradient(circle, ${FRIEND_COLOR}30, transparent 70%)` }}
    />

    <div className="tm-loading-orbiter">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="tm-loading-orbiter__ring"
      >
        <motion.div className="tm-loading-orbiter__heart--top">
          <Favorite style={{ fontSize: 24, color: USER_COLOR }} />
        </motion.div>
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="tm-loading-orbiter__ring"
      >
        <motion.div className="tm-loading-orbiter__heart--bottom">
          <Favorite style={{ fontSize: 24, color: FRIEND_COLOR }} />
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="tm-loading-orbiter__center"
        style={{
          background: `linear-gradient(135deg, ${USER_COLOR}40, ${FRIEND_COLOR}40)`,
        }}
      >
        <CompareArrows style={{ fontSize: 32, color: textPrimary }} />
      </motion.div>
    </div>

    <div className="tm-loading-text">
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          color: textPrimary,
          fontSize: 20,
          fontWeight: 700,
          margin: 0,
          marginBottom: '8px',
        }}
      >
        Berechne Match...
      </motion.p>
      <p className="tm-loading-text__subtitle">Analysiere eure Geschmäcker</p>
    </div>
  </div>
);

// ==================== Tab Configuration ====================
const TAB_CONFIG = (primaryColor: string, seriesCount: number, moviesCount: number) => [
  {
    id: 'overview' as const,
    label: 'Übersicht',
    color: primaryColor,
    icon: <Category style={{ fontSize: 16 }} />,
  },
  {
    id: 'series' as const,
    label: `Serien (${seriesCount})`,
    color: ACCENT_COLORS.series,
    icon: <Tv style={{ fontSize: 16 }} />,
  },
  {
    id: 'movies' as const,
    label: `Filme (${moviesCount})`,
    color: ACCENT_COLORS.movies,
    icon: <Movie style={{ fontSize: 16 }} />,
  },
  {
    id: 'genres' as const,
    label: 'Genres',
    color: ACCENT_COLORS.genres,
    icon: <Star style={{ fontSize: 16 }} />,
  },
];

// ==================== MAIN COMPONENT ====================
export const TasteMatchPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const bgDefault = currentTheme.background.default;
  const textPrimary = currentTheme.text.primary;
  const primaryColor = currentTheme.primary;

  const {
    loading,
    result,
    friendName,
    friendPhoto,
    userName,
    userPhoto,
    activeTab,
    setActiveTab,
    handleShare,
  } = useTasteMatchData();

  if (loading) {
    return <LoadingState bgDefault={bgDefault} textPrimary={textPrimary} />;
  }

  if (!result) return null;

  const cardBg = 'rgba(255, 255, 255, 0.04)';
  const tabs = TAB_CONFIG(
    primaryColor,
    result.seriesOverlap.sharedSeries.length,
    result.movieOverlap.sharedMovies.length
  );

  return (
    <div className="tm-page" style={{ background: bgDefault }}>
      {/* Decorative background gradients */}
      <div className="tm-bg-gradients">
        <div
          className="tm-bg-gradients__orb tm-bg-gradients__orb--user"
          style={{
            background: `radial-gradient(ellipse, ${USER_COLOR}15 0%, transparent 70%)`,
          }}
        />
        <div
          className="tm-bg-gradients__orb tm-bg-gradients__orb--friend"
          style={{
            background: `radial-gradient(ellipse, ${FRIEND_COLOR}15 0%, transparent 70%)`,
          }}
        />
        <div
          className="tm-bg-gradients__orb tm-bg-gradients__orb--primary"
          style={{
            background: `radial-gradient(ellipse, ${primaryColor}10 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="tm-content">
        {/* Header */}
        <PageHeader
          title="Taste Match"
          icon={<AutoAwesome style={{ fontSize: 22, color: ACCENT_COLORS.match }} />}
          gradientFrom={USER_COLOR}
          gradientTo={FRIEND_COLOR}
          actions={
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="tm-header__share-btn"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}20, ${ACCENT_COLORS.match}20)`,
                border: `1px solid ${primaryColor}30`,
                color: textPrimary,
                boxShadow: `0 4px 15px ${primaryColor}20`,
              }}
            >
              <Share style={{ fontSize: 20 }} />
            </motion.button>
          }
        />

        {/* Premium Score Section */}
        <ScoreHeader
          result={result}
          userName={userName}
          userPhoto={userPhoto}
          friendName={friendName}
          friendPhoto={friendPhoto}
        />

        {/* Premium Stat Rings */}
        <div className="tm-stat-rings">
          <StatRing
            icon={<Tv style={{ fontSize: 22 }} />}
            label="Serien"
            score={result.seriesOverlap.score}
            color={ACCENT_COLORS.series}
            delay={0.1}
            bgColor={cardBg}
          />
          <StatRing
            icon={<Movie style={{ fontSize: 22 }} />}
            label="Filme"
            score={result.movieOverlap.score}
            color={ACCENT_COLORS.movies}
            delay={0.2}
            bgColor={cardBg}
          />
          <StatRing
            icon={<Category style={{ fontSize: 22 }} />}
            label="Genres"
            score={result.genreMatch.score}
            color={ACCENT_COLORS.genres}
            delay={0.3}
            bgColor={cardBg}
          />
          <StatRing
            icon={<Star style={{ fontSize: 22 }} />}
            label="Ratings"
            score={result.ratingMatch.score}
            color={ACCENT_COLORS.ratings}
            delay={0.4}
            bgColor={cardBg}
          />
        </div>

        {/* Premium Tabs */}
        <div className="tm-tabs-wrapper">
          <div className="tm-tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tm-tab-btn ${isActive ? 'tm-tab-btn--active' : 'tm-tab-btn--inactive'}`}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`,
                          boxShadow: `0 4px 12px ${tab.color}35`,
                        }
                      : undefined
                  }
                >
                  {tab.icon}
                  {isActive && <span>{tab.label}</span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tm-tab-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && <OverviewTab result={result} cardBg={cardBg} />}
            {activeTab === 'series' && <SeriesTab result={result} cardBg={cardBg} />}
            {activeTab === 'movies' && <MoviesTab result={result} cardBg={cardBg} />}
            {activeTab === 'genres' && (
              <GenresTab
                result={result}
                userName={userName}
                friendName={friendName}
                cardBg={cardBg}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
