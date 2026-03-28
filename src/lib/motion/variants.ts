import type { Variants, Transition } from 'framer-motion';

// --- Shared spring presets (aligned with designTokens.ts) ---
const springDefault: Transition = { type: 'spring', stiffness: 280, damping: 24 };
const springSnappy: Transition = { type: 'spring', stiffness: 380, damping: 26 };
const springCinematic: Transition = { type: 'spring', stiffness: 150, damping: 18 };

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
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSnappy,
  },
};

// --- Page Transitions (cinematic) ---
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
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

// --- Slide Up (bottom sheets, notifications) ---
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 50, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: springDefault,
  },
  exit: {
    opacity: 0,
    y: 24,
    filter: 'blur(2px)',
    transition: { duration: 0.2 },
  },
};

// --- Slide Down (top notifications, dropdowns) ---
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springDefault,
  },
  exit: {
    opacity: 0,
    y: -18,
    transition: { duration: 0.15 },
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

// --- Pop (celebrations, badges, achievements) ---
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.5, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 450, damping: 18 },
  },
};

// --- Shared tap/hover presets for consistency ---
export const tapScale = { scale: 0.96 } as const;
export const tapScaleSmall = { scale: 0.98 } as const;
export const tapScaleTight = { scale: 0.92 } as const;
export const hoverScale = { scale: 1.03 } as const;
export const hoverLift = { y: -2, scale: 1.01 } as const;

// Spring presets re-exported for component use
export const springs = {
  default: springDefault,
  snappy: springSnappy,
  cinematic: springCinematic,
  gentle: { type: 'spring', stiffness: 200, damping: 22 } as Transition,
} as const;

// --- Content swap (carousel items, tab content) ---
export const contentSwap: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.15 },
  },
};

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
