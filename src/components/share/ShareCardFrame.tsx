/**
 * ShareCardFrame - Rahmen für exportierbare Share-Cards (Story-Format 1080×1920).
 *
 * Wird in fester Render-Größe aufgebaut und in der Vorschau per
 * transform: scale() verkleinert angezeigt (siehe ShareCardSheet).
 * Cinematic-Look aus dem Design-System: Theme-Gradient-Hintergrund,
 * Glow-Orbs in Primär-/Akzentfarbe, GradientText-Titel und
 * tv-rank.de-Branding unten — alles aus currentTheme, nichts hardcodet.
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { GradientText } from '../ui';
import { t } from '../../services/i18n';

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

interface ShareCardFrameProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ShareCardFrame: React.FC<ShareCardFrameProps> = ({ title, subtitle, children }) => {
  const { currentTheme } = useTheme();

  return (
    <div
      style={{
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        padding: '112px 88px 80px',
        background: `linear-gradient(180deg, ${currentTheme.background.default} 0%, ${currentTheme.background.surface} 55%, ${currentTheme.background.default} 100%)`,
        fontFamily: 'var(--font-display)',
        color: currentTheme.text.secondary,
      }}
    >
      {/* Glow-Orbs (Primär oben rechts, Akzent unten links) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -220,
          right: -220,
          width: 760,
          height: 760,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentTheme.primary}2a 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -260,
          left: -260,
          width: 860,
          height: 860,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${currentTheme.accent}24 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Kopf: Eyebrow + Titel + Untertitel */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: currentTheme.primary,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: currentTheme.primary,
              boxShadow: `0 0 24px ${currentTheme.primary}`,
            }}
          />
          TV-Rank
        </span>
        <GradientText
          as="h1"
          style={{
            display: 'block',
            fontSize: 92,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            margin: '28px 0 0',
          }}
        >
          {title}
        </GradientText>
        {subtitle && (
          <p
            style={{
              margin: '24px 0 0',
              fontSize: 40,
              fontWeight: 500,
              letterSpacing: '0.01em',
              color: currentTheme.text.muted,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Inhalt (Metriken) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        {children}
      </div>

      {/* Fuß: Edge-Light + Branding */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          aria-hidden
          style={{
            height: 2,
            borderRadius: 'var(--radius-full)',
            background: `linear-gradient(90deg, transparent, ${currentTheme.primary}66, rgba(255, 255, 255, 0.14), ${currentTheme.primary}66, transparent)`,
            marginBottom: 40,
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 14,
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ color: currentTheme.text.secondary }}>tv-rank.de</span>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: currentTheme.primary,
              alignSelf: 'center',
            }}
          />
          <span style={{ color: currentTheme.text.muted, fontWeight: 500, fontSize: 32 }}>
            {t('Dein Serien-Tracker')}
          </span>
        </div>
      </div>
    </div>
  );
};
