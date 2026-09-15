import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PanInfo } from 'framer-motion';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { KeyboardArrowUp } from '@mui/icons-material';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAndroidBack } from '../../../hooks/ui/useAndroidBack';
import { useFocusTrap } from '../../../hooks/ui/useFocusTrap';
import { useReducedMotion } from '../../../hooks/ui/useReducedMotion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  showDragHandle?: boolean;
  dragThreshold?: number;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  /** Überstimmt --z-sheet, wenn das Sheet über einem höheren Overlay liegen muss. */
  zIndex?: number | string;
  /**
   * Zweite Stufe: der Griff lässt sich nach oben ziehen (oder antippen) statt
   * nur nach unten zu schließen. Den Zusatzinhalt blendet der Aufrufer ein.
   */
  expandable?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** max-height der aufgeklappten Stufe (die .ui-sheet-Deckelung gilt weiter). */
  expandedMaxHeight?: string;
  /** Beschriftung am Griff je Stufe. */
  expandLabel?: string;
  collapseLabel?: string;
}

/** Zieh-Weg nach oben, ab dem die zweite Stufe aufgeht. */
const EXPAND_THRESHOLD = 44;
/** Ab dieser Zeigergeschwindigkeit reicht ein Wisch statt des vollen Wegs. */
const FLICK_VELOCITY = 500;
/** Bis hierhin gilt ein Zeiger-Weg noch als Tippen, nicht als Ziehen. */
const TAP_SLOP = 8;

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'none',
  maxHeight = '85vh',
  showDragHandle = true,
  dragThreshold = 100,
  ariaLabel,
  ariaLabelledBy,
  zIndex,
  expandable = false,
  expanded = false,
  onExpandedChange,
  expandedMaxHeight = '96vh',
  expandLabel,
  collapseLabel,
}) => {
  const { currentTheme } = useTheme();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const pressStartY = useRef<number | null>(null);
  // Ein Zug endet ebenfalls mit einem Klick — ohne diese Merker würde er die
  // Stufe gleich wieder umschalten.
  const dragMoved = useRef(false);
  const [dragging, setDragging] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useFocusTrap(sheetRef, isOpen, onClose);
  useAndroidBack(isOpen, onClose);

  // Die zweite Stufe geht schon beim Ziehen auf, nicht erst beim Loslassen —
  // der Inhalt kommt also mit dem Finger hoch.
  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.y) > TAP_SLOP) dragMoved.current = true;
    if (!expandable || expanded) return;
    if (info.offset.y < -EXPAND_THRESHOLD) onExpandedChange?.(true);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragging(false);
    const up = info.offset.y < -EXPAND_THRESHOLD || info.velocity.y < -FLICK_VELOCITY;
    const down =
      info.offset.y > dragThreshold || (info.offset.y > 0 && info.velocity.y > FLICK_VELOCITY);

    if (expandable && up && info.offset.y < 0) {
      if (!expanded) onExpandedChange?.(true);
      return;
    }
    if (!down) return;
    // Aufgeklappt fängt der erste Zug nach unten die Stufe ab — geschlossen
    // wird erst beim zweiten.
    if (expandable && expanded) {
      onExpandedChange?.(false);
      return;
    }
    onClose();
  };

  const toggleExpanded = () => {
    if (!expandable) return;
    onExpandedChange?.(!expanded);
  };

  const handleGripClick = (event: React.MouseEvent) => {
    if (!expandable) return;
    const start = pressStartY.current;
    pressStartY.current = null;
    if (dragMoved.current) return;
    if (start !== null && Math.abs(event.clientY - start) > TAP_SLOP) return;
    toggleExpanded();
  };

  const gripLabel = expanded ? collapseLabel : expandLabel;

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          // pointerEvents in beiden Zuständen setzen — sonst klebt 'none' nach Re-Open während des Ausblendens
          animate={{ opacity: 1, pointerEvents: 'auto' }}
          exit={{ opacity: 0, pointerEvents: 'none' }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // Gemessen: jede ganzflaechige backdrop-filter-Ebene kostet ~25 ms
            // pro Frame (Sheet 13 fps statt 60). Der Scrim traegt die Trennung
            // deshalb allein ueber Deckkraft statt ueber Unschaerfe.
            background: 'var(--overlay-backdrop-strong)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: (zIndex ?? 'var(--z-sheet)') as unknown as number,
          }}
          onClick={onClose}
        >
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0.1 }
                : { type: 'spring', damping: 25, stiffness: 300 }
            }
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragStart={() => setDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="ui-sheet"
            style={{
              /* Ohne Blur (siehe Scrim) traegt die Flaeche selbst — knapp
                 deckend, Tiefe kommt aus Sheen, Rand und Schatten. */
              background: `
                radial-gradient(120% 60% at 50% 0%, rgba(255, 255, 255, 0.07), transparent 60%),
                linear-gradient(145deg,
                  color-mix(in srgb, ${currentTheme.background.surface} 97%, transparent) 0%,
                  color-mix(in srgb, ${currentTheme.background.default} 99%, transparent) 100%)`,
              maxWidth,
              /* max-height lebt in .ui-sheet — Desktop darf den Prop-Wert überstimmen */
              ['--sheet-max-h' as string]: expandable && expanded ? expandedMaxHeight : maxHeight,
              /* Der Deckel wandert beim Aufklappen mit, statt zu springen.
                 Nur max-height — transform gehört framer-motion. */
              transition: expandable ? 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              // Ohne das markiert ein Zug am Griff den halben Sheet-Inhalt.
              userSelect: dragging ? 'none' : undefined,
              WebkitUserSelect: dragging ? 'none' : undefined,
              boxShadow:
                '0 -16px 48px -12px rgba(0, 0, 0, 0.5), 0 -4px 16px -4px rgba(0, 0, 0, 0.3), var(--glass-specular)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showDragHandle && (
              <div
                onPointerDown={(e) => {
                  pressStartY.current = e.clientY;
                  dragMoved.current = false;
                  // Verhindert, dass der Browser beim Ziehen Text markiert.
                  e.preventDefault();
                  dragControls.start(e);
                }}
                onClick={handleGripClick}
                onKeyDown={
                  expandable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpanded();
                        }
                      }
                    : undefined
                }
                role={expandable ? 'button' : undefined}
                tabIndex={expandable ? 0 : undefined}
                aria-expanded={expandable ? expanded : undefined}
                aria-label={expandable ? gripLabel : undefined}
                aria-hidden={expandable ? undefined : 'true'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: expandable && gripLabel ? '12px 12px 8px' : '12px',
                  cursor: 'grab',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '5px',
                    background: expandable
                      ? 'rgba(255, 255, 255, 0.32)'
                      : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px',
                    pointerEvents: 'none',
                  }}
                />
                {expandable && gripLabel && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      color: currentTheme.text?.muted,
                      pointerEvents: 'none',
                    }}
                  >
                    <motion.span
                      animate={shouldReduceMotion || expanded ? { y: 0 } : { y: [0, -2.5, 0] }}
                      transition={
                        shouldReduceMotion || expanded
                          ? { duration: 0 }
                          : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                      }
                      style={{ display: 'inline-flex' }}
                    >
                      <KeyboardArrowUp
                        style={{
                          fontSize: '16px',
                          transform: expanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform var(--duration-fast) ease',
                        }}
                      />
                    </motion.span>
                    {gripLabel}
                  </span>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
};
