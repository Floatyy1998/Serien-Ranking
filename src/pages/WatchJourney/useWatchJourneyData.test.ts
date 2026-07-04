// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import type { MultiYearTrendsData, WatchJourneyData } from '../../services/watchJourneyService';

// --- react-router-dom mock --------------------------------------------------
const router = vi.hoisted(() => {
  const setSearchParams = vi.fn();
  const params = new URLSearchParams();
  return { setSearchParams, params };
});
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [router.params, router.setSearchParams] as const,
}));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const svc = vi.hoisted(() => ({
  calculateWatchJourney: vi.fn(),
  calculateMultiYearTrends: vi.fn(),
}));
vi.mock('../../services/watchJourneyService', () => ({
  calculateWatchJourney: svc.calculateWatchJourney,
  calculateMultiYearTrends: svc.calculateMultiYearTrends,
}));

import { useWatchJourneyData } from './useWatchJourneyData';

const journeyFixture = (o: Partial<WatchJourneyData> = {}): WatchJourneyData =>
  ({ totalEpisodes: 5, totalMovies: 2, ...o }) as WatchJourneyData;
const trendsFixture = (): MultiYearTrendsData => ({}) as MultiYearTrendsData;

beforeEach(() => {
  router.setSearchParams.mockClear();
  router.params = new URLSearchParams();
  authState.user = null;
  svc.calculateWatchJourney.mockReset();
  svc.calculateMultiYearTrends.mockReset();
  svc.calculateWatchJourney.mockResolvedValue(journeyFixture());
  svc.calculateMultiYearTrends.mockResolvedValue(trendsFixture());
});

afterEach(() => {
  cleanup();
});

describe('useWatchJourneyData', () => {
  it('startet im Loading-Zustand mit dem Default-Tab "trends"', () => {
    const { result } = renderHook(() => useWatchJourneyData());
    expect(result.current.loading).toBe(true);
    expect(result.current.activeTab).toBe('trends');
    expect(result.current.data).toBeNull();
  });

  it('liest einen gültigen Tab aus den URL-Parametern', () => {
    router.params = new URLSearchParams('tab=genre');
    const { result } = renderHook(() => useWatchJourneyData());
    expect(result.current.activeTab).toBe('genre');
  });

  it('ignoriert ungültige Tab-Parameter und fällt auf "trends" zurück', () => {
    router.params = new URLSearchParams('tab=bogus');
    const { result } = renderHook(() => useWatchJourneyData());
    expect(result.current.activeTab).toBe('trends');
  });

  it('lädt Daten wenn ein User vorhanden ist und beendet den Loading-Zustand', async () => {
    authState.user = { uid: 'u1' };
    const { result } = renderHook(() => useWatchJourneyData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.hasData).toBe(true);
    expect(svc.calculateWatchJourney).toHaveBeenCalledWith('u1', new Date().getFullYear());
  });

  it('hasData ist false wenn keine Episoden/Filme gesehen wurden', async () => {
    authState.user = { uid: 'u1' };
    svc.calculateWatchJourney.mockResolvedValue(
      journeyFixture({ totalEpisodes: 0, totalMovies: 0 })
    );
    const { result } = renderHook(() => useWatchJourneyData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasData).toBe(false);
  });

  it('lädt ohne User keine Daten', () => {
    authState.user = null;
    renderHook(() => useWatchJourneyData());
    expect(svc.calculateWatchJourney).not.toHaveBeenCalled();
  });

  it('synchronisiert den aktiven Tab mit den URL-Parametern', async () => {
    const { result } = renderHook(() => useWatchJourneyData());
    await waitFor(() => expect(router.setSearchParams).toHaveBeenCalled());
    router.setSearchParams.mockClear();
    act(() => {
      result.current.setActiveTab('heatmap');
    });
    expect(result.current.activeTab).toBe('heatmap');
    await waitFor(() =>
      expect(router.setSearchParams).toHaveBeenCalledWith({ tab: 'heatmap' }, { replace: true })
    );
  });

  it('selectYear setzt das Jahr und schließt den Year-Picker', () => {
    const { result } = renderHook(() => useWatchJourneyData());
    act(() => {
      result.current.toggleYearPicker();
    });
    expect(result.current.showYearPicker).toBe(true);
    act(() => {
      result.current.selectYear(2026);
    });
    expect(result.current.selectedYear).toBe(2026);
    expect(result.current.showYearPicker).toBe(false);
  });

  it('berechnet chartWidth aus der Fensterbreite', () => {
    const { result } = renderHook(() => useWatchJourneyData());
    expect(result.current.chartWidth).toBe(window.innerWidth - 40);
  });
});
