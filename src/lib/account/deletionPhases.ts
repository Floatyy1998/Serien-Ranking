/** Schritte der Kontolöschung in der Reihenfolge, in der das Backend sie meldet. */
export const DELETION_PHASES = ['data', 'social', 'chats', 'files', 'references', 'auth'] as const;

export type DeletionStep = (typeof DELETION_PHASES)[number];
export type DeletionPhase = DeletionStep | 'done';

export const isDeletionPhase = (value: unknown): value is DeletionStep =>
  typeof value === 'string' && (DELETION_PHASES as readonly string[]).includes(value);
