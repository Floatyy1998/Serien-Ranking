import Check from '@mui/icons-material/Check';
import CheckCircle from '@mui/icons-material/CheckCircle';
import SendRounded from '@mui/icons-material/SendRounded';
import Tv from '@mui/icons-material/Tv';
import ViewList from '@mui/icons-material/ViewList';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
import { memo, useState, type ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  ActionTiles,
  DetailStage,
  ScoreRow,
  type ScoreItem,
} from '../../components/detail/kit/DetailKit';
import { actionClass } from '../../components/detail/kit/actionClass';
import { IconButton } from '../../components/ui/input/IconButton';
import { FillerChip } from '../../components/ui/display/FillerChip';
import type { useTheme } from '../../contexts/ThemeContext';
import { episodeSpoilerMask } from '../../lib/spoiler/spoilerMask';
import { t } from '../../services/i18n';
import { useSpoilerLevel } from '../../services/settings/spoilerMode';
import { getImageUrl } from '../../utils/imageUrl';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

interface EpisodeStageProps {
  currentTheme: Theme;
  stillPath: string | null | undefined;
  backdropPath: string | null | undefined;
  posterPath: string | null | undefined;
  episodeName: string;
  seriesTitle: string;
  seriesId: string | undefined;
  seasonNumber: string | undefined;
  episodeNumber: string | undefined;
  /** TMDB-Wertung der Folge. */
  episodeRating: number | undefined;
  /** Eigene Wertung (0 = keine). */
  ownRating: number;
  community: { a: number; c: number } | null;
  episodeRuntime: number | null | undefined;
  formattedAirDate: string | null;
  watchCount: number;
  isWatched: boolean;
  fillerInfo?: { filler: boolean; recap: boolean } | null;
  /** Folgen der Staffel für den Streifen: gesehen ja/nein, in Reihenfolge. */
  seasonEpisodes: { key: number | string; watched: boolean }[];
  canTrack: boolean;
  /** Sterne-Regler — nur, wenn die Serie in der eigenen Liste ist. */
  rating?: ReactNode;
  onToggleWatched: () => void;
  /** Wechsel zu einer anderen Folge der Staffel (1-basiert). */
  onOpenEpisode: (episodeNumber: number) => void;
  onShare?: () => void;
  getStillUrl: (path: string | null, size?: string) => string;
  navigate: NavigateFunction;
}

const tapDim = { opacity: 0.7 };
const CELL_WINDOW = 48;

