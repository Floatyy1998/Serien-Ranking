// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TasteMatchResult } from '../../services/tasteMatchService';

/* ---------------------------------------------------------------------------
 * firebase once (eigener User), fetchPublicUserFields (Freund),
 * calculateTasteMatch, useAuth, useParams gemockt. getScoreColor/-Message echt.
 * ------------------------------------------------------------------------- */
const state = vi.hoisted(() => ({
  user: null as { uid: string; displayName?: string; photoURL?: string } | null,
  params: {} as Record<string, string | undefined>,
  currentUser: null as unknown,
  friendFields: { username: null, displayName: null, photoURL: null } as {
    username: string | null;
    displayName: string | null;
    photoURL: string | null;
  },
  matchResult: null as TasteMatchResult | null,
  calc: vi.fn<(a: string, b: string) => Promise<TasteMatchResult>>(),
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({ once: async () => ({ val: () => state.currentUser }) }),
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('react-router-dom', () => ({ useParams: () => state.params }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('../../lib/firebase/userDisplayData', () => ({
  fetchPublicUserFields: () => Promise.resolve(state.friendFields),
}));
vi.mock('../../services/tasteMatchService', () => ({
  calculateTasteMatch: (a: string, b: string) => state.calc(a, b),
}));

import { getScoreColor, getScoreMessage, useTasteMatchData } from './useTasteMatchData';

const sampleResult = (): TasteMatchResult => ({
  overallMatch: 82,
  seriesOverlap: { score: 80, sharedSeries: [], userOnlyCount: 1, friendOnlyCount: 2 },
  movieOverlap: { score: 70, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
  genreMatch: { score: 60, sharedGenres: [], userTopGenres: [], friendTopGenres: [] },
  ratingMatch: { score: 90, averageDifference: 0.5, sameRatingCount: 3 },
  providerMatch: { score: 50, sharedProviders: [] },
});

beforeEach(() => {
  state.user = { uid: 'me', displayName: 'Me Long', photoURL: 'me.jpg' };
  state.params = { friendId: 'friend1' };
  state.currentUser = { displayName: 'MeDb Name', photoURL: 'db.jpg' };
  state.friendFields = { username: null, displayName: 'Friendy McFriend', photoURL: 'f.jpg' };
  state.matchResult = sampleResult();
  state.calc.mockReset();
  state.calc.mockImplementation(() => Promise.resolve(sampleResult()));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('getScoreColor / getScoreMessage', () => {
  it('mappt Score-Schwellen auf Farbe und Botschaft', () => {
    expect(getScoreColor(85)).toBe('#00cec9');
    expect(getScoreColor(10)).toBe('#636e72');
    expect(getScoreMessage(85)).toBe('Seelenverwandte!');
    expect(getScoreMessage(45)).toBe('Interessante Mischung');
  });
});

describe('useTasteMatchData', () => {
  it('rechnet ohne user oder friendId nicht (Guard)', () => {
    state.user = null;
    const { result } = renderHook(() => useTasteMatchData());
    expect(result.current.loading).toBe(true);
    expect(state.calc).not.toHaveBeenCalled();
  });

  it('lädt Namen/Fotos und berechnet das Match', async () => {
    const { result } = renderHook(() => useTasteMatchData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.calc).toHaveBeenCalledWith('me', 'friend1');
    expect(result.current.result?.overallMatch).toBe(82);
    // Vorname aus DB-displayName
    expect(result.current.userName).toBe('MeDb');
    expect(result.current.userPhoto).toBe('db.jpg');
    expect(result.current.friendName).toBe('Friendy');
    expect(result.current.friendPhoto).toBe('f.jpg');
  });

  it('handleShare nutzt die Zwischenablage wenn navigator.share fehlt', async () => {
    const writeText = vi.fn<(t: string) => void>();
    Object.assign(navigator, { share: undefined, clipboard: { writeText } });

    const { result } = renderHook(() => useTasteMatchData());
    await waitFor(() => expect(result.current.result).not.toBeNull());
    await result.current.handleShare();

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('Friendy');
  });
});
