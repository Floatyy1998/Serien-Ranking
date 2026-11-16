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
import {
  pickYearHighlights,
  yearFacts,
  type YearHighlight,
} from '../../lib/wrapped/yearHighlights';
import { factLabel, highlightImage, highlightKindLabel, highlightMeta } from './yearLabels';

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
  /** Rang oder, bei gemischten Medien, die Art des Titels. */
  badge: string;
  title: string;
  meta: string;
  src?: string;
  showImages: boolean;
}> = ({ badge, title, meta, src, showImages }) => {
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
            minWidth: 52,
            height: 52,
            padding: badge.length > 2 ? '0 18px' : 0,
            boxSizing: 'border-box',
            borderRadius: 26,
            background: 'rgba(0,0,0,0.65)',
            color: 'white',
            fontSize: badge.length > 2 ? 22 : 28,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge}
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

const sameKindHeading = (kind: YearHighlight['kind']): string => {
  switch (kind) {
    case 'series':
      return t('Meine Top Serien');
    case 'movie':
      return t('Meine Top Filme');
    case 'manga':
      return t('Meine Top Manga');
    default:
      return t('Meine Top Bücher');
  }
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

  // Die Karte zeigt, was dieses Konto wirklich nutzt: wer nur liest, bekommt
  // Seiten und Bücher statt einer Null bei den Stunden.
  const [hero, ...restFacts] = yearFacts(stats);
  const tiles = restFacts.slice(0, 4);
  const picks = pickYearHighlights(stats);
  const mixed = new Set(picks.map((pick) => pick.kind)).size > 1;

  const highlights = [
    topGenre && { title: t('Lieblings-Genre'), value: t(topGenre.genre) },
    topProvider && { title: t('Meistgenutzt'), value: topProvider.name },
  ].filter(Boolean) as { title: string; value: string }[];

  return (
    <ShareCardFrame
      title={t('Mein {year}', { year: stats.year })}
      subtitle={t('Mein Jahr im Rückblick')}
    >
      {hero && (
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
            {number(hero.value)}
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
            {hero.key === 'hours'
              ? t('Stunden · ≈ {n} Tage', { n: stats.totalDaysEquivalent })
              : factLabel(hero.key)}
          </div>
        </div>
      )}

      {tiles.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))`,
            gap: 18,
          }}
        >
          {tiles.map((tile) => (
            <StatTile key={tile.key} value={number(tile.value)} label={factLabel(tile.key)} />
          ))}
        </div>
      )}

      {picks.length > 0 && (
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
            {mixed ? t('Meine Highlights') : sameKindHeading(picks[0].kind)}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.max(3, picks.length)}, minmax(0, 1fr))`,
              gap: picks.length > 3 ? 18 : 24,
            }}
          >
            {picks.map((pick, index) => (
              <PosterSlot
                key={pick.key}
                badge={mixed ? highlightKindLabel(pick.kind) : String(index + 1)}
                title={pick.title}
                meta={highlightMeta(pick)}
                src={highlightImage(pick)}
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
  // Der Begleittext nennt, was dieses Konto wirklich hat (Leser: Bücher und Seiten).
  const locale = appDateLocale();
  const facts = yearFacts(stats)
    .slice(0, 3)
    .map((fact) => `${fact.value.toLocaleString(locale)} ${factLabel(fact.key)}`)
    .join(', ');
  const shareText = `${t('Mein {year} in Zahlen:', { year: stats.year })} ${facts}. https://tv-rank.de`;

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