/** Kopf der Folgen-Seite im Detail-Baukasten: Szenenbild, Serienposter, Wertungen, Staffel-Streifen, Aktionen. */
export const EpisodeStage = memo(
  ({
    currentTheme,
    stillPath,
    backdropPath,
    posterPath,
    episodeName,
    seriesTitle,
    seriesId,
    seasonNumber,
    episodeNumber,
    episodeRating,
    ownRating,
    community,
    episodeRuntime,
    formattedAirDate,
    watchCount,
    isWatched,
    fillerInfo,
    seasonEpisodes,
    canTrack,
    rating,
    onToggleWatched,
    onOpenEpisode,
    onShare,
    getStillUrl,
    navigate,
  }: EpisodeStageProps) => {
    const spoilerLevel = useSpoilerLevel();
    const [spoilerRevealed, setSpoilerRevealed] = useState(false);
    const mask = episodeSpoilerMask(spoilerLevel, isWatched);
    const blurActive = mask.blurImage && !spoilerRevealed && !!stillPath;
    const hideText = mask.hideText && !spoilerRevealed;
    const displayName = hideText ? t('Folge {n}', { n: episodeNumber ?? '?' }) : episodeName;

    const art = stillPath
      ? getStillUrl(stillPath, 'original')
      : backdropPath
        ? getStillUrl(backdropPath, 'original')
        : undefined;
    const posterUrl = getImageUrl(posterPath ?? undefined, 'w342');
    const epIndex = Number(episodeNumber) - 1;
    const seen = seasonEpisodes.filter((e) => e.watched).length;

    // Lange Staffeln (Anime): nur ein Fenster um die aktuelle Folge, sonst wird die Leiste zur Wand.
    const total = seasonEpisodes.length;
    const from = total > CELL_WINDOW ? Math.max(0, Math.min(epIndex - 16, total - CELL_WINDOW)) : 0;
    const to = total > CELL_WINDOW ? from + CELL_WINDOW : total;

    const scores: ScoreItem[] = [
      ...(canTrack
        ? [
            {
              key: 'own',
              label: t('Deine Wertung'),
              value: ownRating > 0 ? ownRating.toFixed(1) : '–',
              tone: currentTheme.accent,
              own: true,
            },
          ]
        : []),
      ...(episodeRating && episodeRating > 0
        ? [{ key: 'tmdb', label: 'TMDB', value: episodeRating.toFixed(1), tone: '#01b4e4' }]
        : []),
      ...(community
        ? [
            {
              key: 'tvrank',
              label: 'TV-Rank',
              value: community.a.toFixed(1),
              sub: String(community.c),
              tone: currentTheme.primary,
            },
          ]
        : []),
      ...(watchCount > 1
        ? [
            {
              key: 'count',
              label: t('Mal gesehen'),
              value: `${watchCount}×`,
              tone: currentTheme.status.success,
            },
          ]
        : []),
    ];

    const iconSize = 20;

    return (
      <DetailStage
        art={art}
        wash={posterUrl}
        veil={blurActive}
        navEnd={
          onShare ? (
            <IconButton
              icon={<SendRounded style={{ fontSize: '18px' }} />}
              onClick={onShare}
              size={40}
              borderRadius="14px"
              variant="glass"
              ariaLabel={t('Teilen')}
              tooltip={t('Teilen')}
            />
          ) : undefined
        }
        poster={
          <button
            type="button"
            className="dk-poster-btn"
            onClick={() => navigate(`/series/${seriesId}`)}
            aria-label={t('Zur Serie')}
          >
            <img src={posterUrl} alt={seriesTitle} />
          </button>
        }
        below={
          <>
            <ScoreRow items={scores} />

            {rating && (
              <div className="dk-rate">
                <span className="dk-rate__label">{t('Folge bewerten')}</span>
                {rating}
              </div>
            )}

            {total > 1 && (
              <div className="dk-eps">
                <div className="dk-eps__cells" role="group" aria-label={t('Folgen dieser Staffel')}>
                  {seasonEpisodes.slice(from, to).map((e, offset) => {
                    const number = from + offset + 1;
                    const current = number - 1 === epIndex;
                    return (
                      <button
                        key={e.key}
                        type="button"
                        className={`dk-eps__cell${e.watched ? ' is-seen' : ''}${current ? ' is-current' : ''}`}
                        aria-current={current ? 'true' : undefined}
                        aria-label={t('Folge {n}', { n: number })}
                        onClick={() => !current && onOpenEpisode(number)}
                      >
                        {number}
                      </button>
                    );
                  })}
                </div>
                <div className="dk-progress__legend">
                  <span>
                    <strong>
                      {t('Folge {n} von {total}', { n: episodeNumber ?? '?', total })}
                    </strong>
                    {' · '}
                    {t('{seen} von {total} gesehen', { seen, total })}
                  </span>
                </div>
              </div>
            )}

            {canTrack && (
              <div className="dk-cta-row">
                <motion.button
                  type="button"
                  whileTap={tapDim}
                  onClick={onToggleWatched}
                  aria-pressed={isWatched}
                  className={`dk-cta${isWatched ? ' dk-cta--done' : ''}`}
                  style={isWatched ? undefined : { color: 'var(--on-primary)' }}
                >
                  {isWatched ? (
                    <CheckCircle aria-hidden style={{ fontSize: 26, flexShrink: 0 }} />
                  ) : (
                    <Check aria-hidden style={{ fontSize: 26, flexShrink: 0 }} />
                  )}
                  <span className="dk-cta__text">
                    <span className="dk-cta__main">
                      {isWatched ? t('Gesehen') : t('Als gesehen markieren')}
                    </span>
                  </span>
                </motion.button>
              </div>
            )}

            <ActionTiles>
              <motion.button
                type="button"
                whileTap={tapDim}
                className={actionClass()}
                onClick={() => navigate(`/series/${seriesId}`)}
              >
                <Tv style={{ fontSize: iconSize }} />
                <span className="dk-action__label">{t('Zur Serie')}</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={tapDim}
                className={actionClass()}
                onClick={() => navigate(`/episodes/${seriesId}`)}
              >
                <ViewList style={{ fontSize: iconSize }} />
                <span className="dk-action__label">{t('Alle Folgen')}</span>
              </motion.button>
              {onShare && (
                <motion.button
                  type="button"
                  whileTap={tapDim}
                  className={actionClass()}
                  onClick={onShare}
                >
                  <SendRounded style={{ fontSize: iconSize }} />
                  <span className="dk-action__label">{t('Teilen')}</span>
                </motion.button>
              )}
            </ActionTiles>
          </>
        }
      >
        <div className="dk-kicker">
          <button type="button" className="dk-chip" onClick={() => navigate(`/series/${seriesId}`)}>
            {seriesTitle}
          </button>
          <span className="dk-chip dk-chip--accent">
            S{seasonNumber} E{episodeNumber}
          </span>
          {fillerInfo && (
            <FillerChip
              filler={fillerInfo.filler}
              recap={fillerInfo.recap}
              variant="label"
              size="md"
            />
          )}
          {blurActive && (
            <button type="button" className="dk-chip" onClick={() => setSpoilerRevealed(true)}>
              <VisibilityOff style={{ fontSize: 15 }} />
              {t('Spoiler-Schutz — tippen zum Anzeigen')}
            </button>
          )}
        </div>

        <h1 className="dk-title">{displayName}</h1>

        <div className="dk-meta">
          {formattedAirDate && <span>{formattedAirDate}</span>}
          {episodeRuntime ? <span>{t('{n} Min.', { n: episodeRuntime })}</span> : null}
        </div>
      </DetailStage>
    );
  }
);
EpisodeStage.displayName = 'EpisodeStage';
