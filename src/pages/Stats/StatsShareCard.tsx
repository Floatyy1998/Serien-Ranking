/**
 * StatsShareCard - Share-Card + Sheet für die Stats-Seite.
 *
 * Gießt die Kern-Metriken (Watchtime, Episoden, Serien/Filme, Top-Genre,
 * Top-Provider) in die ShareCardFrame. Kommt ohne externe Bilder aus,
 * ist also nicht von Poster-CORS betroffen.
 */

import React from 'react';
import { ShareCardFrame } from '../../components/share/ShareCardFrame';
import { ShareCardSheet } from '../../components/share/ShareCardSheet';
import { GradientText } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import type { FormattedTime, StatsData } from './useStatsData';

// Karten-Bausteine
const tileStyle: React.CSSProperties = {
  flex: 1,
  background: 'var(--glass-medium)',
  border: '1px solid var(--glass-border-light)',
  borderRadius: 'var(--radius-2xl)',
  padding: '44px 24px',
  textAlign: 'center',
};

interface StatTileProps {
  value: string;
  label: string;
}

const StatTile: React.FC<StatTileProps> = ({ value, label }) => {
  const { currentTheme } = useTheme();
  return (
    <div style={tileStyle}>
      <div
        style={{
          fontSize: 72,
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
          marginTop: 16,
          fontSize: 30,
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

interface TopRowProps {
  label: string;
  value: string;
}

const TopRow: React.FC<TopRowProps> = ({ label, value }) => {
  const { currentTheme } = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        background: 'var(--glass-light)',
        border: '1px solid var(--glass-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 44px',
      }}
    >
      <span
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: currentTheme.text.muted,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          color: currentTheme.primary,
          textAlign: 'right',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
};

// Karte
interface StatsShareCardProps {
  stats: StatsData;
  timeData: FormattedTime;
}

const StatsShareCard: React.FC<StatsShareCardProps> = ({ stats, timeData }) => {
  const { currentTheme } = useTheme();

  return (
    <ShareCardFrame title="Meine Stats" subtitle="Mein Viewing-Universum in Zahlen">
      {/* Hero: Watchtime */}
      <div style={{ textAlign: 'center' }}>
        <GradientText
          as="span"
          style={{
            display: 'inline-block',
            fontSize: 200,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          {timeData.value}
        </GradientText>
        <div
          style={{
            marginTop: 8,
            fontSize: 52,
            fontWeight: 800,
            color: currentTheme.text.secondary,
          }}
        >
          {timeData.unit}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: currentTheme.text.muted,
          }}
        >
          Watchtime gesamt
        </div>
      </div>

      {/* Kern-Zahlen */}
      <div style={{ display: 'flex', gap: 24 }}>
        <StatTile value={stats.watchedEpisodes.toLocaleString('de-DE')} label="Episoden" />
        <StatTile value={stats.totalSeries.toLocaleString('de-DE')} label="Serien" />
        <StatTile value={stats.totalMovies.toLocaleString('de-DE')} label="Filme" />
      </div>

      {/* Top-Genre & Top-Provider */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <TopRow label="Top-Genre" value={stats.topGenres[0]?.name || '–'} />
        <TopRow label="Top-Provider" value={stats.topProviders[0]?.name || '–'} />
      </div>
    </ShareCardFrame>
  );
};

// Sheet
interface StatsShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StatsData;
  timeData: FormattedTime;
}

export const StatsShareSheet: React.FC<StatsShareSheetProps> = ({
  isOpen,
  onClose,
  stats,
  timeData,
}) => {
  const shareText =
    `Meine TV-Rank Stats: ${stats.watchedEpisodes.toLocaleString('de-DE')} Episoden, ` +
    `${timeData.value} ${timeData.unit} Watchtime, ${stats.totalSeries} Serien & ` +
    `${stats.totalMovies} Filme. tv-rank.de`;

  return (
    <ShareCardSheet
      isOpen={isOpen}
      onClose={onClose}
      sheetTitle="Stats teilen"
      filename="tv-rank-stats.png"
      shareText={shareText}
      renderCard={() => <StatsShareCard stats={stats} timeData={timeData} />}
    />
  );
};
