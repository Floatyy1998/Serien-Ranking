/**
 * WrappedShareCard - Share-Card + Sheet für die Wrapped-Summary-Slide.
 *
 * Gießt die Jahres-Bilanz (Stunden, Kennzahlen, Top-3-Serien, Highlights) in die ShareCardFrame.
 * Die Serien-Poster (TMDB) werden nur bei showImages=true gerendert —
 * schlägt der Export daran fehl, rendert das Sheet die Karte ohne Poster
 * erneut (CORS-Fallback in ShareCardSheet).
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { WrappedStats } from '../../types/Wrapped';
import { ShareCardFrame } from '../share/ShareCardFrame';
import { ShareCardSheet } from '../share/ShareCardSheet';
import { dateLocale as appDateLocale, t } from '../../services/i18n';

// Karten-Bausteine

const StatTile: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const { currentTheme } = useTheme();
  return (
    <div
      style={{
        background: 'var(--glass-medium)',
        border: '1px solid var(--glass-border-light)',
        borderRadius: 'var(--radius-2xl)',
        padding: '30px 14px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 64,
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
          marginTop: 12,
          fontSize: 24,
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

const PosterSlot: React.FC<{
  rank: number;
  title: string;
  meta: string;
  src?: string;
  showImages: boolean;
}> = ({ rank, title, meta, src, showImages }) => {
  const { currentTheme } = useTheme();
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ position: 'relative' }}>
        {showImages && src ? (
          <img
            src={src}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: '100%',
              aspectRatio: '2 / 3',
              objectFit: 'cover',
              borderRadius: 'var(--radius-lg)',
              display: 'block',
            }}
          />
        ) : (
          <div
            aria-hidden
            style={{
              width: '100%',
              aspectRatio: '2 / 3',
              borderRadius: 'var(--radius-lg)',
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
          />
        )}
        <span
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.65)',
            color: 'white',
            fontSize: 28,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rank}
        </span>
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 28,
          fontWeight: 800,
          lineHeight: 1.2,
          color: currentTheme.text.secondary,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: currentTheme.primary }}>
        {meta}
      </div>
    </div>
  );
};

const Highlight: React.FC<{ title: string; value: string }> = ({ title, value }) => {
  const { currentTheme } = useTheme();
  return (
    <div
      style={{
        background: 'var(--glass-light)',
        border: '1px solid var(--glass-border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        padding: '24px 28px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: currentTheme.text.muted,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 34,
          fontWeight: 800,
          color: currentTheme.text.secondary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
    </div>
  );
};

// Karte

interface WrappedShareCardProps {
  stats: WrappedStats;
  showImages: boolean;
}

const WrappedShareCard: React.FC<WrappedShareCardProps> = ({ stats, showImages }) => {
  const { currentTheme } = useTheme();
  const locale = appDateLocale();
  const number = (n: number) => n.toLocaleString(locale);
  const topGenre = stats.topGenres[0];
  const topProvider = stats.topProviders[0];

  const tiles = [
    { value: number(stats.totalEpisodesWatched), label: t('Episoden') },
    { value: number(stats.totalMoviesWatched), label: t('Filme') },
    { value: number(stats.uniqueSeriesWatched), label: t('Serien') },
    stats.manga
      ? { value: number(stats.manga.totalChapters), label: t('Manga-Kapitel') }
      : { value: number(stats.longestStreak), label: t('Tage Streak') },
  ];

  const highlights = [
    topGenre && { title: t('Lieblings-Genre'), value: t(topGenre.genre) },
    topProvider && { title: t('Meistgenutzt'), value: topProvider.name },
  ].filter(Boolean) as { title: string; value: string }[];

  return (
    <ShareCardFrame
      title={t('Mein {year}', { year: stats.year })}
      subtitle={t('Mein Jahr in Serien & Filmen')}
    >
      {/* Hero: Stunden */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: currentTheme.text.secondary,
          }}
        >
          {number(Math.round(stats.totalHoursWatched))}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: currentTheme.text.muted,
          }}
        >
          {t('Stunden · ≈ {n} Tage', { n: stats.totalDaysEquivalent })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 }}>
        {tiles.map((tile) => (
          <StatTile key={tile.label} value={tile.value} label={tile.label} />
        ))}
      </div>

      {stats.topSeries.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: currentTheme.text.muted,
              marginBottom: 18,
            }}
          >
            {t('Meine Top Serien')}
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24 }}
          >
            {stats.topSeries.slice(0, 3).map((serie, index) => (
              <PosterSlot
                key={serie.id}
                rank={index + 1}
                title={serie.title}
                meta={t('{n} Episoden', { n: serie.episodesWatched })}
                src={serie.poster ? `https://image.tmdb.org/t/p/w342${serie.poster}` : undefined}
                showImages={showImages}
              />
            ))}
          </div>
        </div>
      )}

      {highlights.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${highlights.length}, minmax(0, 1fr))`,
            gap: 18,
          }}
        >
          {highlights.map((h) => (
            <Highlight key={h.title} title={h.title} value={h.value} />
          ))}
        </div>
      )}
    </ShareCardFrame>
  );
};

// Sheet

interface WrappedShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stats: WrappedStats;
}

export const WrappedShareSheet: React.FC<WrappedShareSheetProps> = ({ isOpen, onClose, stats }) => {
  const shareText = t(
    'Mein {year} in Zahlen: {episodes} Episoden, {movies} Filme, {hours} Stunden. tv-rank.de',
    {
      year: stats.year,
      episodes: stats.totalEpisodesWatched,
      movies: stats.totalMoviesWatched,
      hours: Math.round(stats.totalHoursWatched),
    }
  );

  return (
    <ShareCardSheet
      isOpen={isOpen}
      onClose={onClose}
      sheetTitle={t('Wrapped {year} teilen', { year: stats.year })}
      filename={`tv-rank-wrapped-${stats.year}.png`}
      shareText={shareText}
      renderCard={(showImages) => <WrappedShareCard stats={stats} showImages={showImages} />}
    />
  );
};
