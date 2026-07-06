import ChevronLeft from '@mui/icons-material/ChevronLeft';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { EpisodeDiscussionButton } from '../../../components/Discussion';
import { ProviderLogoLink } from '../../../components/detail/ProviderLogoLink';
import { SwipeableEpisodeRow } from '../../../components/ui';
import { FillerChip } from '../../../components/ui/FillerChip';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDeviceType } from '../../../hooks/useDeviceType';
import type { useEpisodeDragDrop } from '../../../hooks/useEpisodeDragDrop';
import type { NextEpisode } from '../../../hooks/useWatchNextEpisodes';
import type { FillerEpisode } from '../../../services/animeFillerService';
import { fillerLookupKey } from '../../../services/animeFillerService';
import { chipColor, chipLabel } from '../../../utils/episodeChips';
import type { useWatchNextSwipe } from '../useWatchNextSwipe';

interface WatchNextEpisodeListProps {
  episodes: NextEpisode[];
  /** Cache-only Filler/Recap-Lookup pro Serie (Key: seriesId). */
  fillerByEpisode: Map<number, Map<string, FillerEpisode>>;
  showSwipeHint: boolean;
  editModeActive: boolean;
  /** Kompletter Rückgabewert von useWatchNextSwipe — wird 1:1 durchgereicht. */
  swipe: ReturnType<typeof useWatchNextSwipe>;
  /** Kompletter Rückgabewert von useEpisodeDragDrop — wird 1:1 durchgereicht. */
  dragDrop: ReturnType<typeof useEpisodeDragDrop>;
}

/** Liste der nächsten Episoden inkl. Swipe-Hint, Rewatch-Separator und Swipe-Rows. */
export const WatchNextEpisodeList = ({
  episodes,
  fillerByEpisode,
  showSwipeHint,
  editModeActive,
  swipe,
  dragDrop,
}: WatchNextEpisodeListProps) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const navigate = useNavigate();

  const {
    swipingEpisodes,
    completingEpisodes,
    hiddenEpisodes,
    dragOffsets,
    swipeDirections,
    getEpisodeKey,
    handleSwipeDragStart,
    handleSwipeDrag,
    handleSwipeCleanup,
    handleEpisodeComplete,
  } = swipe;

  const {
    draggedIndex,
    currentTouchIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = dragDrop;

  return (
    <div className="watch-next-episodes">
      <AnimatePresence mode="popLayout">
        {episodes
          .filter((episode) => !hiddenEpisodes.has(getEpisodeKey(episode)))
          .map((episode, index, arr) => {
            const episodeKey = getEpisodeKey(episode);
            // Show separator between rewatches and normal episodes
            const prevEpisode = index > 0 ? arr[index - 1] : null;
            const showSeparator = prevEpisode?.isRewatch && !episode.isRewatch;
            // seasonNumber is 0-based here; lookup expects 1-based.
            const fillerInfo = fillerByEpisode
              .get(episode.seriesId)
              ?.get(fillerLookupKey((episode.seasonNumber ?? 0) + 1, episode.episodeNumber));
            return (
              <div key={episodeKey} style={{ position: 'relative' }}>
                {showSwipeHint && index === 0 && (
                  <div className="swipe-hint-overlay">
                    <span className="swipe-hint-label">
                      <ChevronLeft style={{ fontSize: '16px' }} />
                      Swipen
                    </span>
                  </div>
                )}
                {showSeparator && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 4px 4px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: '1px',
                        background: `linear-gradient(90deg, ${currentTheme.status.success}40, transparent)`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: currentTheme.status.success,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Weiterschauen
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, ${currentTheme.status.success}40)`,
                      }}
                    />
                  </div>
                )}
                <SwipeableEpisodeRow
                  itemKey={episodeKey}
                  poster={episode.poster}
                  posterAlt={episode.seriesTitle}
                  accentColor={episode.isRewatch ? currentTheme.accent : currentTheme.primary}
                  isCompleting={completingEpisodes.has(episodeKey)}
                  isSwiping={swipingEpisodes.has(episodeKey)}
                  dragOffset={dragOffsets[episodeKey] || 0}
                  swipeDirection={swipeDirections[episodeKey]}
                  onSwipeStart={() => handleSwipeDragStart(episodeKey)}
                  onSwipeDrag={(offset) =>
                    handleSwipeDrag(episodeKey, { offset: { x: offset, y: 0 } } as never)
                  }
                  onSwipeEnd={() => handleSwipeCleanup(episodeKey)}
                  onComplete={(dir) => handleEpisodeComplete(episode, dir)}
                  onPosterClick={() =>
                    navigate(
                      `/episode/${episode.seriesId}/s/${episode.seasonNumber + 1}/e/${episode.episodeNumber}`
                    )
                  }
                  posterOverlay={
                    episode.providerLogo ? (
                      <ProviderLogoLink
                        src={`https://image.tmdb.org/t/p/w92${episode.providerLogo}`}
                        name={episode.providerName || ''}
                        searchTitle={episode.seriesTitle}
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
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
                  index={index}
                  isEditMode={editModeActive}
                  draggedIndex={draggedIndex}
                  currentTouchIndex={currentTouchIndex}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  content={
                    <>
                      <h2
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
                      </h2>
                      <p
                        style={{
                          fontSize: isMobile ? '11px' : '14px',
                          fontWeight: 500,
                          margin: 0,
                          color: episode.chipType
                            ? chipColor(episode.chipType)
                            : episode.isRewatch
                              ? currentTheme.accent
                              : currentTheme.status.success,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        S{(episode.seasonNumber ?? 0) + 1} E{episode.episodeNumber}
                        {episode.isRewatch
                          ? ` • ${episode.currentWatchCount}x → ${episode.targetWatchCount}x`
                          : episode.episodeName
                            ? ` • ${episode.episodeName}`
                            : ''}
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
                        {fillerInfo && (
                          <span style={{ marginLeft: 6, verticalAlign: 'middle' }}>
                            <FillerChip
                              filler={fillerInfo.filler}
                              recap={fillerInfo.recap}
                              variant="label"
                            />
                          </span>
                        )}
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
                        {episode.remainingEpisodes > 0
                          ? `${episode.currentSeasonOf} · ${episode.remainingEpisodes} übrig${episode.estimatedMinutesLeft >= 60 ? ` · ~${Math.round(episode.estimatedMinutesLeft / 60)}h` : episode.estimatedMinutesLeft > 0 ? ` · ~${episode.estimatedMinutesLeft}min` : ''}`
                          : episode.isRewatch
                            ? episode.currentSeasonOf
                            : 'Wartet auf neue Folgen'}
                      </p>
                      <div
                        style={{
                          marginTop: '6px',
                          height: '3px',
                          background: 'rgba(255,255,255,0.08)',
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
                            width: `${episode.progress}%`,
                            background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    </>
                  }
                  action={
                    <EpisodeDiscussionButton
                      seriesId={episode.seriesId}
                      seasonNumber={episode.seasonNumber + 1}
                      episodeNumber={episode.episodeNumber}
                    />
                  }
                />
              </div>
            );
          })}
      </AnimatePresence>
    </div>
  );
};
