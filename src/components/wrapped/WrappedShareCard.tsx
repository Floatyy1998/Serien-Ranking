/**
 * WrappedShareCard - Share-Card + Sheet für die Wrapped-Summary-Slide.
 *
 * Gießt die Kern-Zahlen des Wrapped-Jahres in die ShareCardFrame.
 * Das Top-Serien-Poster (TMDB) wird nur bei showImages=true gerendert —
 * schlägt der Export daran fehl, rendert das Sheet die Karte ohne Poster
 * erneut (CORS-Fallback in ShareCardSheet).
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { WrappedStats } from '../../types/Wrapped';
import { ShareCardFrame } from '../share/ShareCardFrame';
import { ShareCardSheet } from '../share/ShareCardSheet';

// ==================== Karten-Bausteine ====================

interface StatTileProps {
  value: string;
  label: string;
}

const StatTile: React.FC<StatTileProps> = ({ value, label }) => {
  const { currentTheme } = useTheme();
  return (
    <div
      style={{
        background: 'var(--glass-medium)',
        border: '1px solid var(--glass-border-light)',
        borderRadius: 'var(--radius-2xl)',
        padding: '52px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 88,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: currentTheme.text.secondary,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: currentTheme.text.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ==================== Karte ====================

interface WrappedShareCardProps {
  stats: WrappedStats;
  showImages: boolean;
}

const WrappedShareCard: React.FC<WrappedShareCardProps> = ({ stats, showImages }) => {
  const { currentTheme } = useTheme();
  const topSerie = stats.topSeries[0];
  const unlockedAchievements = stats.achievements.filter((a) => a.unlocked).length;

  return (
    <ShareCardFrame title={`Mein ${stats.year}`} subtitle="Mein Jahr in Serien & Filmen">
      {/* Kern-Zahlen 2×2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
        }}
      >
        <StatTile value={stats.totalEpisodesWatched.toLocaleString('de-DE')} label="Episoden" />
        <StatTile value={stats.totalMoviesWatched.toLocaleString('de-DE')} label="Filme" />
        <StatTile
          value={Math.round(stats.totalHoursWatched).toLocaleString('de-DE')}
          label="Stunden"
        />
        <StatTile value={stats.uniqueSeriesWatched.toLocaleString('de-DE')} label="Serien" />
      </div>

      {/* Top-Serie */}
      {topSerie && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 36,
            background: 'var(--glass-light)',
            border: '1px solid var(--glass-border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            padding: '36px 44px',
          }}
        >
          {showImages && topSerie.poster ? (
            <img
              src={`https://image.tmdb.org/t/p/w185${topSerie.poster}`}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: 128,
                height: 192,
                objectFit: 'cover',
                borderRadius: 'var(--radius-lg)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                width: 128,
                height: 192,
                borderRadius: 'var(--radius-lg)',
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: currentTheme.text.muted,
              }}
            >
              Meine #1 Serie
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 48,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
                color: currentTheme.text.secondary,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {topSerie.title}
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 34,
                fontWeight: 700,
                color: currentTheme.primary,
              }}
            >
              {topSerie.episodesWatched} Episoden
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div
        style={{
          alignSelf: 'center',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 16,
          background: 'var(--glass-light)',
          border: '1px solid var(--glass-border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '22px 48px',
          fontSize: 34,
          fontWeight: 600,
          color: currentTheme.text.secondary,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: currentTheme.accent,
          }}
        />
        <strong style={{ fontWeight: 900 }}>{unlockedAchievements}</strong>
        Achievements freigeschaltet
      </div>
    </ShareCardFrame>
  );
};

// ==================== Sheet ====================

interface WrappedShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stats: WrappedStats;
}

export const WrappedShareSheet: React.FC<WrappedShareSheetProps> = ({ isOpen, onClose, stats }) => {
  const shareText =
    `Mein ${stats.year} in Zahlen: ${stats.totalEpisodesWatched} Episoden, ` +
    `${stats.totalMoviesWatched} Filme, ${Math.round(stats.totalHoursWatched)} Stunden. tv-rank.de`;

  return (
    <ShareCardSheet
      isOpen={isOpen}
      onClose={onClose}
      sheetTitle={`Wrapped ${stats.year} teilen`}
      filename={`tv-rank-wrapped-${stats.year}.png`}
      shareText={shareText}
      renderCard={(showImages) => <WrappedShareCard stats={stats} showImages={showImages} />}
    />
  );
};
