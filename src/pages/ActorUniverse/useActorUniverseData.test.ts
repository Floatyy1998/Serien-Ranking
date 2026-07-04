// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActorConnection, ActorUniverseData } from '../../hooks/useActorUniverse';

const universe = vi.hoisted(() => ({
  value: {} as ActorUniverseData,
  lastArg: undefined as boolean | undefined,
}));

vi.mock('../../hooks/useActorUniverse', () => ({
  useActorUniverse: (hide: boolean) => {
    universe.lastArg = hide;
    return universe.value;
  },
}));

import { useActorUniverseData } from './useActorUniverseData';

function conn(a: number, b: number): ActorConnection {
  return { actor1Id: a, actor2Id: b, sharedSeries: [], strength: 1 };
}

beforeEach(() => {
  localStorage.clear();
  universe.lastArg = undefined;
  universe.value = {
    actors: [],
    connections: [conn(1, 2), conn(3, 4), conn(1, 5)],
    topActors: [],
    recommendations: [],
    stats: { totalActors: 3, actorsInMultipleSeries: 1, mostConnectedPair: null },
    loading: false,
    progress: 100,
    loadingRecommendations: false,
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useActorUniverseData', () => {
  it('liest hideVoiceActors initial aus localStorage und reicht es weiter', () => {
    localStorage.setItem('actorUniverse_hideVoiceActors', 'true');
    const { result } = renderHook(() => useActorUniverseData());
    expect(result.current.hideVoiceActors).toBe(true);
    expect(universe.lastArg).toBe(true);
  });

  it('toggelt und persistiert die Voice-Actor-Einstellung', () => {
    const { result } = renderHook(() => useActorUniverseData());
    expect(result.current.hideVoiceActors).toBe(false);
    act(() => result.current.toggleVoiceActors());
    expect(result.current.hideVoiceActors).toBe(true);
    expect(localStorage.getItem('actorUniverse_hideVoiceActors')).toBe('true');
  });

  it('filtert Verbindungen eines Actors', () => {
    const { result } = renderHook(() => useActorUniverseData());
    const forActor1 = result.current.getActorConnections(1);
    expect(forActor1).toHaveLength(2);
    expect(result.current.getActorConnections(3)).toHaveLength(1);
    expect(result.current.getActorConnections(99)).toHaveLength(0);
  });

  it('reicht die Universe-Daten durch und hält Selection/Tab-State', () => {
    const { result } = renderHook(() => useActorUniverseData());
    expect(result.current.stats.totalActors).toBe(3);
    expect(result.current.progress).toBe(100);
    expect(result.current.activeTab).toBe('recommendations');
    act(() => result.current.setActiveTab('map'));
    expect(result.current.activeTab).toBe('map');
    act(() => result.current.setSelectedActor({ id: 7 } as never));
    expect(result.current.selectedActor?.id).toBe(7);
  });
});
