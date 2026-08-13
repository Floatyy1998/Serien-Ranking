/**
 * Wann darf die App nach einer Bewertung fragen? Reine Regelprüfung ohne I/O —
 * Zustand und Store-Dialog liegen in `services/appReview.ts`.
 *
 * Play und App Store drosseln selbst noch einmal (iOS: 3 Anfragen pro Jahr,
 * Play: undokumentiertes Kontingent). Diese Regeln sind die Schicht darüber,
 * damit die Frage überhaupt erst nach einem echten Erfolgsmoment kommt.
 */

export const DAY_MS = 86_400_000;

export interface ReviewPromptState {
  /** Erster App-Start (ms seit Epoch). */
  firstSeen: number;
  /** Positive Momente seit der letzten Frage. */
  moments: number;
  /** Letzte Frage (ms seit Epoch), 0 = noch nie gefragt. */
  lastPrompt: number;
  /** Wie oft insgesamt gefragt wurde. */
  prompts: number;
  /** Nutzer hat über die Einstellungen bewertet — danach nie wieder von allein fragen. */
  optedOut: boolean;
}

export const REVIEW_RULES = {
  /** Erst fragen, wenn die App so lange installiert ist. */
  minAgeDays: 7,
  /** So viele positive Momente müssen sich seit der letzten Frage summiert haben. */
  minMoments: 3,
  /** Abstand zwischen zwei Fragen. */
  cooldownDays: 120,
  /** Mehr als das wird ein Nutzer nie gefragt. */
  maxPrompts: 3,
} as const;

export const emptyReviewState = (now: number): ReviewPromptState => ({
  firstSeen: now,
  moments: 0,
  lastPrompt: 0,
  prompts: 0,
  optedOut: false,
});

/** Repariert fehlende/kaputte Felder aus dem localStorage auf einen brauchbaren Zustand. */
export const normalizeReviewState = (raw: unknown, now: number): ReviewPromptState => {
  const src = (raw ?? {}) as Partial<Record<keyof ReviewPromptState, unknown>>;
  const num = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

  return {
    firstSeen: num(src.firstSeen, now),
    moments: num(src.moments, 0),
    lastPrompt: num(src.lastPrompt, 0),
    prompts: num(src.prompts, 0),
    optedOut: src.optedOut === true,
  };
};

export const shouldRequestReview = (state: ReviewPromptState, now: number): boolean => {
  if (state.optedOut) return false;
  if (state.prompts >= REVIEW_RULES.maxPrompts) return false;
  if (state.moments < REVIEW_RULES.minMoments) return false;
  if (now - state.firstSeen < REVIEW_RULES.minAgeDays * DAY_MS) return false;
  if (state.lastPrompt > 0 && now - state.lastPrompt < REVIEW_RULES.cooldownDays * DAY_MS) {
    return false;
  }
  return true;
};

export const afterMoment = (state: ReviewPromptState): ReviewPromptState => ({
  ...state,
  moments: state.moments + 1,
});

export const afterPrompt = (state: ReviewPromptState, now: number): ReviewPromptState => ({
  ...state,
  moments: 0,
  lastPrompt: now,
  prompts: state.prompts + 1,
});
