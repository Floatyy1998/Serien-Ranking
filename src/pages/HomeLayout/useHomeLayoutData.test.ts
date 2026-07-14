// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';

// Firebase compat mock
const fb = vi.hoisted(() => {
  const state: { data: unknown } = { data: null };
  const once = vi.fn(() => Promise.resolve({ val: () => state.data }));
  const set = vi.fn((_config?: unknown) => Promise.resolve());
  const ref = vi.fn(() => ({ once, set }));
  const database = vi.fn(() => ({ ref }));
  return { state, once, set, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const haptics = vi.hoisted(() => ({ hapticSelect: vi.fn(), hapticWarning: vi.fn() }));
vi.mock('../../lib/haptics', () => haptics);

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

import {
  useHomeLayoutData,
  DEFAULT_SECTION_ORDER,
  DEFAULT_FOR_YOU_ORDER,
} from './useHomeLayoutData';

beforeEach(() => {
  fb.state.data = null;
  fb.once.mockClear();
  fb.set.mockClear();
  fb.ref.mockClear();
  fb.database.mockClear();
  haptics.hapticSelect.mockClear();
  haptics.hapticWarning.mockClear();
  authState.user = null;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useHomeLayoutData', () => {
  it('startet mit Default-Section-Order', () => {
    const { result } = renderHook(() => useHomeLayoutData());
    expect(result.current.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
    expect(result.current.hiddenSections).toEqual([]);
  });

  it('lädt gespeicherte Config aus Firebase und merged fehlende Defaults', async () => {
    authState.user = { uid: 'u1' };
    fb.state.data = {
      sectionOrder: ['stats', 'trending'],
      hiddenSections: ['countdown', 'bogus'],
    };
    const { result } = renderHook(() => useHomeLayoutData());
    // ungültige hidden-ID herausgefiltert (nach Firebase-Load)
    await waitFor(() => expect(result.current.hiddenSections).toEqual(['countdown']));
    // alle Defaults vorhanden
    for (const id of DEFAULT_SECTION_ORDER) {
      expect(result.current.sectionOrder).toContain(id);
    }
    expect(result.current.sectionOrder).toContain('trending');
    expect(fb.ref).toHaveBeenCalledWith('users/u1/homeConfig');
  });

  it('handleSectionToggle blendet eine Sektion aus und triggert Haptik + debounced Save', async () => {
    vi.useFakeTimers();
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useHomeLayoutData());
    act(() => {
      result.current.handleSectionToggle('stats');
    });
    expect(result.current.hiddenSections).toContain('stats');
    expect(haptics.hapticSelect).toHaveBeenCalledTimes(1);
    // Save ist debounced (500ms) → noch nicht geschrieben
    expect(fb.set).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(fb.set).toHaveBeenCalledTimes(1);
    const saved = fb.set.mock.calls[0][0] as { hiddenSections: string[] };
    expect(saved.hiddenSections).toContain('stats');
  });

  it('handleSectionReorder aktualisiert die Reihenfolge', () => {
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useHomeLayoutData());
    const reordered = [...DEFAULT_SECTION_ORDER].reverse();
    act(() => {
      result.current.handleSectionReorder(reordered);
    });
    expect(result.current.sectionOrder).toEqual(reordered);
  });

  it('handleReset stellt Defaults wieder her und triggert Warn-Haptik', () => {
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useHomeLayoutData());
    act(() => {
      result.current.handleSectionToggle('stats');
    });
    act(() => {
      result.current.handleReset();
    });
    expect(result.current.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
    expect(result.current.hiddenSections).toEqual([]);
    expect(haptics.hapticWarning).toHaveBeenCalledTimes(1);
  });

  it('getExpandableConfig liefert Config für for-you und null für unbekannte IDs', () => {
    const { result } = renderHook(() => useHomeLayoutData());
    const forYou = result.current.getExpandableConfig('for-you');
    expect(forYou).not.toBeNull();
    expect(forYou?.order).toEqual(DEFAULT_FOR_YOU_ORDER);
    expect(result.current.getExpandableConfig('does-not-exist')).toBeNull();
  });

  it('speichert nicht ohne eingeloggten User', () => {
    vi.useFakeTimers();
    authState.user = null;
    const { result } = renderHook(() => useHomeLayoutData());
    act(() => {
      result.current.handleSectionToggle('stats');
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(fb.set).not.toHaveBeenCalled();
  });
});
