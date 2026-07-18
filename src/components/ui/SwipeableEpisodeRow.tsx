/** Einheitliche Episoden-Karte (ContinueWatching, TodayEpisodes, Rewatches, WatchNext): Swipe-to-complete, Reorder, Ambient-Poster. */

import { Check, DragHandle } from '@mui/icons-material';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { memo, useRef } from 'react';

interface SwipeableEpisodeRowProps {
  itemKey: string;
  poster: string;
  /** Volle Backdrop-URL — füllt auf Desktop die Zeile als Artwork von rechts. */
  backdrop?: string;
  posterAlt: string;
  accentColor: string;

  // Swipe state
  isCompleting: boolean;
  isSwiping: boolean;
  dragOffset: number;
  swipeDirection?: 'left' | 'right';

  // Static overrides (e.g. watched episodes)
  staticBackground?: string;
  staticBorder?: string;
  canSwipe?: boolean;

  // Swipe handlers
  onSwipeStart: () => void;
  onSwipeDrag: (offset: number) => void;
  onSwipeEnd: () => void;
  onComplete: (direction: 'left' | 'right') => void;

  // Poster
  onPosterClick?: () => void;
  posterOverlay?: React.ReactNode;

  // Content & actions
  content: React.ReactNode;
  action: React.ReactNode;
  animateAction?: boolean;

  // ── Edit mode / reorder (optional) ──
  index?: number;
  isEditMode?: boolean;
  draggedIndex?: number | null;
  currentTouchIndex?: number | null;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, index: number) => Promise<void>;
  onTouchStart?: (e: React.TouchEvent, index: number) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => Promise<void>;
}

