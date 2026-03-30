/**
 * TasteProfilePage - KI Watch-Empfehlungen
 * Clean list layout, theme-aware
 */

import { AutoAwesome, Movie, Refresh, Star, Tv } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PageLayout, PageHeader } from '../../components/ui';
import { CONFIDENCE_COLORS } from './constants';
import { useTasteProfileData } from './useTasteProfileData';
import type { Recommendation } from './useTasteProfileData';
import './TasteProfilePage.css';

// ==================== Card ====================

const RecCard: React.FC<{ rec: Recommendation; index: number }> = ({ rec, index }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const isMovie = rec.mediaType === 'movie';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="tp-card"
      style={{ borderBottom: `1px solid ${currentTheme.border.light}` }}
      onClick={() =>
        rec.tmdbId && navigate(isMovie ? `/movie/${rec.tmdbId}` : `/series/${rec.tmdbId}`)
      }
    >
      <div className="tp-card__poster-wrap" style={{ background: currentTheme.background.surface }}>
        {rec.posterUrl ? (
          <img src={rec.posterUrl} alt={rec.title} className="tp-card__poster" />
        ) : (
          <div className="tp-card__poster-placeholder" style={{ color: currentTheme.text.muted }}>
            {isMovie ? <Movie style={{ fontSize: 32 }} /> : <Tv style={{ fontSize: 32 }} />}
          </div>
        )}
        <div className="tp-card__type-badge" style={{ color: currentTheme.text.secondary }}>
          {isMovie ? <Movie style={{ fontSize: 12 }} /> : <Tv style={{ fontSize: 12 }} />}
          <span>{isMovie ? 'Film' : 'Serie'}</span>
        </div>
      </div>

      <div className="tp-card__info">
        <div className="tp-card__top-row">
          <h3 className="tp-card__title" style={{ color: currentTheme.text.secondary }}>
            {rec.title}
          </h3>
          <span
            className="tp-card__match"
            style={{ background: CONFIDENCE_COLORS[rec.confidence] }}
          >
            {rec.confidence === 'high' ? 'Top' : 'Match'}
          </span>
        </div>

        <div className="tp-card__meta">
          {rec.rating != null && (
            <span className="tp-card__rating" style={{ color: currentTheme.status.warning }}>
              <Star style={{ fontSize: 16 }} />
              {rec.rating}
            </span>
          )}
          {rec.providers && rec.providers.length > 0 && (
            <div className="tp-card__providers">
              {rec.providers.map((p) => (
                <img
                  key={p.name}
                  src={p.logo}
                  alt={p.name}
                  title={p.name}
                  className="tp-card__provider-logo"
                />
              ))}
            </div>
          )}
        </div>

        <p className="tp-card__reason" style={{ color: currentTheme.text.muted }}>
          {rec.reason}
        </p>

        <div className="tp-card__genres">
          {rec.matchGenres.slice(0, 3).map((g) => (
            <span
              key={g}
              className="tp-card__genre"
              style={{ background: currentTheme.overlay.medium, color: currentTheme.text.muted }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ==================== Loading ====================

const LoadingState: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <div className="tp-loading__list">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="tp-loading__item"
          style={{ borderBottom: `1px solid ${currentTheme.border.lighter}` }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 }}
        >
          <div
            className="tp-loading__poster"
            style={{ background: currentTheme.background.surface }}
          />
          <div className="tp-loading__info">
            <div
              className="tp-loading__line"
              style={{ width: '65%', background: currentTheme.background.surface }}
            />
            <div
              className="tp-loading__line"
              style={{ width: '40%', background: currentTheme.background.surface }}
            />
            <div
              className="tp-loading__line"
              style={{ width: '85%', background: currentTheme.background.surface }}
            />
          </div>
        </motion.div>
      ))}
      <motion.p
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="tp-loading__text"
        style={{ color: currentTheme.text.muted }}
      >
        Suche passende Empfehlungen...
      </motion.p>
    </div>
  );
};

// ==================== Main ====================

export const TasteProfilePage: React.FC = () => {
  const { currentTheme } = useTheme();

  const { result, generating, error, hasEnoughData, generateProfile, clearCache } =
    useTasteProfileData();

  const count = result?.recommendations.length || 0;

  return (
    <PageLayout>
      <PageHeader
        title="Für dich"
        subtitle={count > 0 ? `${count} Empfehlungen` : 'KI-gestützte Empfehlungen'}
        icon={<AutoAwesome style={{ fontSize: 22, color: currentTheme.primary }} />}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        actions={
          result ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                clearCache();
                generateProfile();
              }}
              className="tp-refresh-btn"
              style={{
                background: currentTheme.overlay.medium,
                border: `1px solid ${currentTheme.border.light}`,
                color: currentTheme.text.secondary,
              }}
            >
              <Refresh style={{ fontSize: 18 }} />
            </motion.button>
          ) : undefined
        }
      />

      <div className="tp-content">
        {!hasEnoughData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tp-empty">
            <div className="tp-empty__icon" style={{ background: currentTheme.overlay.medium }}>
              <AutoAwesome style={{ fontSize: 32, color: currentTheme.primary }} />
            </div>
            <p className="tp-empty__title" style={{ color: currentTheme.text.secondary }}>
              Noch nicht genug Daten
            </p>
            <p className="tp-empty__text" style={{ color: currentTheme.text.muted }}>
              Bewerte mindestens 5 Serien oder Filme, damit die KI Empfehlungen generieren kann.
            </p>
          </motion.div>
        )}

        {hasEnoughData && !result && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="tp-cta-wrapper"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={generateProfile}
              className="tp-cta-btn"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                boxShadow: `0 4px 20px ${currentTheme.primary}30`,
              }}
            >
              <AutoAwesome style={{ fontSize: 20 }} />
              Empfehlungen generieren
            </motion.button>
            <p className="tp-cta-sub" style={{ color: currentTheme.text.muted }}>
              Basierend auf deinen Bewertungen und Watch-Patterns
            </p>
            {error && (
              <p className="tp-error" style={{ color: currentTheme.status.error }}>
                {error}
              </p>
            )}
          </motion.div>
        )}

        {generating && <LoadingState />}

        <AnimatePresence>
          {result && !generating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {result.recommendations.length > 0 ? (
                <div className="tp-list">
                  {result.recommendations.map((rec, i) => (
                    <RecCard key={rec.title} rec={rec} index={i} />
                  ))}
                </div>
              ) : (
                <div className="tp-empty">
                  <p className="tp-empty__title" style={{ color: currentTheme.text.secondary }}>
                    Keine Empfehlungen
                  </p>
                  <p className="tp-empty__text" style={{ color: currentTheme.text.muted }}>
                    Versuche es erneut.
                  </p>
                </div>
              )}
              {error && (
                <p className="tp-error" style={{ color: currentTheme.status.error }}>
                  {error}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
};
