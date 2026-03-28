import { PlayCircle } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EpisodeDiscussionButton } from '../../../components/Discussion';
import { SectionHeader, SwipeableEpisodeRow } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { calculateWatchingPace, formatPaceLine } from '../../../lib/date/paceCalculation';
import { chipLabel, chipColor, type EpisodeChipType } from '../../../utils/episodeChips';
import type { Series } from '../../../types/Series';

function formatLastWatched(lastWatchedAt: string): string | null {
  if (!lastWatchedAt) return null;
  const now = Date.now();
  const then = new Date(lastWatchedAt).getTime();
  if (isNaN(then)) return null;
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return 'Gerade eben gesehen';
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Vor ${diffHours}h gesehen`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Gestern gesehen';
  if (diffDays < 7) return `Vor ${diffDays} Tagen gesehen`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return 'Vor 1 Woche gesehen';
  if (diffDays < 30) return `Vor ${diffWeeks} Wochen gesehen`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Vor 1 Monat gesehen';
  return `Vor ${diffMonths} Monaten gesehen`;
}

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
  chipType?: EpisodeChipType;
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
  const accentColor = currentTheme.primary;
  const { isMobile } = useDeviceType();

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
                          color: item.chipType ? chipColor(item.chipType) : accentColor,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        S{item.nextEpisode.seasonNumber} E{item.nextEpisode.episodeNumber} •{' '}
                        {item.nextEpisode.name}
                        {item.chipType && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 4,
                              marginLeft: 6,
                              background: `${chipColor(item.chipType)}20`,
                              color: chipColor(item.chipType),
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {chipLabel(item.chipType)}
                          </span>
                        )}
                      </p>
                      {(() => {
                        const lastWatchedText = formatLastWatched(item.lastWatchedAt);
                        const parts = [paceText, lastWatchedText].filter(Boolean);
                        return parts.length > 0 ? (
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
                            {parts.join(' · ')}
                          </p>
                        ) : null;
                      })()}
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
                            background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    </>
                  }
                  action={
                    <EpisodeDiscussionButton
                      seriesId={item.id}
                      seasonNumber={item.nextEpisode.seasonNumber}
                      episodeNumber={item.nextEpisode.episodeNumber}
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
