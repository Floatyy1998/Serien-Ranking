import { Public, Star } from '@mui/icons-material';
import { memo } from 'react';
import { BackButton, UserAvatar } from '../../components/ui';
import { NameBadges } from '../../components/ui/display/NameBadges';
import { t } from '../../services/i18n';
import type { PublicTheme } from './usePublicProfileData';
import '../FriendProfile/FriendProfilePage.css';

interface PublicProfileHeaderProps {
  profileName: string;
  profileUid?: string | null;
  photoURL?: string;
  itemsWithRatingCount: number;
  averageRating: number;
  currentTheme: PublicTheme;
}

export const PublicProfileHeader = memo<PublicProfileHeaderProps>(
  ({ profileName, profileUid, photoURL, itemsWithRatingCount, averageRating, currentTheme }) => {
    const muted = (currentTheme.text as { muted?: string }).muted ?? currentTheme.text.secondary;
    const accent = (
      'accent' in currentTheme ? currentTheme.accent : currentTheme.primary
    ) as string;

    return (
      <header className="fp-hero">
        <div
          className="fp-hero-glow"
          style={{
            background: `radial-gradient(70% 100% at 85% 0%, ${currentTheme.primary}20, transparent 72%)`,
          }}
          aria-hidden
        />
        <div className="fp-hero-top">
          <BackButton />
          <h1 className="fp-hero-name">
            <span
              style={{
                backgroundImage: `linear-gradient(90deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {profileName}
            </span>
            <NameBadges uid={profileUid} />
          </h1>
          <div className="fp-hero-rating">
            <span className="fp-hero-rating-val" style={{ color: currentTheme.text.secondary }}>
              <span className="fp-hero-avg" style={{ color: muted }}>
                {'Ø'}
              </span>
              <Star style={{ fontSize: 15, color: accent }} />
              {averageRating.toFixed(1)}
            </span>
            <span className="fp-hero-rating-cnt" style={{ color: muted }}>
              {t('{n} bewertet', { n: itemsWithRatingCount })}
            </span>
          </div>
          <div className="fp-hero-avatar">
            <UserAvatar
              userId={profileUid ?? ''}
              username={profileName}
              photoURL={photoURL}
              size={40}
              navigable={false}
            />
          </div>
        </div>
        <div className="pp-public-pill" style={{ color: muted }}>
          <Public style={{ fontSize: 14, color: currentTheme.primary }} />
          {t('Öffentlich')}
        </div>
      </header>
    );
  }
);

PublicProfileHeader.displayName = 'PublicProfileHeader';
