import { PlayCircle } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EpisodeDiscussionButton } from '../../../components/Discussion';
import { SectionHeader, SwipeableEpisodeRow } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { calculateWatchingPace, formatPaceLine } from '../../../lib/paceCalculation';
import type { Series } from '../../../types/Series';

interface ContinueWatchingItem {
  type: 'series';
  id: number;
  nmr: number;
  title: string;
  poster: string;
  progress: number;
  seasons: Series['seasons'];
  episodeRuntime: number;
  nextEpisode: {
    seasonNumber: number;
    episodeNumber: number;
    name: string;
    seasonIndex: number;
    episodeIndex: number;
  };
  airDate: string;
  lastWatchedAt: string;
  genre: Series['genre'];
  provider: Series['provider'];
}

interface ContinueWatchingSectionProps {
  items: ContinueWatchingItem[];
  hiddenEpisodes: Set<string>;
  completingEpisodes: Set<string>;
  swipingEpisodes: Set<string>;
  dragOffsets: Record<string, number>;
  swipeDirections: Record<string, 'left' | 'right'>;
  onSwipeStart: (key: string) => void;
  onSwipeDrag: (key: string, offset: number) => void;
  onSwipeEnd: (key: string) => void;
  onComplete: (item: ContinueWatchingItem, direction: 'left' | 'right') => void;
  onPosterClick: (seriesId: number, title: string, episodePath: string) => void;
}

export const ContinueWatchingSection = React.memo(function ContinueWatchingSection({
  items,
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
}: ContinueWatchingSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const accentColor = currentTheme.status.success;

  if (items.length === 0) return null;

  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionHeader
        icon={<PlayCircle />}
        iconColor={accentColor}
        title="Weiterschauen"
        onSeeAll={() => navigate('/watchlist')}
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
          {items
            .filter(
              (item) =>
                !hiddenEpisodes.has(
                  `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`
                )
            )
            .slice(0, 6)
            .map((item) => {
              const episodeKey = `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`;
              const pace = calculateWatchingPace(item.seasons, item.episodeRuntime);
              const paceText = formatPaceLine(pace, true);

              return (
                <SwipeableEpisodeRow
                  key={episodeKey}
                  itemKey={episodeKey}
                  poster={item.poster}
                  posterAlt={item.title}
                  accentColor={accentColor}
                  isCompleting={completingEpisodes.has(episodeKey)}
                  isSwiping={swipingEpisodes.has(episodeKey)}
                  dragOffset={dragOffsets[episodeKey] || 0}
                  swipeDirection={swipeDirections[episodeKey]}
                  onSwipeStart={() => onSwipeStart(episodeKey)}
                  onSwipeDrag={(offset) => onSwipeDrag(episodeKey, offset)}
                  onSwipeEnd={() => onSwipeEnd(episodeKey)}
                  onComplete={(dir) => onComplete(item, dir)}
                  onPosterClick={() =>
                    onPosterClick(
                      item.id,
                      item.title,
                      `/episode/${item.id}/s/${item.nextEpisode.seasonNumber}/e/${item.nextEpisode.episodeNumber}`
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
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '14px',
                          margin: 0,
                          color: accentColor,
                          fontWeight: 500,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        S{item.nextEpisode.seasonNumber} E{item.nextEpisode.episodeNumber} •{' '}
                        {item.nextEpisode.name}
                      </p>
                      {paceText && (
                        <p
                          style={{
                            fontSize: '12px',
                            margin: '2px 0 0 0',
                            color: currentTheme.text.muted,
                          }}
                        >
                          {paceText}
                        </p>
                      )}
                      <div
                        style={{
                          marginTop: '6px',
                          height: '4px',
                          background: currentTheme.border.default,
                          borderRadius: '2px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${item.progress}%`,
                            background: `linear-gradient(90deg, ${currentTheme.primary}, ${accentColor})`,
                            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    </>
                  }
                  action={
                    <>
                      <EpisodeDiscussionButton
                        seriesId={item.id}
                        seasonNumber={item.nextEpisode.seasonNumber}
                        episodeNumber={item.nextEpisode.episodeNumber}
                      />
                      <PlayCircle style={{ fontSize: '20px', color: accentColor }} />
                    </>
                  }
                />
              );
            })}
        </AnimatePresence>
      </div>
    </section>
  );
});
