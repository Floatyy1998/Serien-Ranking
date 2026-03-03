/**
 * SwipeableEpisodeRow - Shared horizontal swipe-to-complete row.
 *
 * Used by ContinueWatchingSection, RewatchSection, TodayEpisodesSection.
 * Handles the outer animation wrapper, swipe overlay, card container,
 * swipe indicator, poster, and the completing/action AnimatePresence.
 *
 * Layout: [poster][content (flex:1)][action]
 */

import { Check } from '@mui/icons-material';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { memo } from 'react';

interface SwipeableEpisodeRowProps {
  /** Unique key for this row (used in state maps) */
  itemKey: string;

  /** Poster image URL */
  poster: string;
  posterAlt: string;

  /** Accent color (hex/rgb) for background tinting, border, and swipe indicator */
  accentColor: string;

  /** State */
  isCompleting: boolean;
  isSwiping: boolean;
  dragOffset: number;
  swipeDirection?: 'left' | 'right';

  /**
   * Optional static background override when not dragging.
   * Use for e.g. "already watched" state.
   */
  staticBackground?: string;
  staticBorder?: string;

  /** Whether a swipe should trigger onComplete (default: true) */
  canSwipe?: boolean;

  /** Swipe handlers */
  onSwipeStart: () => void;
  onSwipeDrag: (offset: number) => void;
  onSwipeEnd: () => void;
  onComplete: (direction: 'left' | 'right') => void;

  /** Poster click handler */
  onPosterClick?: () => void;

  /** Middle content (title, meta, progress bar etc.) */
  content: React.ReactNode;

  /** Right action content (icons etc.) */
  action: React.ReactNode;

  /**
   * When true, the action is wrapped in a motion.div that shifts right
   * while swiping. Set to false for states without swipe feedback (e.g. watched).
   * Default: true.
   */
  animateAction?: boolean;
}

export const SwipeableEpisodeRow = memo<SwipeableEpisodeRowProps>(
  ({
    itemKey,
    poster,
    posterAlt,
    accentColor,
    isCompleting,
    isSwiping,
    dragOffset,
    swipeDirection,
    staticBackground,
    staticBorder,
    canSwipe = true,
    onSwipeStart,
    onSwipeDrag,
    onSwipeEnd,
    onComplete,
    onPosterClick,
    content,
    action,
    animateAction = true,
  }) => {
    // Dynamic background and border based on drag offset
    const dragRatio = Math.min(Math.abs(dragOffset) / 100, 1);
    const bgOpacityHex = Math.round(dragRatio * 25)
      .toString(16)
      .padStart(2, '0');
    const borderOpacityHex = Math.round(51 + dragRatio * 77)
      .toString(16)
      .padStart(2, '0');

    const background = isCompleting
      ? `linear-gradient(90deg, ${accentColor}33, ${accentColor}0D)`
      : (staticBackground ??
        (dragOffset
          ? `${accentColor}${bgOpacityHex}`
          : 'var(--theme-surface, rgba(255,255,255,0.05))'));

    const border = `1px solid ${
      isCompleting ? `${accentColor}80` : (staticBorder ?? `${accentColor}${borderOpacityHex}`)
    }`;

    return (
      <motion.div
        key={itemKey}
        data-block-swipe
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
        {/* Invisible swipe overlay (sits on top, triggers drag) */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          dragSnapToOrigin
          onDragStart={() => onSwipeStart()}
          onDrag={(_event, info: PanInfo) => onSwipeDrag(info.offset.x)}
          onDragEnd={(event, info: PanInfo) => {
            event.stopPropagation();
            onSwipeEnd();
            if (canSwipe && Math.abs(info.offset.x) > 100) {
              onComplete(info.offset.x > 0 ? 'right' : 'left');
            }
          }}
          whileDrag={{ scale: 1.02 }}
          style={{
            position: 'absolute',
            top: 0,
            left: '70px',
            right: 0,
            bottom: 0,
            zIndex: 1,
          }}
        />

        {/* Card container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background,
            border,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: dragOffset ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '14px',
            padding: '12px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Swipe glow indicator */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, transparent, ${accentColor}4D)`,
              opacity: 0,
              pointerEvents: 'none',
            }}
            animate={{ opacity: isSwiping ? 1 : 0 }}
          />

          {/* Poster */}
          <img
            src={poster}
            alt={posterAlt}
            decoding="async"
            onClick={onPosterClick}
            style={{
              width: '50px',
              height: '75px',
              objectFit: 'cover',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              cursor: onPosterClick ? 'pointer' : 'default',
              position: 'relative',
              zIndex: 2,
              flexShrink: 0,
            }}
          />

          {/* Middle content */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              pointerEvents: 'none',
              position: 'relative',
              zIndex: 2,
              overflow: 'hidden',
            }}
          >
            {content}
          </div>

          {/* Right action with AnimatePresence */}
          <AnimatePresence mode="wait">
            {isCompleting ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                style={{ position: 'relative', zIndex: 2 }}
              >
                <Check style={{ fontSize: '24px', color: accentColor }} />
              </motion.div>
            ) : animateAction ? (
              <motion.div
                key="action"
                animate={{ x: isSwiping ? 10 : 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {action}
              </motion.div>
            ) : (
              <div
                key="action-static"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {action}
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

SwipeableEpisodeRow.displayName = 'SwipeableEpisodeRow';
