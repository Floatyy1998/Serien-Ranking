import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import type { PanInfo } from 'framer-motion';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';

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
}

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
}) => {
  const { currentTheme } = useTheme();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useFocusTrap(sheetRef, isOpen, onClose);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > dragThreshold || (info.offset.y > 0 && info.velocity.y > 500)) {
      onClose();
    }
  };

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
            background: 'var(--overlay-backdrop)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 999,
            backdropFilter: 'var(--blur-sm)',
            WebkitBackdropFilter: 'var(--blur-sm)',
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
            onDragEnd={handleDragEnd}
            className="ui-sheet"
            style={{
              /* transluzent + Glass-Filter: der Seiteninhalt schimmert durch */
              background: `
                radial-gradient(120% 60% at 50% 0%, rgba(255, 255, 255, 0.06), transparent 60%),
                linear-gradient(145deg,
                  color-mix(in srgb, ${currentTheme.background.surface} 88%, transparent) 0%,
                  color-mix(in srgb, ${currentTheme.background.default} 93%, transparent) 100%)`,
              WebkitBackdropFilter: 'var(--glass-filter-xl)',
              backdropFilter: 'var(--glass-filter-xl)',
              maxWidth,
              /* max-height lebt in .ui-sheet — Desktop darf den Prop-Wert überstimmen */
              ['--sheet-max-h' as string]: maxHeight,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow:
                '0 -16px 48px -12px rgba(0, 0, 0, 0.5), 0 -4px 16px -4px rgba(0, 0, 0, 0.3), var(--glass-specular)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showDragHandle && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                aria-hidden="true"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '12px',
                  cursor: 'grab',
                  touchAction: 'none',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '5px',
                    background: `rgba(255, 255, 255, 0.2)`,
                    borderRadius: '3px',
                    pointerEvents: 'none',
                  }}
                />
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
