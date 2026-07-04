// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';

// --- Firebase compat mock ---------------------------------------------------
const fb = vi.hoisted(() => {
  const state: { data: unknown } = { data: null };
  const once = vi.fn(() => Promise.resolve({ val: () => state.data }));
  const ref = vi.fn(() => ({ once }));
  const database = vi.fn(() => ({ ref }));
  return { state, once, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

import {
  useHomeConfig,
  DEFAULT_SECTION_ORDER,
  DEFAULT_FOR_YOU_ORDER,
  DEFAULT_QUICK_ACTIONS_ORDER,
} from './useHomeConfig';

const setAppReady = vi.fn<(key: keyof Window['appReadyStatus'], value: boolean) => void>();

beforeEach(() => {
  localStorage.clear();
  fb.state.data = null;
  fb.once.mockClear();
  fb.ref.mockClear();
  fb.database.mockClear();
  window.setAppReady = setAppReady;
  setAppReady.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useHomeConfig', () => {
  it('liefert Default-Orders wenn kein Cache existiert', () => {
    const { result } = renderHook(() => useHomeConfig(undefined));
    expect(result.current.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
    expect(result.current.forYouOrder).toEqual(DEFAULT_FOR_YOU_ORDER);
    expect(result.current.quickActionsOrder).toEqual(DEFAULT_QUICK_ACTIONS_ORDER);
    expect(result.current.hiddenSections).toEqual([]);
  });

  it('setzt homeConfig sofort ready wenn keine uid vorhanden ist', () => {
    renderHook(() => useHomeConfig(undefined));
    expect(setAppReady).toHaveBeenCalledWith('homeConfig', true);
    expect(fb.database).not.toHaveBeenCalled();
  });

  it('visibleSections filtert versteckte Sektionen heraus', async () => {
    fb.state.data = { hiddenSections: ['stats', 'trending'] };
    const { result } = renderHook(() => useHomeConfig('u1'));
    await waitFor(() => expect(result.current.hiddenSections).toContain('stats'));
    expect(result.current.visibleSections).not.toContain('stats');
    expect(result.current.visibleSections).not.toContain('trending');
    expect(result.current.visibleSections).toContain('quick-actions');
  });

  it('merged gecachte forYouOrder mit fehlenden Defaults an der richtigen Stelle', () => {
    // 'watch-streak' fehlt → wird vor 'daily-spin' eingefügt (nicht ans Ende)
    const cached = {
      forYouOrder: ['daily-spin', 'milestone-box', 'taste-profile'],
    };
    localStorage.setItem('homeConfig_cache', JSON.stringify(cached));
    const { result } = renderHook(() => useHomeConfig(undefined));
    // Alle Default-Items sind vorhanden
    for (const id of DEFAULT_FOR_YOU_ORDER) {
      expect(result.current.forYouOrder).toContain(id);
    }
    // 'watch-streak' landet vor 'daily-spin'
    const fy = result.current.forYouOrder;
    expect(fy.indexOf('watch-streak')).toBeLessThan(fy.indexOf('daily-spin'));
  });

  it('lädt Config aus Firebase und filtert ungültige IDs, ergänzt fehlende Defaults', async () => {
    fb.state.data = {
      sectionOrder: ['stats', 'bogus-section', 'trending'],
    };
    const { result } = renderHook(() => useHomeConfig('u1'));
    await waitFor(() => expect(result.current.sectionOrder).toContain('trending'));
    // ungültige ID entfernt
    expect(result.current.sectionOrder).not.toContain('bogus-section');
    // alle Defaults ergänzt
    for (const id of DEFAULT_SECTION_ORDER) {
      expect(result.current.sectionOrder).toContain(id);
    }
    expect(fb.ref).toHaveBeenCalledWith('users/u1/homeConfig');
  });

  it('schreibt geladene Config in den localStorage-Cache', async () => {
    fb.state.data = { sectionOrder: ['stats'] };
    renderHook(() => useHomeConfig('u1'));
    await waitFor(() => expect(localStorage.getItem('homeConfig_cache')).not.toBeNull());
    const cached = JSON.parse(localStorage.getItem('homeConfig_cache') || 'null');
    expect(cached).toMatchObject({ sectionOrder: ['stats'] });
  });

  it('markiert homeConfig ready nachdem Firebase geantwortet hat', async () => {
    fb.state.data = { sectionOrder: ['stats'] };
    renderHook(() => useHomeConfig('u1'));
    await waitFor(() => expect(setAppReady).toHaveBeenCalledWith('homeConfig', true));
  });
});
