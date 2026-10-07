// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  sets: [] as { path: string; value: unknown }[],
  remote: null as unknown,
}));

vi.mock('../db/ref', () => ({
  paths: { mangaLayout: (uid: string) => `users/${uid}/mangaLayout` },
  dbRef: vi.fn((path: string) => ({
    set: (value: unknown) => {
      fb.sets.push({ path, value });
      return Promise.resolve();
    },
    once: () => Promise.resolve({ val: () => fb.remote }),
  })),
}));

import { MANGA_SECTION_IDS } from '../../config/mangaSections';
import {
  getMangaLayout,
  loadMangaLayout,
  resetMangaLayout,
  sanitizeMangaLayout,
  setMangaLayoutList,
  subscribeMangaLayout,
  toggleMangaLayoutItem,
} from './mangaLayout';

beforeEach(() => {
  vi.useFakeTimers();
  fb.sets = [];
  fb.remote = null;
  localStorage.clear();
  resetMangaLayout(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('mangaLayout', () => {
  it('startet mit allen Sektionen in Standard-Reihenfolge', () => {
    expect(getMangaLayout().sections.order).toEqual([...MANGA_SECTION_IDS]);
    expect(getMangaLayout().sections.hidden).toEqual([]);
  });

  it('blendet aus und wieder ein, speichert lokal und verzögert remote', () => {
    toggleMangaLayoutItem('u1', 'sections', 'trending');
    expect(getMangaLayout().sections.hidden).toEqual(['trending']);
    expect(JSON.parse(localStorage.getItem('mangaLayout_cache') || '{}').sections.hidden).toEqual([
      'trending',
    ]);
    expect(fb.sets).toEqual([]);
    vi.advanceTimersByTime(500);
    expect(fb.sets[0].path).toBe('users/u1/mangaLayout');

    toggleMangaLayoutItem('u1', 'sections', 'trending');
    expect(getMangaLayout().sections.hidden).toEqual([]);
  });

  it('übernimmt eine neue Reihenfolge und benachrichtigt Abonnenten', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMangaLayout(listener);
    const reversed = [...MANGA_SECTION_IDS].reverse();
    setMangaLayoutList(undefined, 'sections', { order: reversed });
    expect(getMangaLayout().sections.order).toEqual(reversed);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('ergänzt fehlende Sektionen beim Bereinigen gespeicherter Daten', () => {
    const layout = sanitizeMangaLayout({ sections: { order: ['stats', 'quatsch', 'trending'] } });
    expect(layout.sections.order.indexOf('stats')).toBeLessThan(
      layout.sections.order.indexOf('trending')
    );
    expect(layout.sections.order).not.toContain('quatsch');
    expect(layout.sections.order).toHaveLength(MANGA_SECTION_IDS.length);
    expect(layout.quick.hidden).toEqual([]);
  });

  it('lädt den Stand aus der Datenbank', async () => {
    fb.remote = { sections: { hidden: ['stats'] } };
    loadMangaLayout('u2');
    await vi.runAllTimersAsync();
    expect(getMangaLayout().sections.hidden).toEqual(['stats']);
  });
});
