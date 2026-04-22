import { Repeat } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EpisodeDiscussionButton } from '../../../components/Discussion';
import { SectionHeader, SwipeableEpisodeRow } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useDeviceType } from '../../../hooks/useDeviceType';
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
  const accentColor = currentTheme.accent;
  const { isMobile } = useDeviceType();

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
                  posterOverlay={
                    item.provider?.provider?.[0]?.logo ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.provider.provider[0].logo}`}
                        alt={item.provider.provider[0].name}
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
                    ) : undefined
                  }
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
                          fontSize: isMobile ? '13px' : '16px',
                          fontWeight: 700,
                          margin: '0 0 2px 0',
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: isMobile ? '11px' : '14px',
                          margin: 0,
                          color: accentColor,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        S{item.seasonNumber} E{item.episodeNumber} • {item.episodeName}
                      </p>
                      <p
                        style={{
                          fontSize: isMobile ? '10px' : '13px',
                          margin: '2px 0 0 0',
                          color: currentTheme.text.muted,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.currentWatchCount}x → {item.currentWatchCount + 1}x
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
                  action={
                    <EpisodeDiscussionButton
                      seriesId={item.id}
                      seasonNumber={item.seasonNumber}
                      episodeNumber={item.episodeNumber}
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
