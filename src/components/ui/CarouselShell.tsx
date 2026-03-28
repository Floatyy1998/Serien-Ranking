import { Close } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import './CarouselNotification.css';

interface CarouselShellProps {
  itemCount: number;
  color: string;
  onDismissAll: () => void;
  headerContent: React.ReactNode;
  children: (currentIndex: number) => React.ReactNode;
  counterSuffix: string;
}

export const CarouselShell: React.FC<CarouselShellProps> = ({
  itemCount,
  color,
  onDismissAll,
  headerContent,
  children,
  counterSuffix,
}) => {
  const { currentTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(itemCount > 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const dotsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dotsContainerRef.current && itemCount > 1) {
      const activeDot = dotsContainerRef.current.children[currentIndex] as HTMLElement;
      activeDot?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex, itemCount]);

  const handleDismissAll = async () => {
    await onDismissAll();
    setIsVisible(false);
    setTimeout(() => {}, 300);
  };

  if (itemCount === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="new-season-notification"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            background: `linear-gradient(135deg, ${color}20, ${currentTheme.background.default})`,
            borderColor: color + '40',
            color: currentTheme.text.primary,
          }}
        >
          <Tooltip title="Alle schließen" arrow>
            <button
              className="close-button"
              onClick={handleDismissAll}
              style={{ color: currentTheme.text.primary + '80' }}
            >
              <Close />
            </button>
          </Tooltip>

          <div className="notification-content">
            {headerContent}

            {children(currentIndex)}

            {itemCount > 1 && (
              <div className="navigation-dots">
                <Tooltip title="Vorherige" arrow>
                  <span>
                    <button
                      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                      disabled={currentIndex === 0}
                      className="nav-button"
                      style={{ color: currentTheme.text.primary + '60' }}
                    >
                      ‹
                    </button>
                  </span>
                </Tooltip>

                <div
                  className="dots"
                  ref={dotsContainerRef}
                  role="tablist"
                  aria-label="Element auswählen"
                >
                  {Array.from({ length: itemCount }).map((_, index) => (
                    <span
                      key={index}
                      role="tab"
                      aria-selected={index === currentIndex}
                      tabIndex={0}
                      className={`dot ${index === currentIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setCurrentIndex(index);
                        }
                      }}
                      style={{
                        backgroundColor:
                          index === currentIndex ? color : currentTheme.text.primary + '30',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>

                <Tooltip title="Nächste" arrow>
                  <span>
                    <button
                      onClick={() => setCurrentIndex((i) => Math.min(itemCount - 1, i + 1))}
                      disabled={currentIndex === itemCount - 1}
                      className="nav-button"
                      style={{ color: currentTheme.text.primary + '60' }}
                    >
                      ›
                    </button>
                  </span>
                </Tooltip>
              </div>
            )}

            {itemCount > 1 && (
              <p className="counter">
                {currentIndex + 1} von {itemCount} {counterSuffix}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
