import type { Variants } from 'framer-motion';

// --- Shared spring presets (aligned with designTokens.ts) ---
const springDefault = { type: 'spring', stiffness: 280, damping: 24 } as const;
const springCinematic = { type: 'spring', stiffness: 150, damping: 18 } as const;

// --- Stagger Container / Item ---
// Wrap a list container with staggerContainer, each child with staggerItem.
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: springDefault,
  },
};

// Faster stagger for dense grids (e.g. poster grids)
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemFast: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 350, damping: 26 },
  },
};

// --- Scale-in (modals, overlays, dialogs) ---
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: springCinematic,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    filter: 'blur(3px)',
    transition: { duration: 0.18 },
  },
};

// --- Fade only (subtle transitions) ---
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18 },
  },
};

// --- Shared tap/hover presets for consistency ---
export const tapScale = { scale: 0.96 } as const;
export const tapScaleSmall = { scale: 0.98 } as const;
export const tapScaleTight = { scale: 0.92 } as const;
// --- Scale button (clear buttons, icon buttons) ---
export const scaleButton: Variants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    transition: { duration: 0.12 },
  },
};
