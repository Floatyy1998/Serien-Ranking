import { NewReleases } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EpisodeDiscussionButton } from '../../../components/Discussion';
import { SectionHeader, SwipeableEpisodeRow } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { chipLabel, chipColor } from '../../../utils/episodeChips';
import type { Series } from '../../../types/Series';

interface TodayEpisode {
  seriesId: string;
  seriesNmr: string;
  seriesTitle: string;
  poster: string;
  seasonNumber: number;
  episodeNumber: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeId: string;
  episodeName: string;
  watched: boolean;
  runtime: number;
  provider?: Series['provider'];
  providerLogo?: string;
  providerName?: string;
  chipType?: 'season-start' | 'mid-season-return' | 'season-finale' | 'season-break';
}

interface TodayEpisodesSectionProps {
  episodes: TodayEpisode[];
  hiddenEpisodes: Set<string>;
  completingEpisodes: Set<string>;
  swipingEpisodes: Set<string>;
  dragOffsets: Record<string, number>;
  swipeDirections: Record<string, 'left' | 'right'>;
  onSwipeStart: (key: string) => void;
  onSwipeDrag: (key: string, offset: number) => void;
  onSwipeEnd: (key: string) => void;
  onComplete: (episode: TodayEpisode, direction: 'left' | 'right') => void;
  onPosterClick: (seriesId: number, title: string, episodePath: string) => void;
}

export const TodayEpisodesSection = React.memo(function TodayEpisodesSection({
  episodes,
  hiddenEpisodes,
  completingEpisodes,
  swipingEpisodes,
  dragOffsets,
  swipeDirections,
  onSwipeStart,
  onSwipeDrag,
  onSwipeEnd,
  onComplete,
  onPosterClick,
}: TodayEpisodesSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const accentColor = currentTheme.status?.warning || '#f59e0b';
  const { isMobile } = useDeviceType();

  if (episodes.length === 0) return null;

  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionHeader
        icon={<NewReleases />}
        iconColor={currentTheme.accent}
        title="Heute Neu"
        onSeeAll={() => navigate('/calendar')}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '0 20px',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="popLayout">
          {episodes
            .filter(
              (ep) => !hiddenEpisodes.has(`${ep.seriesId}-${ep.seasonNumber}-${ep.episodeNumber}`)
            )
            .slice(0, 5)
            .map((episode) => {
              const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;

              return (
                <SwipeableEpisodeRow
                  key={episodeKey}
                  itemKey={episodeKey}
                  poster={episode.poster}
                  posterAlt={episode.seriesTitle}
                  accentColor={accentColor}
                  posterOverlay={(() => {
                    const logo = episode.providerLogo || episode.provider?.provider?.[0]?.logo;
                    const name =
                      episode.providerName || episode.provider?.provider?.[0]?.name || '';
                    return logo ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${logo}`}
                        alt={name}
                        style={{
                          position: 'absolute',
                          bottom: -3,
                          right: -3,
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          objectFit: 'cover',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                          border: '1.5px solid rgba(15,20,35,1)',
                        }}
                      />
                    ) : undefined;
                  })()}
                  isCompleting={completingEpisodes.has(episodeKey)}
                  isSwiping={swipingEpisodes.has(episodeKey)}
                  dragOffset={dragOffsets[episodeKey] || 0}
                  swipeDirection={swipeDirections[episodeKey]}
                  // Watched episodes have a static background
                  staticBackground={episode.watched ? `${accentColor}1A` : undefined}
                  staticBorder={episode.watched ? `${accentColor}4D` : undefined}
                  canSwipe={!episode.watched}
                  onSwipeStart={() => onSwipeStart(episodeKey)}
                  onSwipeDrag={(offset) => onSwipeDrag(episodeKey, offset)}
                  onSwipeEnd={() => onSwipeEnd(episodeKey)}
                  onComplete={(dir) => onComplete(episode, dir)}
                  onPosterClick={() =>
                    onPosterClick(
                      Number(episode.seriesId),
                      episode.seriesTitle,
                      `/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}`
                    )
                  }
                  content={
                    <>
                      <h3
                        style={{
                          fontSize: isMobile ? '13px' : '16px',
                          fontWeight: 700,
                          margin: '0 0 2px 0',
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {episode.seriesTitle}
                      </h3>
                      <p
                        style={{
                          fontSize: isMobile ? '11px' : '14px',
                          margin: 0,
                          color: episode.chipType
                            ? chipColor(episode.chipType)
                            : episode.watched
                              ? accentColor
                              : currentTheme.accent,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        S{episode.seasonNumber} E{episode.episodeNumber} • {episode.episodeName}
                        {episode.chipType && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 4,
                              marginLeft: 6,
                              background: `${chipColor(episode.chipType)}20`,
                              color: chipColor(episode.chipType),
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {chipLabel(episode.chipType)}
                          </span>
                        )}
                      </p>
                    </>
                  }
                  animateAction={!episode.watched}
                  action={
                    <EpisodeDiscussionButton
                      seriesId={Number(episode.seriesId)}
                      seasonNumber={episode.seasonNumber}
                      episodeNumber={episode.episodeNumber}
                    />
                  }
                />
              );
            })}
        </AnimatePresence>
      </div>
    </section>
  );
});
