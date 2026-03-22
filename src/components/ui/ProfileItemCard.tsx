/**
 * ProfileItemCard - Shared poster grid card for FriendProfile and PublicProfile pages.
 *
 * Accepts pre-computed values so it stays type-agnostic.
 * Optionally uses Framer Motion stagger animation via `animated` prop.
 */

import { Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import './ProfileItemCard.css';

export interface ProfileCardProvider {
  id: number;
  name: string;
  logo: string;
}

/** Minimal theme subset required by this component. */
interface CardTheme {
  primary: string;
  secondary?: string;
  accent?: string;
  background: { surface: string };
  text: { primary: string };
  status?: { success: string };
}

interface ProfileItemCardProps {
  title: string;
  posterUrl: string;
  isMovie: boolean;
  rating: number;
  progress: number;
  providers: ProfileCardProvider[];
  index?: number;
  animated?: boolean;
  currentTheme: CardTheme;
  onClick: () => void;
}

export const ProfileItemCard = memo<ProfileItemCardProps>(
  ({
    title,
    posterUrl,
    isMovie,
    rating,
    progress,
    providers,
    index = 0,
    animated = true,
    currentTheme,
    onClick,
  }) => {
    const successColor = currentTheme.status?.success ?? '#10b981';
    const secondaryColor = currentTheme.secondary ?? '${currentTheme.accent}';

    const card = (
      <div className="pic-card" onClick={onClick}>
        <div className="pic-poster-wrap">
          <img
            src={posterUrl}
            alt={title}
            className="pic-poster"
            style={{ background: currentTheme.background.surface }}
            loading="lazy"
            decoding="async"
          />

          {providers.length > 0 && (
            <div className="pic-providers">
              {providers.slice(0, 2).map((p) => (
                <div key={p.id} className="pic-provider-badge">
                  <img
                    src={p.logo}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    className="pic-provider-logo"
                  />
                </div>
              ))}
            </div>
          )}

          {rating > 0 && (
            <div className="pic-rating-badge">
              <Star style={{ fontSize: '15px', color: currentTheme.accent ?? '#ffc107' }} />
              <span className="pic-rating-text">{rating.toFixed(1)}</span>
            </div>
          )}

          {!isMovie && progress > 0 && (
            <div className="pic-progress-track">
              <div
                className="pic-progress-fill"
                style={{
                  width: `${progress}%`,
                  background:
                    progress === 100
                      ? `linear-gradient(90deg, ${successColor}, #10b981)`
                      : `linear-gradient(90deg, ${currentTheme.primary}, ${secondaryColor})`,
                }}
              />
            </div>
          )}
        </div>

        <div className="pic-title" style={{ color: currentTheme.text.primary }}>
          {title}
        </div>
      </div>
    );

    if (!animated) return card;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.3) }}
      >
        {card}
      </motion.div>
    );
  }
);

ProfileItemCard.displayName = 'ProfileItemCard';