export const SwipeableEpisodeRow = memo<SwipeableEpisodeRowProps>(
  ({
    itemKey,
    poster,
    backdrop,
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
    posterOverlay,
    content,
    action,
    animateAction = true,
    index,
    isEditMode = false,
    draggedIndex = null,
    currentTouchIndex = null,
    onDragStart,
    onDragOver,
    onDrop,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }) => {
    const isMobile = window.innerWidth < 768;
    const color = accentColor;
    // Eigene Tap-Erkennung (<12px Weg + <600ms), weil framers onTap bei Touch-Mikro-Bewegungen abbricht
    const tapStart = useRef<{ x: number; y: number; t: number } | null>(null);
    const dragRatio = Math.min(Math.abs(dragOffset) / 100, 1);
    const isDragTarget =
      index != null &&
      currentTouchIndex === index &&
      draggedIndex !== null &&
      draggedIndex !== index;
    const isDragged = index != null && draggedIndex === index;

    const borderColor = isCompleting
      ? `${color}50`
      : (staticBorder ??
        (isDragTarget ? color : `rgba(255,255,255,${(0.07 + dragRatio * 0.15).toFixed(2)})`));

    return (
      <motion.div
        key={itemKey}
        className="cine-host"
        data-block-swipe
        data-index={index}
        layout={isEditMode ? true : undefined}
        initial={{ opacity: 0, y: 14 }}
        animate={{
          opacity: isCompleting ? 0.5 : 1,
          y: 0,
          scale: isCompleting ? 0.97 : 1,
        }}
        exit={{
          opacity: 0,
          x: swipeDirection === 'left' ? -300 : 300,
          transition: { duration: 0.28, ease: [0.32, 0, 0.67, 0] },
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ position: 'relative' }}
      >
        {/* Swipe-Hitfläche (nicht im Edit-Mode): Klick öffnet dasselbe Ziel wie der Poster-Tap, echter Drag feuert keinen Tap */}
        {!isEditMode && (
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
            onPointerDown={(e) => {
              tapStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
            }}
            // Bewusst onClick statt onPointerUp: sonst schließt der nachlaufende Click den frisch gemounteten Sheet-Backdrop sofort wieder (Race)
            onClick={(e) => {
              const start = tapStart.current;
              tapStart.current = null;
              if (!start || !onPosterClick) return;
              const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
              if (moved < 12 && Date.now() - start.t < 600) onPosterClick();
            }}
            whileDrag={{ scale: 1.015 }}
            style={{
              position: 'absolute',
              top: 0,
              left: '90px',
              right: '50px',
              bottom: 0,
              zIndex: 4,
              cursor: onPosterClick ? 'pointer' : undefined,
            }}
          />
        )}

        <div
          draggable={isEditMode}
          onDragStart={
            isEditMode && onDragStart && index != null
              ? (e: React.DragEvent<HTMLDivElement>) => onDragStart(e, index)
              : undefined
          }
          onDragOver={
            isEditMode && onDragOver && index != null ? (e) => onDragOver(e, index) : undefined
          }
          onDrop={
            isEditMode && onDrop && index != null
              ? (e: React.DragEvent<HTMLDivElement>) => onDrop(e, index)
              : undefined
          }
          onTouchStart={
            isEditMode && onTouchStart && index != null ? (e) => onTouchStart(e, index) : undefined
          }
          onTouchMove={isEditMode && onTouchMove ? onTouchMove : undefined}
          onTouchEnd={isEditMode && onTouchEnd ? onTouchEnd : undefined}
          style={{
            position: 'relative',
            borderRadius: isMobile ? '14px' : '18px',
            overflow: 'hidden',
            border: `1px solid ${borderColor}`,
            borderLeft: staticBorder ? undefined : `1px solid transparent`,
            boxShadow: isDragged
              ? `0 8px 24px ${color}40`
              : isDragTarget
                ? `0 4px 12px ${color}30`
                : isSwiping
                  ? `0 12px 44px rgba(0,0,0,0.55), 0 0 20px ${color}30`
                  : `0 6px 28px rgba(0,0,0,0.4), 0 0 12px ${color}15`,
            cursor: isEditMode ? 'move' : undefined,
            opacity: isDragged ? 0.6 : 1,
            transform: isDragged ? 'scale(1.05)' : isDragTarget ? 'scale(1.02)' : undefined,
            transition: dragOffset ? 'none' : 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {!staticBorder && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '3px',
                background: color,
                boxShadow: `0 0 14px ${color}aa`,
                zIndex: 3,
                borderRadius: `${isMobile ? '14px' : '18px'} 0 0 ${isMobile ? '14px' : '18px'}`,
              }}
            />
          )}

          {/* Desktop mit Backdrop: Artwork läuft maskiert von rechts ein; Mobile/ohne Backdrop: geblurter Poster-Ambient in voller Breite */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            {!isMobile && backdrop && !staticBackground ? (
              <img
                src={backdrop}
                alt=""
                aria-hidden
                decoding="async"
                // Dimm-/Hover-Filter kommt aus global.css (.cine-art) — inline würde er die Hover-Regel überstimmen
                className="cine-art"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  height: '100%',
                  width: '68%',
                  objectFit: 'cover',
                  objectPosition: 'center 25%',
                  WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 45%)',
                  maskImage: 'linear-gradient(90deg, transparent, #000 45%)',
                }}
                loading="lazy"
              />
            ) : (
              <img
                src={poster}
                alt=""
                aria-hidden
                decoding="async"
                style={{
                  position: 'absolute',
                  top: '-30%',
                  left: '-10%',
                  width: '120%',
                  height: '160%',
                  objectFit: 'cover',
                  filter: isMobile
                    ? 'blur(32px) saturate(1.8) brightness(0.5)'
                    : 'blur(48px) saturate(2) brightness(0.62)',
                  opacity: staticBackground ? 0.25 : 0.85,
                  transform: 'scale(1.15)',
                }}
                loading="lazy"
              />
            )}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  staticBackground ||
                  (!isMobile
                    ? backdrop
                      ? 'linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.86) 30%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.12) 78%, rgba(0,0,0,0.5) 100%)'
                      : 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.68) 100%)'
                    : 'linear-gradient(105deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,0.92) 100%)'),
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.03))',
              }}
            />
          </div>

          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at ${dragOffset > 0 ? '10%' : '90%'} 50%, ${color}30 0%, transparent 60%)`,
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
            animate={{ opacity: isSwiping ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '12px' : '16px',
              padding: isMobile ? '8px 12px 8px 8px' : '12px 16px 12px 12px',
              minHeight: isMobile ? undefined : '112px',
            }}
          >
            <div
              onClick={onPosterClick}
              style={{
                position: 'relative',
                flexShrink: 0,
                cursor: onPosterClick ? 'pointer' : 'default',
                zIndex: 3,
              }}
            >
              <div
                style={{
                  width: isMobile ? '52px' : '92px',
                  height: isMobile ? '76px' : '134px',
                  borderRadius: isMobile ? '10px' : '12px',
                  overflow: 'hidden',
                  boxShadow:
                    '0 6px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              >
                <img
                  src={poster}
                  alt={posterAlt}
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  loading="lazy"
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '35%',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              {posterOverlay}
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                pointerEvents: isEditMode ? 'auto' : 'none',
                position: 'relative',
                zIndex: 2,
                overflow: 'hidden',
              }}
            >
              {content}
            </div>

            {isEditMode && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 4px',
                  cursor: 'grab',
                }}
              >
                <DragHandle style={{ fontSize: '24px', opacity: 0.5 }} />
              </div>
            )}

            {!isEditMode && (
              <AnimatePresence mode="wait">
                {isCompleting ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 16px ${color}40`,
                      flexShrink: 0,
                    }}
                  >
                    <Check style={{ fontSize: '20px', color: '#fff' }} />
                  </motion.div>
                ) : animateAction ? (
                  <motion.div
                    key="action"
                    animate={{ x: isSwiping ? 8 : 0, opacity: isSwiping ? 0.4 : 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      position: 'relative',
                      zIndex: 2,
                      flexShrink: 0,
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
                      gap: '10px',
                      position: 'relative',
                      zIndex: 2,
                      flexShrink: 0,
                    }}
                  >
                    {action}
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

SwipeableEpisodeRow.displayName = 'SwipeableEpisodeRow';
