import { Add, Movie, Star, Tv, Visibility } from '@mui/icons-material';
import { memo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { CommunityRatings } from '../../../services/catalog/staticCatalog';
import { pickDisplayRating } from '../../../hooks/rating/useCommunityRatings';
import { mediaTargetProps } from '../../../lib/interaction/mediaTarget';
import { roleLine, type FilmographyEntry } from '../../../lib/person/filmography';
import { formatRatingShort } from '../../../lib/rating/rating';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { getImageUrl } from '../../../utils/imageUrl';

export interface CreditCardStatus {
  added: boolean;
  ownRating: number;
  watched: boolean;
  busyAction: 'add' | 'watched' | null;
}

interface PersonCreditCardProps {
  entry: FilmographyEntry;
  status: CreditCardStatus;
  community: CommunityRatings | null;
  canEdit: boolean;
  onOpen: (entry: FilmographyEntry) => void;
  onAdd: (entry: FilmographyEntry, e: React.MouseEvent) => void;
  onWatched: (entry: FilmographyEntry, inList: boolean, e: React.MouseEvent) => void;
  onRate: (entry: FilmographyEntry, rating: number, e: React.MouseEvent) => void;
}

export const PersonCreditCard = memo(
  ({
    entry,
    status,
    community,
    canEdit,
    onOpen,
    onAdd,
    onWatched,
    onRate,
  }: PersonCreditCardProps) => {
    const { currentTheme } = useTheme();
    const onPrimary = getOptimalTextColor(currentTheme.primary);
    const onSuccess = getOptimalTextColor(currentTheme.status.success);
    const rating = pickDisplayRating(
      community,
      entry.type === 'series' ? 'series' : 'movies',
      entry.id,
      entry.voteCount >= 10 ? entry.voteAverage : undefined
    );
    const role = roleLine(entry);
    const meta = [
      entry.year,
      entry.type === 'series' && entry.episodeCount > 0
        ? entry.episodeCount === 1
          ? t('1 Folge')
          : t('{n} Folgen', { n: entry.episodeCount })
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const busy = status.busyAction !== null;
    const showWatched = canEdit && entry.type === 'movie' && !status.watched;

    return (
      <div
        {...mediaTargetProps({
          type: entry.type,
          id: entry.id,
          title: entry.title,
          poster: entry.posterPath,
        })}
        className="pp-card"
        role="button"
        tabIndex={0}
        onClick={() => onOpen(entry)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(entry);
          }
        }}
      >
        <div className="pp-card__poster-wrap">
          {entry.posterPath ? (
            <img
              className="pp-card__poster"
              src={getImageUrl(entry.posterPath, 'w342')}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="pp-card__poster pp-card__poster--empty"
              style={{ background: `${currentTheme.text.muted}1f` }}
            >
              {entry.type === 'movie' ? (
                <Movie style={{ fontSize: 30, color: currentTheme.text.muted }} />
              ) : (
                <Tv style={{ fontSize: 30, color: currentTheme.text.muted }} />
              )}
            </div>
          )}
          {rating && (
            <span
              className="pp-card__rating"
              style={{ background: `${currentTheme.background.default}d9` }}
            >
              <Star
                style={{
                  fontSize: 12,
                  color: rating.isCommunity ? currentTheme.primary : currentTheme.accent,
                }}
              />
              {rating.value.toFixed(1)}
            </span>
          )}
          <span
            className="pp-card__type"
            style={{ background: `${currentTheme.primary}e6`, color: onPrimary }}
          >
            {entry.type === 'series' ? t('Serie') : t('Film')}
          </span>
          {showWatched && (
            <button
              type="button"
              className="pp-card__btn pp-card__btn--watched"
              aria-label={
                status.added
                  ? t('„{title}" als gesehen markieren', { title: entry.title })
                  : t('„{title}" hinzufügen und als gesehen markieren', { title: entry.title })
              }
              disabled={busy}
              onClick={(e) => onWatched(entry, status.added, e)}
              style={{
                border: `1px solid ${currentTheme.status.success}99`,
                color: currentTheme.status.success,
                opacity: status.busyAction === 'watched' ? 0.7 : 1,
              }}
            >
              <Visibility style={{ fontSize: 18 }} />
            </button>
          )}
          {canEdit &&
            (status.added ? (
              <button
                type="button"
                className="pp-card__btn pp-card__btn--rate"
                aria-label={
                  status.ownRating > 0
                    ? t('„{title}" ist mit {rating} bewertet. Bewertung ändern', {
                        title: entry.title,
                        rating: formatRatingShort(status.ownRating),
                      })
                    : t('„{title}" bewerten', { title: entry.title })
                }
                onClick={(e) => onRate(entry, status.ownRating, e)}
                style={{ background: currentTheme.status.success, color: onSuccess }}
              >
                {status.ownRating > 0 ? (
                  <span className="pp-card__rate-value">{formatRatingShort(status.ownRating)}</span>
                ) : (
                  <Star style={{ fontSize: 20 }} />
                )}
              </button>
            ) : (
              <button
                type="button"
                className="pp-card__btn pp-card__btn--add"
                aria-label={t('„{title}" zur Liste hinzufügen', { title: entry.title })}
                disabled={busy}
                onClick={(e) => onAdd(entry, e)}
                style={{
                  background:
                    status.busyAction === 'add'
                      ? 'var(--glass-heavy)'
                      : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  color: onPrimary,
                  opacity: status.busyAction === 'add' ? 0.7 : 1,
                }}
              >
                <Add style={{ fontSize: 20 }} />
              </button>
            ))}
        </div>
        <span className="pp-card__title" style={{ color: currentTheme.text.primary }}>
          {entry.title}
        </span>
        {role && (
          <span className="pp-card__role" style={{ color: currentTheme.text.secondary }}>
            {role}
          </span>
        )}
        {meta && (
          <span className="pp-card__meta" style={{ color: currentTheme.text.muted }}>
            {meta}
          </span>
        )}
      </div>
    );
  }
);

PersonCreditCard.displayName = 'PersonCreditCard';
