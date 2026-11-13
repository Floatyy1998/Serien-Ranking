import { Public } from '@mui/icons-material';
import { memo } from 'react';
import { ScoreRow } from '../../components/detail/kit/DetailKit';
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
      <header className="fp-hero fp-hero--kit dk">
        <div
          className="fp-hero-glow"
          style={{
            background: `radial-gradient(70% 100% at 85% 0%, ${currentTheme.primary}20, transparent 72%)`,
          }}
          aria-hidden
        />
        <div className="fp-hero-nav">
          <BackButton />
        </div>
        <div className="fp-hero-top">
          <div className="fp-hero-avatar">
            <UserAvatar
              userId={profileUid ?? ''}
              username={profileName}
              photoURL={photoURL}
              size={76}
              navigable={false}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
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
            <div className="pp-public-pill" style={{ color: muted }}>
              <Public style={{ fontSize: 14, color: currentTheme.primary }} />
              {t('Öffentlich')}
            </div>
          </div>
        </div>
        <ScoreRow
          items={[
            {
              key: 'avg',
              label: t('Ø Wertung'),
              value: averageRating > 0 ? averageRating.toFixed(1) : '–',
              tone: accent,
              own: true,
            },
            {
              key: 'count',
              label: t('Bewertet'),
              value: String(itemsWithRatingCount),
              tone: currentTheme.primary,
            },
          ]}
        />
      </header>
    );
  }
);

PublicProfileHeader.displayName = 'PublicProfileHeader';
