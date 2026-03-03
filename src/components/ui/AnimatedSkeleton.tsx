import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface AnimatedSkeletonProps {
  /** When true, shows skeleton; when false, shows content */
  isLoading: boolean;
  /** The actual content to show when loaded */
  children: React.ReactNode;
  /** The skeleton placeholder to show while loading */
  skeleton: React.ReactNode;
}

/**
 * Smooth transition between skeleton loading state and actual content.
 * Uses AnimatePresence to cross-fade between the two states.
 */
export const AnimatedSkeleton: React.FC<AnimatedSkeletonProps> = ({
  isLoading,
  children,
  skeleton,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{isLoading ? skeleton : children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
