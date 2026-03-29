import { Public, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { BackButton, GradientText } from '../../components/ui';
import type { PublicTheme } from './usePublicProfileData';

interface PublicProfileHeaderProps {
  profileName: string;
  itemsWithRatingCount: number;
  averageRating: number;
  currentTheme: PublicTheme;
}

export const PublicProfileHeader = memo<PublicProfileHeaderProps>(
  ({ profileName, itemsWithRatingCount, averageRating, currentTheme }) => (
    <motion.header
      className="pp-header"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        background: `${currentTheme.background.default}90`,
      }}
    >
      <div className="pp-header__inner">
        <BackButton />

        <div className="pp-header__info">
          <GradientText
            as="h1"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              margin: 0,
            }}
          >
            {profileName}
          </GradientText>
          <div className="pp-header__meta" style={{ color: currentTheme.text.secondary }}>
            <span className="pp-header__meta-item">
              <Public style={{ fontSize: '14px', color: currentTheme.primary }} />
              Öffentlich
            </span>
            <span className="pp-header__meta-dot">•</span>
            <span>{itemsWithRatingCount} bewertet</span>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="pp-header__badge">
          <Star
            style={{
              fontSize: 16,
              color: ('accent' in currentTheme
                ? currentTheme.accent
                : currentTheme.primary) as string,
            }}
          />
          <span className="pp-header__badge-value">Ø {averageRating.toFixed(1)}</span>
        </div>
      </div>
    </motion.header>
  )
);

PublicProfileHeader.displayName = 'PublicProfileHeader';
