// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pickReaction, triggerPetReaction, usePetReactions } from './usePetReactions';

// Firebase-Mock: ref(path).on/off('value', cb) — Listener werden pro Pfad
// gesammelt, emit(path, val) feuert sie mit einem {val()}-Snapshot.
const fb = vi.hoisted(() => {
  type Listener = (snap: { val: () => unknown }) => void;
  const listeners: Record<string, Listener[]> = {};
  const store: Record<string, unknown> = {};
  const offMock = vi.fn();
  const makeSnap = (val: unknown) => ({ val: () => val });
  const makeRef = (path: string) => {
    const ref = {
      path,
      on: vi.fn((_ev: string, cb: Listener) => {
        (listeners[path] ??= []).push(cb);
        return cb;
      }),
      off: vi.fn((ev: string, cb: Listener) => {
        offMock(path, ev);
        const list = listeners[path];
        if (list) {
          const i = list.indexOf(cb);
          if (i >= 0) list.splice(i, 1);
        }
      }),
    };
    return ref;
  };
  const refMock = vi.fn((path: string) => makeRef(path));
  const database = Object.assign(() => ({ ref: refMock }), {
    ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } },
  });
  const emit = (path: string, val: unknown) => {
    store[path] = val;
    (listeners[path] ?? []).forEach((cb) => cb(makeSnap(val)));
  };
  const reset = () => {
    for (const k of Object.keys(listeners)) delete listeners[k];
    for (const k of Object.keys(store)) delete store[k];
    offMock.mockClear();
    refMock.mockClear();
  };
  return { listeners, refMock, database, emit, offMock, reset };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const YEAR = new Date().getFullYear();
const streakPath = (uid: string) => `users/${uid}/wrapped/${YEAR}/streak`;
const triggerPath = (uid: string) => `users/${uid}/petTrigger`;

beforeEach(() => {
  fb.reset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-04T14:00:00Z'));
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('pickReaction (pure)', () => {
  it('interpoliert {n} in Streak-Nachrichten', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.15); // deterministische Auswahl
    const r = pickReaction('streak', { n: 7 });
    expect(r.tone).toBe('streak');
    expect(r.message).not.toContain('{n}');
    vi.spyOn(Math, 'random').mockRestore();
  });

  it('fällt bei unbekanntem Tone auf den cheer-Pool zurück', () => {
    const r = pickReaction('unknown' as never);
    expect(typeof r.emoji).toBe('string');
    expect(typeof r.message).toBe('string');
  });
});

describe('usePetReactions', () => {
  it('startet ohne Reaktion (null)', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    expect(result.current).toBeNull();
  });

  it('reagiert auf ein imperatives window-CustomEvent', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      window.dispatchEvent(
        new CustomEvent('pet-reaction', {
          detail: { tone: 'binge', emoji: '🔥', message: 'On fire!' },
        })
      );
    });
    expect(result.current?.tone).toBe('binge');
    expect(result.current?.message).toBe('On fire!');
  });

  it('merkt sich den ersten Streak-Snapshot ohne zu reagieren', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 5 });
    });
    expect(result.current).toBeNull();
  });

  it('zeigt eine Milestone-Reaktion, wenn der Streak eine Meilenstein-Zahl erreicht', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 6 });
    });
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 7 }); // 7 ist Meilenstein
    });
    expect(result.current?.tone).toBe('milestone');
  });

  it('zeigt eine streak-Reaktion bei normalem Anstieg (>=3, kein Meilenstein)', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 4 });
    });
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 5 });
    });
    expect(result.current?.tone).toBe('streak');
  });

  it('zeigt eine cheer-Reaktion bei kleinem Anstieg (<3)', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 1 });
    });
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 2 });
    });
    expect(result.current?.tone).toBe('cheer');
  });

  it('ignoriert einen fallenden/gleichbleibenden Streak', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 5 });
    });
    act(() => {
      fb.emit(streakPath('u1'), { currentStreak: 4 });
    });
    expect(result.current).toBeNull();
  });

  it('reagiert auf einen frischen petTrigger', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      fb.emit(triggerPath('u1'), { tone: 'love', at: Date.now() });
    });
    expect(result.current?.tone).toBe('love');
  });

  it('ignoriert einen veralteten petTrigger (>60s)', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      fb.emit(triggerPath('u1'), { tone: 'love', at: Date.now() - 120_000 });
    });
    expect(result.current).toBeNull();
  });

  it('blendet die Reaktion nach dem Dismiss-Timeout aus', () => {
    const { result } = renderHook(() => usePetReactions('u1'));
    act(() => {
      window.dispatchEvent(
        new CustomEvent('pet-reaction', { detail: { tone: 'cheer', emoji: '✨', message: 'x' } })
      );
    });
    expect(result.current).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(4300);
    });
    expect(result.current).toBeNull();
  });

  it('registriert keine Firebase-Listener ohne uid', () => {
    renderHook(() => usePetReactions(undefined));
    expect(fb.refMock).not.toHaveBeenCalled();
  });

  it('entfernt die Firebase-Listener beim Unmount', () => {
    const { unmount } = renderHook(() => usePetReactions('u1'));
    unmount();
    expect(fb.offMock).toHaveBeenCalledWith(streakPath('u1'), 'value');
    expect(fb.offMock).toHaveBeenCalledWith(triggerPath('u1'), 'value');
  });
});

describe('triggerPetReaction', () => {
  it('dispatcht ein pet-reaction Event mit fertigem Detail', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    triggerPetReaction({ tone: 'movie', emoji: '🎬', message: 'Film!' });
    const ev = spy.mock.calls[0][0] as CustomEvent;
    expect(ev.type).toBe('pet-reaction');
    expect(ev.detail).toEqual({ tone: 'movie', emoji: '🎬', message: 'Film!' });
    spy.mockRestore();
  });

  it('erzeugt eine zufällige Zeile, wenn nur der Tone übergeben wird', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    triggerPetReaction({ tone: 'binge' });
    const ev = spy.mock.calls[0][0] as CustomEvent<{ tone: string; message: string }>;
    expect(ev.detail.tone).toBe('binge');
    expect(typeof ev.detail.message).toBe('string');
    spy.mockRestore();
  });
});
