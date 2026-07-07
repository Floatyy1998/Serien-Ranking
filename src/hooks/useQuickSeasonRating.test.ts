// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Series } from '../types/Series';

const fb = vi.hoisted(() => {
  const set = vi.fn(() => Promise.resolve());
  const ref = vi.fn(() => ({ set }));
  return { set, ref };
});
vi.mock('firebase/compat/app', () => ({ default: { database: () => ({ ref: fb.ref }) } }));
vi.mock('firebase/compat/database', () => ({}));

const authState = vi.hoisted(() => ({ user: { uid: 'u1' } as { uid: string } | null }));
vi.mock('../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const analytics = vi.hoisted(() => ({ trackRatingSaved: vi.fn() }));
vi.mock('../services/firebase/analytics', () => ({ trackRatingSaved: analytics.trackRatingSaved }));

const logger = vi.hoisted(() => ({ logRatingAdded: vi.fn(() => Promise.resolve()) }));
vi.mock('../features/badges/minimalActivityLogger', () => ({
  logRatingAdded: logger.logRatingAdded,
}));

import { useQuickSeasonRating, shouldTriggerQuickRate } from './useQuickSeasonRating';

const makeSeries = (over: Partial<Series> = {}): Series =>
  ({
    id: 42,
    title: 'Test Serie',
    rating: {},
    seasons: [{ episodes: [{}, {}] }, { episodes: [{}, {}, {}] }],
    genre: { genres: ['Action', 'Drama'] },
    ...over,
  }) as unknown as Series;

beforeEach(() => {
  fb.set.mockClear();
  fb.ref.mockClear();
  analytics.trackRatingSaved.mockClear();
  logger.logRatingAdded.mockClear();
  authState.user = { uid: 'u1' };
});

describe('shouldTriggerQuickRate', () => {
  it('true bei letzter Episode der letzten Staffel, unbewertet, kein Rewatch', () => {
    expect(shouldTriggerQuickRate(makeSeries(), 1, 2)).toBe(true);
  });

  it('false ohne Staffeln', () => {
    expect(shouldTriggerQuickRate(makeSeries({ seasons: [] }), 0, 0)).toBe(false);
  });

  it('false wenn nicht die letzte Staffel', () => {
    expect(shouldTriggerQuickRate(makeSeries(), 0, 1)).toBe(false);
  });

  it('false wenn nicht die letzte Episode', () => {
    expect(shouldTriggerQuickRate(makeSeries(), 1, 1)).toBe(false);
  });

  it('false wenn die Serie bereits bewertet ist', () => {
    expect(shouldTriggerQuickRate(makeSeries({ rating: { Action: 8 } }), 1, 2)).toBe(false);
  });

  it('false bei aktivem Rewatch', () => {
    const s = makeSeries({ rewatch: { active: true } as never });
    expect(shouldTriggerQuickRate(s, 1, 2)).toBe(false);
  });
});

describe('useQuickSeasonRating', () => {
  it('startet geschlossen', () => {
    const { result } = renderHook(() => useQuickSeasonRating());
    expect(result.current.quickRatingOpen).toBe(false);
    expect(result.current.quickRatingSeries).toBeNull();
    expect(result.current.quickRatingSeasonNumber).toBe(0);
  });

  it('showQuickRating öffnet den Dialog mit Serie + Staffelnummer', () => {
    const { result } = renderHook(() => useQuickSeasonRating());
    const series = makeSeries();
    act(() => result.current.showQuickRating(series, 3));
    expect(result.current.quickRatingOpen).toBe(true);
    expect(result.current.quickRatingSeries).toBe(series);
    expect(result.current.quickRatingSeasonNumber).toBe(3);
  });

  it('closeQuickRating setzt den State zurück', () => {
    const { result } = renderHook(() => useQuickSeasonRating());
    act(() => result.current.showQuickRating(makeSeries(), 3));
    act(() => result.current.closeQuickRating());
    expect(result.current.quickRatingOpen).toBe(false);
    expect(result.current.quickRatingSeries).toBeNull();
  });

  it('saveQuickRating schreibt eine Bewertung pro Genre und trackt/loggt', async () => {
    const { result } = renderHook(() => useQuickSeasonRating());
    act(() => result.current.showQuickRating(makeSeries(), 2));
    await act(async () => {
      await result.current.saveQuickRating(8);
    });
    expect(fb.ref).toHaveBeenCalledWith('users/u1/series/42/rating');
    expect(fb.set).toHaveBeenCalledWith({ Action: 8, Drama: 8 });
    expect(analytics.trackRatingSaved).toHaveBeenCalledWith('42', 'series', 8);
    expect(logger.logRatingAdded).toHaveBeenCalledWith('u1', 'Test Serie', 'series', 8, 42);
    // schließt nach dem Speichern
    expect(result.current.quickRatingOpen).toBe(false);
  });

  it('nutzt "General" wenn keine Genres vorhanden sind', async () => {
    const { result } = renderHook(() => useQuickSeasonRating());
    act(() => result.current.showQuickRating(makeSeries({ genre: { genres: [] } as never }), 1));
    await act(async () => {
      await result.current.saveQuickRating(5);
    });
    expect(fb.set).toHaveBeenCalledWith({ General: 5 });
  });

  it('macht nichts ohne eingeloggten User', async () => {
    authState.user = null;
    const { result } = renderHook(() => useQuickSeasonRating());
    act(() => result.current.showQuickRating(makeSeries(), 1));
    await act(async () => {
      await result.current.saveQuickRating(5);
    });
    expect(fb.set).not.toHaveBeenCalled();
  });

  it('macht nichts wenn keine Serie ausgewählt ist', async () => {
    const { result } = renderHook(() => useQuickSeasonRating());
    await act(async () => {
      await result.current.saveQuickRating(5);
    });
    expect(fb.set).not.toHaveBeenCalled();
  });

  it('schließt trotzdem wenn der Firebase-Write fehlschlägt', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fb.set.mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useQuickSeasonRating());
    act(() => result.current.showQuickRating(makeSeries(), 1));
    await act(async () => {
      await result.current.saveQuickRating(5);
    });
    expect(result.current.quickRatingOpen).toBe(false);
    errSpy.mockRestore();
  });
});
