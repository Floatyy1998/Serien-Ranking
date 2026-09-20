import { Check, ExpandMore, PlayCircle, Replay } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { isGenericEpisodeName } from '../../lib/episode/episodeName';
import type { WatchedEpisode } from './EpisodeDataManager';
import { EpisodeDiscussionIndicator } from './RecentlyWatchedComponents';
import { CARD_PRESS, CARD_SPRING, cardSurface, chipStyle } from './cardStyles';
import { tapScaleTight } from '../../lib/motion';

const SMALL_ICON_STYLE: React.CSSProperties = { fontSize: '18px' };
const CHIP_ICON_STYLE: React.CSSProperties = { fontSize: '14px' };

export const SeriesAccordion = memo<{
  seriesId: number;
  episodes: WatchedEpisode[];
  dateKey: string;
  isExpanded: boolean;
  completingEpisodes: Set<string>;
  onToggle: (date: string, seriesId: number) => void;
  onRewatch: (episode: WatchedEpisode) => void;
  onNavigateToSeries: (seriesId: number) => void;
  onNavigateToEpisode: (seriesId: number, seasonNumber: number, episodeNumber: number) => void;
  onNavigateToDiscussion: (seriesId: number, seasonNumber: number, episodeNumber: number) => void;
}>(
  ({
    seriesId,
    episodes,
    dateKey,
    isExpanded,
    completingEpisodes,
    onToggle,
    onRewatch,
    onNavigateToSeries,
    onNavigateToEpisode,
    onNavigateToDiscussion,
  }) => {
    const { currentTheme } = useTheme();
    const firstEpisode = episodes[0];
    const hasRewatch = episodes.some((ep) => ep.watchCount > 1);
    const toggle = () => onToggle(dateKey, seriesId);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={CARD_SPRING}
        className="rw-card rw-card--group"
        style={{
          ...cardSurface(currentTheme),
          ['--rw-accent' as string]: `linear-gradient(to bottom, ${currentTheme.status.success}, ${currentTheme.primary})`,
        }}
      >
        <motion.div
          whileTap={CARD_PRESS}
          transition={CARD_SPRING}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={t('{title}, {n} Episoden', {
            title: firstEpisode.seriesName,
            n: episodes.length,
          })}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
          className="rw-group-head"
        >
          <img
            src={firstEpisode.seriesPoster}
            alt=""
            loading="lazy"
            decoding="async"
            role="button"
            tabIndex={0}
            aria-label={t('{title} öffnen', { title: firstEpisode.seriesName })}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToSeries(firstEpisode.seriesId);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onNavigateToSeries(firstEpisode.seriesId);
              }
            }}
            className="rw-card__poster"
          />

          <div className="rw-card__body">
            <h3 className="rw-card__title" style={{ color: currentTheme.text.primary }}>
              {firstEpisode.seriesName}
            </h3>

            <p className="rw-card__sub" style={{ color: currentTheme.text.secondary }}>
              {isExpanded ? t('Folgen ausblenden') : t('Folgen anzeigen')}
            </p>

            <div className="rw-card__chips">
              <span className="rw-chip" style={chipStyle(currentTheme.status.success)}>
                <PlayCircle style={CHIP_ICON_STYLE} />
                {t('{n} Episoden', { n: episodes.length })}
              </span>
              {hasRewatch && (
                <span className="rw-chip" style={chipStyle(currentTheme.primary)}>
                  <Replay style={CHIP_ICON_STYLE} />
                  Rewatch
                </span>
              )}
            </div>
          </div>

          <div
            className={`rw-chevron${isExpanded ? ' rw-chevron--open' : ''}`}
            style={{ color: currentTheme.text.muted }}
          >
            <ExpandMore />
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="rw-group-episodes"
              style={{ borderTop: `1px solid var(--theme-primary-12)` }}
            >
              {episodes.map((episode, idx) => {
                const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                const isCompleting = completingEpisodes.has(episodeKey);
                const openEpisode = () =>
                  onNavigateToEpisode(
                    episode.seriesId,
                    episode.seasonNumber,
                    episode.episodeNumber
                  );

                return (
                  <motion.div
                    key={episodeKey}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: isCompleting ? 0.65 : 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileTap={CARD_PRESS}
                    role="button"
                    tabIndex={0}
                    aria-label={t('Zur Episode S{s} E{e} springen', {
                      s: episode.seasonNumber,
                      e: episode.episodeNumber,
                    })}
                    onClick={openEpisode}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openEpisode();
                      }
                    }}
                    className="rw-group-episode"
                  >
                    <span className="rw-chip" style={chipStyle(currentTheme.status.success)}>
                      S{episode.seasonNumber} E{episode.episodeNumber}
                    </span>

                    <div className="rw-group-episode__text">
                      {!isGenericEpisodeName(episode.episodeName) && (
                        <p
                          className="rw-group-episode__name"
                          style={{ color: currentTheme.text.primary }}
                        >
                          {episode.episodeName}
                        </p>
                      )}
                    </div>

                    {episode.watchCount > 1 && (
                      <span className="rw-chip" style={chipStyle(currentTheme.primary)}>
                        <Replay style={CHIP_ICON_STYLE} />
                        {episode.watchCount}x
                      </span>
                    )}

                    <EpisodeDiscussionIndicator
                      seriesId={episode.seriesId}
                      seasonNumber={episode.seasonNumber}
                      episodeNumber={episode.episodeNumber}
                      onClick={() =>
                        onNavigateToDiscussion(
                          episode.seriesId,
                          episode.seasonNumber,
                          episode.episodeNumber
                        )
                      }
                    />

                    <motion.button
                      type="button"
                      whileTap={tapScaleTight}
                      aria-label={isCompleting ? t('Als gesehen markiert') : t('Erneut ansehen')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRewatch(episode);
                      }}
                      className="rw-action-btn rw-action-btn--sm rw-rewatch-btn-small"
                      style={{
                        background: `color-mix(in srgb, ${currentTheme.status.success} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${currentTheme.status.success} 30%, transparent)`,
                        color: currentTheme.status.success,
                      }}
                    >
                      {isCompleting ? (
                        <Check style={SMALL_ICON_STYLE} />
                      ) : (
                        <PlayCircle style={SMALL_ICON_STYLE} />
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);
SeriesAccordion.displayName = 'SeriesAccordion';
