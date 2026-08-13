import { describe, expect, it } from 'vitest';
import {
  DAY_MS,
  REVIEW_RULES,
  afterMoment,
  afterPrompt,
  emptyReviewState,
  normalizeReviewState,
  shouldRequestReview,
  type ReviewPromptState,
} from './reviewPrompt';

const NOW = 1_700_000_000_000;

/** Zustand, der alle Regeln erfüllt — einzelne Felder je Test dagegen halten. */
const ready = (overrides: Partial<ReviewPromptState> = {}): ReviewPromptState => ({
  firstSeen: NOW - (REVIEW_RULES.minAgeDays + 1) * DAY_MS,
  moments: REVIEW_RULES.minMoments,
  lastPrompt: 0,
  prompts: 0,
  optedOut: false,
  ...overrides,
});

describe('shouldRequestReview', () => {
  it('erlaubt die Frage, wenn alle Regeln erfüllt sind', () => {
    expect(shouldRequestReview(ready(), NOW)).toBe(true);
  });

  it('fragt nicht, solange die App zu frisch installiert ist', () => {
    const state = ready({ firstSeen: NOW - (REVIEW_RULES.minAgeDays - 1) * DAY_MS });
    expect(shouldRequestReview(state, NOW)).toBe(false);
  });

  it('fragt nicht bei zu wenigen Erfolgsmomenten', () => {
    expect(shouldRequestReview(ready({ moments: REVIEW_RULES.minMoments - 1 }), NOW)).toBe(false);
  });

  it('hält die Sperrfrist nach der letzten Frage ein', () => {
    const state = ready({
      prompts: 1,
      lastPrompt: NOW - (REVIEW_RULES.cooldownDays - 1) * DAY_MS,
    });
    expect(shouldRequestReview(state, NOW)).toBe(false);
  });

  it('fragt nach Ablauf der Sperrfrist wieder', () => {
    const state = ready({
      prompts: 1,
      lastPrompt: NOW - (REVIEW_RULES.cooldownDays + 1) * DAY_MS,
    });
    expect(shouldRequestReview(state, NOW)).toBe(true);
  });

  it('fragt nie öfter als maxPrompts', () => {
    const state = ready({ prompts: REVIEW_RULES.maxPrompts, lastPrompt: 0 });
    expect(shouldRequestReview(state, NOW)).toBe(false);
  });

  it('fragt nicht mehr, wenn der Nutzer selbst bewertet hat', () => {
    expect(shouldRequestReview(ready({ optedOut: true }), NOW)).toBe(false);
  });
});

describe('Zustandsübergänge', () => {
  it('afterMoment zählt hoch, ohne andere Felder anzufassen', () => {
    const before = ready({ moments: 1 });
    expect(afterMoment(before)).toEqual({ ...before, moments: 2 });
  });

  it('afterPrompt setzt die Momente zurück und zählt die Frage', () => {
    const after = afterPrompt(ready({ prompts: 1 }), NOW);
    expect(after.moments).toBe(0);
    expect(after.lastPrompt).toBe(NOW);
    expect(after.prompts).toBe(2);
  });

  it('nach afterPrompt greift sofort die Sperrfrist', () => {
    expect(shouldRequestReview(afterPrompt(ready(), NOW), NOW)).toBe(false);
  });
});

describe('normalizeReviewState', () => {
  it('macht aus einem leeren Zustand einen frischen', () => {
    expect(normalizeReviewState(null, NOW)).toEqual(emptyReviewState(NOW));
  });

  it('ersetzt kaputte Felder durch Vorgaben', () => {
    const state = normalizeReviewState(
      { firstSeen: 'gestern', moments: -3, lastPrompt: NaN, prompts: null, optedOut: 'ja' },
      NOW
    );
    expect(state).toEqual(emptyReviewState(NOW));
  });

  it('übernimmt gültige Werte unverändert', () => {
    const stored = ready({ prompts: 2, lastPrompt: NOW - DAY_MS, optedOut: true });
    expect(normalizeReviewState(stored, NOW)).toEqual(stored);
  });
});
