import { CheckCircle, NewReleases, PlayCircle } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EpisodeDiscussionButton } from '../../../components/Discussion';
import { SectionHeader, SwipeableEpisodeRow } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const accentColor = currentTheme.status.success;

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
                          fontSize: '15px',
                          fontWeight: 600,
                          margin: '0 0 2px 0',
                        }}
                      >
                        {episode.seriesTitle}
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          margin: 0,
                          color: episode.watched ? accentColor : currentTheme.accent,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        S{episode.seasonNumber} E{episode.episodeNumber} • {episode.episodeName}
                      </p>
                    </>
                  }
                  animateAction={!episode.watched}
                  action={
                    episode.watched ? (
                      <>
                        <EpisodeDiscussionButton
                          seriesId={Number(episode.seriesId)}
                          seasonNumber={episode.seasonNumber}
                          episodeNumber={episode.episodeNumber}
                        />
                        <CheckCircle style={{ fontSize: '20px', color: accentColor }} />
                      </>
                    ) : (
                      <>
                        <EpisodeDiscussionButton
                          seriesId={Number(episode.seriesId)}
                          seasonNumber={episode.seasonNumber}
                          episodeNumber={episode.episodeNumber}
                        />
                        <PlayCircle style={{ fontSize: '20px', color: currentTheme.accent }} />
                      </>
                    )
                  }
                />
              );
            })}
        </AnimatePresence>
      </div>
    </section>
  );
});
