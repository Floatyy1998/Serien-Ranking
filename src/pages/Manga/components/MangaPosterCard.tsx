import { CheckCircle, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import type React from 'react';
import { tapScale } from '../../../lib/motion';
import { t } from '../../../services/i18n';
import { FORMAT_COLORS, getDisplayFormat, getDisplayFormatKey } from '../mangaUtils';
import './MangaCards.css';

interface MangaPosterCardProps {
  title: string;
  poster: string;
  format?: string;
  countryOfOrigin?: string;
  /** Zweite Zeile unter dem Titel (z. B. „Kap. 12 / 80" oder „vor 2 Tagen"). */
  meta?: React.ReactNode;
  /** Hervorgehobener Chip oben rechts (z. B. „+3 neu"). */
  highlight?: string;
  /** Eigene Bewertung oder AniList-Score als Stern-Chip. */
  score?: string;
  owned?: boolean;
  progress?: number;
  onClick: () => void;
}

export const MangaPosterCard = ({
  title,
  poster,
  format,
  countryOfOrigin,
  meta,
  highlight,
  score,
  owned,
  progress,
  onClick,
}: MangaPosterCardProps) => {
  const formatKey = getDisplayFormatKey(countryOfOrigin, format);
  const formatLabel = getDisplayFormat(countryOfOrigin, format);

  return (
    <motion.div
      className="mpc"
      role="button"
      tabIndex={0}
      aria-label={t('{title} öffnen', { title })}
      whileTap={tapScale}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="mpc-art">
        <img src={poster} alt={title} loading="lazy" decoding="async" />
        <div className="mpc-top">
          <span className="mpc-chip" style={{ color: FORMAT_COLORS[formatKey] || undefined }}>
            {formatLabel}
          </span>
          {highlight ? (
            <span className="mpc-chip mpc-chip--hot">{highlight}</span>
          ) : owned ? (
            <span className="mpc-chip mpc-chip--owned" title={t('In deiner Sammlung')}>
              <CheckCircle style={{ fontSize: 13 }} />
            </span>
          ) : score ? (
            <span className="mpc-chip mpc-chip--score">
              <Star style={{ fontSize: 12 }} />
              {score}
            </span>
          ) : null}
        </div>
        <div className="mpc-bottom">
          <div className="mpc-title">{title}</div>
          {meta && <div className="mpc-meta">{meta}</div>}
        </div>
        {progress !== undefined && progress > 0 && (
          <div className="mpc-progress" aria-hidden>
            <span style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
