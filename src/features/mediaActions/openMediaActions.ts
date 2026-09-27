import type { MediaTarget } from '../../lib/interaction/mediaTarget';

export const MEDIA_ACTIONS_EVENT = 'tvrank:media-actions';

export type MediaActionsView = 'menu' | 'folders';

export interface OpenMediaActionsDetail {
  target: MediaTarget;
  view: MediaActionsView;
}

/** Öffnet das Aktions-Sheet des globalen MediaActionsHost ohne langen Druck. */
export function openMediaActions(target: MediaTarget, view: MediaActionsView = 'menu'): void {
  window.dispatchEvent(
    new CustomEvent<OpenMediaActionsDetail>(MEDIA_ACTIONS_EVENT, { detail: { target, view } })
  );
}
