import StarRounded from '@mui/icons-material/StarRounded';
import { useTheme } from '../../contexts/ThemeContext';
import { useFriendTitleRatings } from '../../hooks/social/useFriendTitleRatings';
import { formatRatingShort } from '../../lib/rating/rating';
import { t } from '../../services/i18n';
import { UserAvatar } from '../ui/media/UserAvatar';

interface FriendRatingsPanelProps {
  itemId: number | string | undefined;
  mediaType: 'series' | 'movie';
  /** Lädt erst, wenn der Reiter offen ist. */
  active: boolean;
}

/** „S2 E4 · 40%" bzw. „durchgeschaut" — die Antwort auf „hat der das zu Ende geschaut?". */
const progressLabel = (
  percentage: number | null,
  season: number | null,
  episode: number | null
): string | null => {
  if (percentage === null) return null;
  if (percentage === 0) return t('noch nicht gestartet');
  if (percentage >= 100) return t('durchgeschaut');
  const place = season && episode ? `S${season} E${episode} · ` : '';
  return `${place}${percentage}%`;
};

/**
 * Bewertungen der Favoriten-Freunde zu einem Titel — der zweite Reiter im
 * Bewertungs-Sheet und der Inhalt des Kalender-Tooltips.
 */
export const FriendRatingsPanel: React.FC<FriendRatingsPanelProps> = ({
  itemId,
  mediaType,
  active,
}) => {
  const { currentTheme } = useTheme();
  const { loading, entries } = useFriendTitleRatings(itemId, mediaType, active);

  if (loading) {
    return (
      <p style={{ fontSize: '13px', color: currentTheme.text.muted, textAlign: 'center' }}>
        {t('Wird geladen …')}
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p
        style={{
          fontSize: '13px',
          color: currentTheme.text.muted,
          textAlign: 'center',
          margin: '12px 0',
          lineHeight: 1.5,
        }}
      >
        {mediaType === 'movie'
          ? t('Keiner deiner Favoriten hat den Film in der Liste.')
          : t('Keiner deiner Favoriten hat die Serie in der Liste.')}
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map((entry) => {
        const progress = progressLabel(entry.percentage, entry.latestSeason, entry.latestEpisode);
        return (
          <div
            key={entry.uid}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              background: currentTheme.background.surface,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <UserAvatar
              userId={entry.uid}
              username={entry.displayName}
              photoURL={entry.photoURL}
              size={36}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: currentTheme.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.displayName}
              </div>
              {progress && (
                <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>{progress}</div>
              )}
            </div>
            {entry.rating > 0 ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '15px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: currentTheme.status.warning,
                }}
              >
                <StarRounded style={{ fontSize: '16px' }} />
                {formatRatingShort(entry.rating)}
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: currentTheme.text.muted }}>
                {t('unbewertet')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
