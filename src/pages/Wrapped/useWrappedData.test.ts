// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import type { WrappedStats } from '../../types/Wrapped';

// --- react-router-dom mock --------------------------------------------------
const router = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: {} as { year?: string },
}));
vi.mock('react-router-dom', () => ({
  useParams: () => router.params,
  useNavigate: () => router.navigate,
}));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const cfg = vi.hoisted(() => ({ value: { enabled: true, year: 2025, loading: false } }));
vi.mock('../../hooks/useWrappedConfig', () => ({ useWrappedConfig: () => cfg.value }));

const calc = vi.hoisted(() => ({ calculateWrappedStats: vi.fn() }));
vi.mock('../../services/wrappedCalculator', () => ({
  calculateWrappedStats: calc.calculateWrappedStats,
}));

const wa = vi.hoisted(() => ({
  getEventsForYear: vi.fn(),
  getBingeSessionsForYear: vi.fn(),
}));
vi.mock('../../services/watchActivityService', () => ({
  WatchActivityService: {
    getEventsForYear: wa.getEventsForYear,
    getBingeSessionsForYear: wa.getBingeSessionsForYear,
  },
}));

import { useWrappedData } from './useWrappedData';

const statsFixture = (): WrappedStats =>
  ({
    year: 2025,
    totalEpisodesWatched: 100,
    totalMoviesWatched: 10,
    totalHoursWatched: 42,
    topSeries: [],
    topMovies: [],
    achievements: [{ unlocked: true }, { unlocked: false }],
  }) as unknown as WrappedStats;

beforeEach(() => {
  router.navigate.mockClear();
  router.params = {};
  authState.user = null;
  cfg.value = { enabled: true, year: 2025, loading: false };
  calc.calculateWrappedStats.mockReset().mockReturnValue(statsFixture());
  wa.getEventsForYear.mockReset().mockResolvedValue([{ ts: 1 }]);
  wa.getBingeSessionsForYear.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
});

describe('useWrappedData', () => {
  it('setzt einen Fehler wenn kein User eingeloggt ist', async () => {
    authState.user = null;
    const { result } = renderHook(() => useWrappedData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/melde dich an/i);
    expect(result.current.stats).toBeNull();
  });

  it('lädt Stats für den eingeloggten User', async () => {
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useWrappedData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).not.toBeNull();
    expect(result.current.error).toBeNull();
    expect(wa.getEventsForYear).toHaveBeenCalledWith('u1', 2025);
  });

  it('setzt einen Fehler wenn keine Events für das Jahr existieren', async () => {
    authState.user = { uid: 'u1' };
    wa.getEventsForYear.mockResolvedValue([]);
    const { result } = renderHook(() => useWrappedData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/Keine Daten/i);
    expect(calc.calculateWrappedStats).not.toHaveBeenCalled();
  });

  it('leitet das Jahr aus dem URL-Parameter ab', async () => {
    authState.user = { uid: 'u1' };
    router.params = { year: '2024' };
    const { result } = renderHook(() => useWrappedData());
    expect(result.current.year).toBe(2024);
    await waitFor(() => expect(wa.getEventsForYear).toHaveBeenCalledWith('u1', 2024));
  });

  it('liefert nur aktivierte Slides, nach order sortiert', () => {
    const { result } = renderHook(() => useWrappedData());
    const slides = result.current.enabledSlides;
    expect(slides.length).toBeGreaterThan(0);
    expect(slides.every((s) => s.enabled)).toBe(true);
    for (let i = 1; i < slides.length; i++) {
      expect(slides[i].order).toBeGreaterThanOrEqual(slides[i - 1].order);
    }
  });

  it('navigiert vorwärts/rückwärts durch die Slides innerhalb der Grenzen', () => {
    const { result } = renderHook(() => useWrappedData());
    expect(result.current.currentSlide).toBe(0);
    // rückwärts an Grenze 0 → bleibt 0
    act(() => result.current.prevSlide());
    expect(result.current.currentSlide).toBe(0);
    act(() => result.current.nextSlide());
    expect(result.current.currentSlide).toBe(1);
  });

  it('Escape-Taste navigiert zurück', () => {
    renderHook(() => useWrappedData());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(router.navigate).toHaveBeenCalledWith(-1);
  });

  it('handleShare kopiert Text in die Zwischenablage wenn navigator.share fehlt', async () => {
    authState.user = { uid: 'u1' };
    const writeText = vi.fn((_text?: string) => Promise.resolve());
    vi.stubGlobal('navigator', {
      ...navigator,
      share: undefined,
      clipboard: { writeText },
    });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useWrappedData());
    await waitFor(() => expect(result.current.stats).not.toBeNull());
    await act(async () => {
      await result.current.handleShare();
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('100 Episoden');
    alertSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
