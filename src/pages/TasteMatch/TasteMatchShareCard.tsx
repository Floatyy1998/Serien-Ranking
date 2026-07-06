/**
 * TasteMatchShareCard - Share-Card + Sheet für die TasteMatch-Seite.
 *
 * Nutzt ausschließlich die bereits geladenen Daten des Screens (Ergebnis,
 * Namen, Fotos) — keine neuen Reads. Avatare und Serien-Poster sind externe
 * Bilder und werden bei showImages=false weggelassen (CORS-Fallback).
 */

import React from 'react';
import { ShareCardFrame } from '../../components/share/ShareCardFrame';
import { ShareCardSheet } from '../../components/share/ShareCardSheet';
import { GradientText } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import type { TasteMatchResult } from '../../services/tasteMatchService';
import {
  FRIEND_COLOR,
  FRIEND_GRADIENT,
  USER_COLOR,
  USER_GRADIENT,
  getCompatibilityColors,
} from './constants';
import { getScoreMessage } from './useTasteMatchData';

// ==================== Karten-Bausteine ====================

interface AvatarProps {
  name: string;
  photo: string | null;
  gradient: string;
  color: string;
  showImages: boolean;
}

const CardAvatar: React.FC<AvatarProps> = ({ name, photo, gradient, color, showImages }) => (
  <div
    style={{
      width: 160,
      height: 160,
      borderRadius: '50%',
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      fontSize: 64,
      fontWeight: 900,
      color: 'white',
      boxShadow: `0 12px 40px ${color}50`,
      flexShrink: 0,
    }}
  >
    {showImages && photo ? (
      <img
        src={photo}
        alt=""
        crossOrigin="anonymous"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ) : (
      name.charAt(0).toUpperCase()
    )}
  </div>
);

interface CountTileProps {
  value: number;
  label: string;
}

const CountTile: React.FC<CountTileProps> = ({ value, label }) => {
  const { currentTheme } = useTheme();
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--glass-medium)',
        border: '1px solid var(--glass-border-light)',
        borderRadius: 'var(--radius-2xl)',
        padding: '36px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          lineHeight: 1,
          color: currentTheme.text.secondary,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 28,
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

interface TasteMatchShareCardProps {
  result: TasteMatchResult;
  userName: string;
  userPhoto: string | null;
  friendName: string;
  friendPhoto: string | null;
  showImages: boolean;
}

const TasteMatchShareCard: React.FC<TasteMatchShareCardProps> = ({
  result,
  userName,
  userPhoto,
  friendName,
  friendPhoto,
  showImages,
}) => {
  const { currentTheme } = useTheme();
  const compatColors = getCompatibilityColors(result.overallMatch);
  const sharedGenres = result.genreMatch.sharedGenres.slice(0, 4);
  const sharedSeries = result.seriesOverlap.sharedSeries.slice(0, 3);

  return (
    <ShareCardFrame title="Taste Match" subtitle={`${userName} × ${friendName}`}>
      {/* Hero: Avatare + Kompatibilitäts-% */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <CardAvatar
            name={userName}
            photo={userPhoto}
            gradient={USER_GRADIENT}
            color={USER_COLOR}
            showImages={showImages}
          />
          <div
            aria-hidden
            style={{
              width: 120,
              height: 4,
              background: `linear-gradient(90deg, ${USER_COLOR}, ${FRIEND_COLOR})`,
              borderRadius: 'var(--radius-full)',
            }}
          />
          <CardAvatar
            name={friendName}
            photo={friendPhoto}
            gradient={FRIEND_GRADIENT}
            color={FRIEND_COLOR}
            showImages={showImages}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <GradientText
            as="span"
            from={compatColors.from}
            to={compatColors.to}
            style={{
              fontSize: 190,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {result.overallMatch}
          </GradientText>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: currentTheme.text.muted,
              marginLeft: 8,
            }}
          >
            %
          </span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: `${compatColors.from}18`,
            border: `2px solid ${compatColors.from}40`,
            borderRadius: 'var(--radius-full)',
            padding: '18px 44px',
            fontSize: 36,
            fontWeight: 700,
            color: currentTheme.text.secondary,
          }}
        >
          {getScoreMessage(result.overallMatch)}
        </div>
      </div>

      {/* Gemeinsame Zahlen */}
      <div style={{ display: 'flex', gap: 20 }}>
        <CountTile value={result.seriesOverlap.sharedSeries.length} label="Serien" />
        <CountTile value={result.movieOverlap.sharedMovies.length} label="Filme" />
        <CountTile value={result.genreMatch.sharedGenres.length} label="Genres" />
      </div>

      {/* Gemeinsame Genres */}
      {sharedGenres.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: currentTheme.text.muted,
            }}
          >
            Gemeinsame Genres
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {sharedGenres.map((g) => (
              <span
                key={g.genre}
                style={{
                  background: 'var(--glass-light)',
                  border: '1px solid var(--glass-border-light)',
                  borderRadius: 'var(--radius-full)',
                  padding: '16px 36px',
                  fontSize: 32,
                  fontWeight: 700,
                  color: currentTheme.text.secondary,
                }}
              >
                {g.genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gemeinsame Serien */}
      {sharedSeries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: currentTheme.text.muted,
            }}
          >
            Gemeinsame Serien
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {sharedSeries.map((s) => (
              <div
                key={s.id}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  background: 'var(--glass-light)',
                  border: '1px solid var(--glass-border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 20,
                }}
              >
                {showImages && s.poster ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${s.poster}`}
                    alt=""
                    crossOrigin="anonymous"
                    style={{
                      width: 64,
                      height: 96,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{
                      width: 64,
                      height: 96,
                      borderRadius: 'var(--radius-sm)',
                      background: `linear-gradient(135deg, ${USER_COLOR}, ${FRIEND_COLOR})`,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: currentTheme.text.secondary,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ShareCardFrame>
  );
};

// ==================== Sheet ====================

interface TasteMatchShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  result: TasteMatchResult;
  userName: string;
  userPhoto: string | null;
  friendName: string;
  friendPhoto: string | null;
}

export const TasteMatchShareSheet: React.FC<TasteMatchShareSheetProps> = ({
  isOpen,
  onClose,
  result,
  userName,
  userPhoto,
  friendName,
  friendPhoto,
}) => {
  const shareText =
    `Mein Taste Match mit ${friendName}: ${result.overallMatch}% – ` +
    `${result.seriesOverlap.sharedSeries.length} gemeinsame Serien und ` +
    `${result.movieOverlap.sharedMovies.length} gemeinsame Filme! tv-rank.de`;

  return (
    <ShareCardSheet
      isOpen={isOpen}
      onClose={onClose}
      sheetTitle="Taste Match teilen"
      filename="tv-rank-taste-match.png"
      shareText={shareText}
      renderCard={(showImages) => (
        <TasteMatchShareCard
          result={result}
          userName={userName}
          userPhoto={userPhoto}
          friendName={friendName}
          friendPhoto={friendPhoto}
          showImages={showImages}
        />
      )}
    />
  );
};
