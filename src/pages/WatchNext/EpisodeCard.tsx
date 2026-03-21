import { Check, DragHandle, PlayCircle } from '@mui/icons-material';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EpisodeDiscussionButton } from '../../components/Discussion';
import { NextEpisode } from '../../hooks/useWatchNextEpisodes';

interface EpisodeCardProps {
  episode: NextEpisode;
  index: number;
  theme: {
    primary: string;
    text: { primary: string; secondary: string; muted: string };
    status: { success: string; warning: string };
  };
  isEditMode: boolean;
  isSwiping: boolean;
  isCompleting: boolean;
  dragOffset: number;
  swipeDirection?: 'left' | 'right';
  draggedIndex: number | null;
  currentTouchIndex: number | null;
  onSwipeDragStart: (episodeKey: string) => void;
  onSwipeDrag: (episodeKey: string, info: PanInfo) => void;
  onSwipeDragEnd: (
    episode: NextEpisode,
    episodeKey: string,
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => Promise<void>;
  onTouchStart: (e: React.TouchEvent, index: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => Promise<void>;
  episodeKey: string;
}

export const EpisodeCard = React.memo(
  ({
    episode,
    index,
    theme,
    isEditMode,
    isSwiping,
    isCompleting,
    dragOffset,
    swipeDirection,
    draggedIndex,
    currentTouchIndex,
    onSwipeDragStart,
    onSwipeDrag,
    onSwipeDragEnd,
    onDragStart,
    onDragOver,
    onDrop,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    episodeKey,
  }: EpisodeCardProps) => {
    const navigate = useNavigate();

    const isDragTarget =
      currentTouchIndex === index && draggedIndex !== null && draggedIndex !== index;
    const isDragged = draggedIndex === index;

    return (
      <motion.div
        data-block-swipe
        data-index={index}
        className="episode-card"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isCompleting ? 0.5 : 1,
          y: 0,
          scale: isCompleting ? 0.95 : 1,
        }}
        exit={{
          opacity: 0,
          x: swipeDirection === 'left' ? -300 : 300,
          transition: { duration: 0.3 },
        }}
        style={{ position: 'relative' }}
      >
        {/* Swipe overlay - only when edit mode is NOT active */}
        {!isEditMode && (
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            dragSnapToOrigin={true}
            onDragStart={() => onSwipeDragStart(episodeKey)}
            onDrag={(_event, info: PanInfo) => onSwipeDrag(episodeKey, info)}
            onDragEnd={(event, info: PanInfo) => onSwipeDragEnd(episode, episodeKey, event, info)}
            whileDrag={{ scale: 1.02 }}
            style={{
              position: 'absolute',
              top: 0,
              left: '60px',
              right: '100px',
              bottom: 0,
              zIndex: 1,
            }}
          />
        )}

        {/* Card content */}
        <div
          draggable={isEditMode}
          onDragStart={
            isEditMode ? (e: React.DragEvent<HTMLDivElement>) => onDragStart(e, index) : undefined
          }
          onDragOver={isEditMode ? (e) => onDragOver(e, index) : undefined}
          onDrop={isEditMode ? (e: React.DragEvent<HTMLDivElement>) => onDrop(e, index) : undefined}
          onTouchStart={isEditMode ? (e) => onTouchStart(e, index) : undefined}
          onTouchMove={isEditMode ? onTouchMove : undefined}
          onTouchEnd={isEditMode ? onTouchEnd : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: '75px',
            gap: '12px',
            background: isCompleting
              ? 'linear-gradient(90deg, rgba(76, 209, 55, 0.2), rgba(0, 212, 170, 0.05))'
              : episode.isRewatch
                ? `${theme.status.warning}0D`
                : dragOffset
                  ? `rgba(76, 209, 55, ${Math.min((Math.abs(dragOffset) / 100) * 0.15, 0.15)})`
                  : 'var(--theme-surface, rgba(255,255,255,0.05))',
            border: `1px solid ${
              isCompleting
                ? 'rgba(76, 209, 55, 0.5)'
                : isDragTarget
                  ? theme.primary
                  : episode.isRewatch
                    ? `${theme.status.warning}4D`
                    : `rgba(76, 209, 55, ${0.2 + Math.min((Math.abs(dragOffset) / 100) * 0.3, 0.3)})`
            }`,
            borderRadius: '14px',
            padding: isDragTarget ? '11px' : '12px',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            cursor: isEditMode ? 'move' : 'pointer',
            opacity: isDragged ? 0.6 : 1,
            transform: isDragged ? 'scale(1.05)' : isDragTarget ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isDragged
              ? `0 8px 24px ${theme.primary}40`
              : isDragTarget
                ? `0 4px 12px ${theme.primary}30`
                : '0 2px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Swipe indicator background */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(76, 209, 55, 0.3))',
              opacity: 0,
            }}
            animate={{ opacity: isSwiping ? 1 : 0 }}
          />

          {/* Checkmark indicator */}
          {isCompleting && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
              }}
            >
              <Check style={{ fontSize: '28px', color: theme.status.success }} />
            </motion.div>
          )}

          {/* Poster */}
          <img
            src={episode.poster}
            alt={episode.seriesTitle}
            loading={index >= 4 ? 'lazy' : 'eager'}
            decoding="async"
            onClick={() =>
              navigate(
                `/episode/${episode.seriesId}/s/${episode.seasonNumber + 1}/e/${episode.episodeNumber}`
              )
            }
            style={{
              width: '50px',
              height: '75px',
              objectFit: 'cover',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 2,
              flexShrink: 0,
            }}
          />

          {/* Episode info */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              pointerEvents: isEditMode ? 'auto' : 'none',
              position: 'relative',
              zIndex: 2,
            }}
            onClick={() => {
              if (!isEditMode) {
                navigate(
                  `/episode/${episode.seriesId}/s/${episode.seasonNumber + 1}/e/${episode.episodeNumber}`
                );
              }
            }}
          >
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 600,
                margin: '0 0 2px 0',
              }}
            >
              {episode.seriesTitle}
            </h2>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 500,
                margin: 0,
                color: episode.isRewatch ? theme.status.warning : theme.status.success,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              S{(episode.seasonNumber ?? 0) + 1} E{episode.episodeNumber}
              {episode.isRewatch
                ? ` \u2022 ${episode.currentWatchCount}x \u2192 ${episode.targetWatchCount}x`
                : episode.episodeName
                  ? ` \u2022 ${episode.episodeName}`
                  : ''}
            </p>
            <p
              style={{
                fontSize: '12px',
                margin: '2px 0 0 0',
                color: theme.text.muted,
              }}
            >
              {episode.remainingEpisodes > 0
                ? `${episode.currentSeasonOf} \u00b7 ${episode.remainingEpisodes} \u00fcbrig${
                    episode.estimatedMinutesLeft >= 60
                      ? ` \u00b7 ~${Math.round(episode.estimatedMinutesLeft / 60)}h`
                      : episode.estimatedMinutesLeft > 0
                        ? ` \u00b7 ~${episode.estimatedMinutesLeft}min`
                        : ''
                  }`
                : episode.isRewatch
                  ? episode.currentSeasonOf
                  : 'Wartet auf neue Folgen'}
            </p>
            {/* Progress bar */}
            <div
              style={{
                marginTop: '6px',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.15)',
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
                  background: `linear-gradient(90deg, ${theme.primary}, ${theme.status.success})`,
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
          </div>

          {/* Drag handle in edit mode */}
          {isEditMode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 8px',
                color: theme.text.muted,
                cursor: 'grab',
              }}
            >
              <DragHandle style={{ fontSize: '24px' }} />
            </div>
          )}

          {/* Action buttons - show when edit mode is NOT active */}
          {!isEditMode && (
            <AnimatePresence mode="wait">
              {isCompleting ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  style={{
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <Check style={{ fontSize: '24px', color: theme.status.success }} />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ x: isSwiping ? 10 : 0 }}
                  style={{
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <EpisodeDiscussionButton
                    seriesId={episode.seriesId}
                    seasonNumber={episode.seasonNumber + 1}
                    episodeNumber={episode.episodeNumber}
                  />
                  <PlayCircle
                    style={{
                      fontSize: '24px',
                      color: episode.isRewatch ? theme.status.warning : theme.status.success,
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    );
  }
);

EpisodeCard.displayName = 'EpisodeCard';
