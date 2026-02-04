import React from 'react';
import { AnimatePresence, motion, useDragControls, PanInfo } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  showDragHandle?: boolean;
  dragThreshold?: number;
  bottomOffset?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'none',
  maxHeight = '85vh',
  showDragHandle = true,
  dragThreshold = 100,
  bottomOffset = '0px',
}) => {
  const { currentTheme } = useTheme();
  const dragControls = useDragControls();

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > dragThreshold || (info.offset.y > 0 && info.velocity.y > 500)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 999,
            backdropFilter: 'blur(20px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            style={{
              background: `linear-gradient(145deg, ${currentTheme.background.surface} 0%, ${currentTheme.background.default} 100%)`,
              borderRadius: '24px 24px 0 0',
              width: '100%',
              maxWidth,
              maxHeight,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
              marginBottom: bottomOffset,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showDragHandle && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
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
                    width: '48px',
                    height: '5px',
                    background: currentTheme.border.default,
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
};
