import { Repeat } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader, SwipeableEpisodeRow } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Series } from '../../../types/Series';

interface RewatchEpisode {
  id: number;
  nmr: number;
  title: string;
  poster: string;
  seasonIndex: number;
  episodeIndex: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  currentWatchCount: number;
  targetWatchCount: number;
  progress: number;
  progressCurrent: number;
  progressTotal: number;
  genre: Series['genre'];
  provider: Series['provider'];
  episodeRuntime: number;
  lastWatchedAt: string;
}

interface RewatchSectionProps {
  episodes: RewatchEpisode[];
  hiddenRewatches: Set<string>;
  completingRewatches: Set<string>;
  swipingRewatches: Set<string>;
  dragOffsets: Record<string, number>;
  swipeDirections: Record<string, 'left' | 'right'>;
  onSwipeStart: (key: string) => void;
  onSwipeDrag: (key: string, offset: number) => void;
  onSwipeEnd: (key: string) => void;
  onComplete: (item: RewatchEpisode, direction: 'left' | 'right') => void;
  onPosterClick: (seriesId: number, title: string, episodePath: string) => void;
}

export const RewatchSection = React.memo(function RewatchSection({
  episodes,
  hiddenRewatches,
  completingRewatches,
  swipingRewatches,
  dragOffsets,
  swipeDirections,
  onSwipeStart,
  onSwipeDrag,
  onSwipeEnd,
  onComplete,
  onPosterClick,
}: RewatchSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const accentColor = currentTheme.accent || currentTheme.status?.warning || '#f59e0b';

  if (episodes.length === 0) return null;

  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionHeader
        icon={<Repeat />}
        iconColor={accentColor}
        title="Rewatches"
        onSeeAll={() => navigate('/watchlist?rewatches=open')}
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
              (item) =>
                !hiddenRewatches.has(
                  `rewatch-${item.id}-${item.seasonNumber}-${item.episodeNumber}`
                )
            )
            .slice(0, 4)
            .map((item) => {
              const key = `rewatch-${item.id}-${item.seasonNumber}-${item.episodeNumber}`;

              return (
                <SwipeableEpisodeRow
                  key={key}
                  itemKey={key}
                  poster={item.poster}
                  posterAlt={item.title}
                  accentColor={accentColor}
                  isCompleting={completingRewatches.has(key)}
                  isSwiping={swipingRewatches.has(key)}
                  dragOffset={dragOffsets[key] || 0}
                  swipeDirection={swipeDirections[key]}
                  onSwipeStart={() => onSwipeStart(key)}
                  onSwipeDrag={(offset) => onSwipeDrag(key, offset)}
                  onSwipeEnd={() => onSwipeEnd(key)}
                  onComplete={(dir) => onComplete(item, dir)}
                  onPosterClick={() =>
                    onPosterClick(
                      item.id,
                      item.title,
                      `/episode/${item.id}/s/${item.seasonNumber}/e/${item.episodeNumber}`
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
                          fontSize: '13px',
                          margin: 0,
                          color: accentColor,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        S{item.seasonNumber} E{item.episodeNumber} • {item.episodeName}
                      </p>
                      <p
                        style={{
                          fontSize: '12px',
                          margin: '2px 0 0 0',
                          color: currentTheme.text.muted,
                        }}
                      >
                        {item.currentWatchCount}x → {item.targetWatchCount}x
                      </p>
                      <div
                        style={{
                          marginTop: '4px',
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
                            background: `linear-gradient(90deg, ${accentColor}, ${accentColor})`,
                            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    </>
                  }
                  action={<Repeat style={{ fontSize: '20px', color: accentColor }} />}
                />
              );
            })}
        </AnimatePresence>
      </div>
    </section>
  );
});
