/**
 * Pushes, zu denen die Startseite eine Hinweis-Karte hat. Kommt so ein Push
 * an oder wird angetippt, prüft die App ihre Hinweise sofort neu — sonst
 * stand im Push etwas, das die Startseite (noch) nicht zeigt.
 */
const HINT_PUSH_KINDS = new Set(['season', 'provider']);

const listeners = new Set<() => void>();

export const isHintPushKind = (kind: unknown): boolean =>
  typeof kind === 'string' && HINT_PUSH_KINDS.has(kind);

export const requestHintRefresh = (): void => {
  listeners.forEach((listener) => listener());
};

export const subscribeHintRefresh = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
