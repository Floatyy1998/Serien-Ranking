// Subdirectory re-exports
export * from './firebase';
export * from './data';
export * from './episodes';
export * from './workers';

// Root-level hooks
export { useActorUniverse } from './useActorUniverse';
export type { Actor, ActorConnection, ActorUniverseData } from './useActorUniverse';
export { useAppTheme } from './useAppTheme';
export {
  useDiscussionCount,
  useEpisodeDiscussionCounts,
  useTotalSeriesDiscussionCount,
  DiscussionBadge,
} from './useDiscussionCounts';
export { useDiscussions, useDiscussionReplies } from './useDiscussions';
export { useEpisodeDragDrop } from './useEpisodeDragDrop';
export { useFocusTrap } from './useFocusTrap';
export { useKeyboardNavigation } from './useKeyboardNavigation';
export { useLocalStorage } from './useLocalStorage';
export { useReducedMotion } from './useReducedMotion';
export { useSeriesCountdowns } from './useSeriesCountdowns';
export type { SeriesCountdown } from './useSeriesCountdowns';
export { useTodayEpisodes } from './useTodayEpisodes';
export { useWrappedConfig } from './useWrappedConfig';
