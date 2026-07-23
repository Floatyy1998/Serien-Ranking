/**
 * Tests für die Watch-Activity-Kern-API (logEpisodeWatch / logMovieWatch).
 *
 * Die Nachbar-Systeme (Binge, Streak, Leaderboard, Pet-Reaktion, Activity-Feed,
 * Bulk-Marking) sind gemockt, damit die Verzweigungen des Cores gezielt
 * ansteuerbar sind. Firebase bleibt als In-Memory-Baum echt an saveEvent gekoppelt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const root: Record<string, unknown> = {};
  const seg = (p: string) => p.split('/').filter(Boolean);
  const getAt = (p: string): unknown => {
    let cur: unknown = root;
    for (const k of seg(p)) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = (cur as Record<string, unknown>)[k];
    }
    return cur === undefined ? null : cur;
  };
  const setAt = (p: string, v: unknown) => {
    const ks = seg(p);
    let cur = root as Record<string, unknown>;
    for (let i = 0; i < ks.length - 1; i++) {
      if (typeof cur[ks[i]] !== 'object' || cur[ks[i]] === null) cur[ks[i]] = {};
      cur = cur[ks[i]] as Record<string, unknown>;
    }
    cur[ks[ks.length - 1]] = v;
  };
  const makeRef = (path: string, filter?: { child: string; value: unknown }) => ({
    async once(_e?: string) {
      let val = getAt(path);
      if (filter && val && typeof val === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
          if (
            v &&
            typeof v === 'object' &&
            (v as Record<string, unknown>)[filter.child] === filter.value
          ) {
            out[k] = v;
          }
        }
        val = Object.keys(out).length ? out : null;
      }
      return { val: () => val };
    },
    async set(v: unknown) {
      setAt(path, v);
    },
    orderByChild(child: string) {
      return { equalTo: (value: unknown) => makeRef(path, { child, value }) };
    },
  });
  return {
    getAt,
    setAt,
    makeRef,
    reset() {
      for (const k of Object.keys(root)) delete root[k];
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

// Nachbar-Systeme als gesteuerte Mocks (vi.hoisted, da vi.mock nach oben gehoben wird).
const mocks = vi.hoisted(() => ({
  checkBulkMarkingAndGetTimestamp: vi.fn<() => { isBulkMarking: boolean; distributedDate?: Date }>(
    () => ({ isBulkMarking: false })
  ),
  checkMovieBulkMarking: vi.fn<() => { isBulkMarking: boolean; distributedDate?: Date }>(() => ({
    isBulkMarking: false,
  })),
  getActiveBingeSession: vi.fn(),
  updateBingeSession: vi.fn(),
  updateWatchStreak: vi.fn(async () => {}),
  updateLeaderboardStats: vi.fn(async () => {}),
  triggerPetReaction: vi.fn(),
  logEpisodeWatchedActivity: vi.fn(async () => {}),
}));
const {
  checkBulkMarkingAndGetTimestamp,
  getActiveBingeSession,
  updateBingeSession,
  updateWatchStreak,
  updateLeaderboardStats,
  triggerPetReaction,
  logEpisodeWatchedActivity,
} = mocks;

vi.mock('./bulkMarkingDetection', () => ({
  checkBulkMarkingAndGetTimestamp: mocks.checkBulkMarkingAndGetTimestamp,
  checkMovieBulkMarking: mocks.checkMovieBulkMarking,
}));
vi.mock('./bingeSessionTracking', () => ({
  getActiveBingeSession: mocks.getActiveBingeSession,
  updateBingeSession: mocks.updateBingeSession,
}));
vi.mock('./watchStreakTracking', () => ({ updateWatchStreak: mocks.updateWatchStreak }));
vi.mock('../leaderboardService', () => ({ updateLeaderboardStats: mocks.updateLeaderboardStats }));
vi.mock('../../hooks/usePetReactions', () => ({ triggerPetReaction: mocks.triggerPetReaction }));
vi.mock('../../lib/episode/seriesMetrics', () => ({ DEFAULT_EPISODE_RUNTIME_MINUTES: 45 }));
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logEpisodeWatchedActivity: mocks.logEpisodeWatchedActivity,
}));

import { logEpisodeWatch, logMovieWatch } from './watchActivityCore';

const YEAR = new Date().getFullYear();
const EVENTS = `users/u/wrapped/${YEAR}/events`;
const tick = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  fb.reset();
  vi.clearAllMocks();
  checkBulkMarkingAndGetTimestamp.mockReturnValue({ isBulkMarking: false });
  mocks.checkMovieBulkMarking.mockReturnValue({ isBulkMarking: false });
  updateBingeSession.mockResolvedValue('binge-1');
  getActiveBingeSession.mockResolvedValue({ episodes: [{}], isActive: true });
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const firstSaved = () => {
  const events = fb.getAt(EVENTS) as Record<string, Record<string, unknown>> | null;
  return events ? Object.values(events)[0] : null;
};

describe('logEpisodeWatch', () => {
  it('Standardfall: speichert Event, meldet Leaderboard, feuert Cheer und loggt Feed-Aktivität', async () => {
    await logEpisodeWatch('u', 1, 'Dark', 1, 1, 50, false, ['Drama'], ['Netflix']);
    await tick();

    const saved = firstSaved();
    expect(saved?.t).toBe('ep');
    expect(saved?.s).toBe(1);
    expect(updateWatchStreak).toHaveBeenCalledWith('u');
    expect(updateLeaderboardStats).toHaveBeenCalledWith('u', {
      episodesWatched: 1,
      watchtimeMinutes: 50,
    });
    expect(triggerPetReaction).toHaveBeenCalledWith({ tone: 'cheer' });
    expect(logEpisodeWatchedActivity).toHaveBeenCalledWith('u', 'Dark', 1, 1, 1);
  });

  it('nutzt die Default-Laufzeit 45, wenn keine übergeben wird', async () => {
    await logEpisodeWatch('u', 1, 'Dark', 1, 1);
    expect(updateLeaderboardStats).toHaveBeenCalledWith('u', {
      episodesWatched: 1,
      watchtimeMinutes: 45,
    });
  });

  it('Rewatch: Pet-Ton "rewatch" und KEIN Feed-Log', async () => {
    await logEpisodeWatch('u', 1, 'Dark', 1, 1, 50, true);
    await tick();
    expect(triggerPetReaction).toHaveBeenCalledWith({ tone: 'rewatch' });
    expect(logEpisodeWatchedActivity).not.toHaveBeenCalled();
  });

  it('Binge (aktive Session > 1 Episode): Pet-Ton "binge" und Event trägt bs/bid', async () => {
    getActiveBingeSession.mockResolvedValue({ episodes: [{}, {}], isActive: true });
    await logEpisodeWatch('u', 1, 'Dark', 1, 2, 50);
    await tick();
    expect(triggerPetReaction).toHaveBeenCalledWith({ tone: 'binge' });
    const saved = firstSaved();
    expect(saved?.bs).toBe(1);
    expect(saved?.bid).toBe('binge-1');
  });

  it('Bulk-Marking: überspringt Binge, Pet, Feed und Leaderboard – speichert aber Event und Streak', async () => {
    checkBulkMarkingAndGetTimestamp.mockReturnValue({
      isBulkMarking: true,
      distributedDate: new Date(),
    });
    await logEpisodeWatch('u', 1, 'Dark', 1, 1, 50);
    await tick();

    expect(updateBingeSession).not.toHaveBeenCalled();
    expect(triggerPetReaction).not.toHaveBeenCalled();
    expect(logEpisodeWatchedActivity).not.toHaveBeenCalled();
    expect(firstSaved()?.t).toBe('ep');
    expect(updateWatchStreak).toHaveBeenCalled();
    // Nachtragen alter Folgen zählt nicht für die Rangliste
    expect(updateLeaderboardStats).not.toHaveBeenCalled();
  });

  it('reicht Genres und Provider ins Event durch', async () => {
    await logEpisodeWatch('u', 1, 'Dark', 1, 1, 50, false, ['Drama', 'Sci-Fi'], ['Netflix', 'WOW']);
    const saved = firstSaved();
    expect(saved?.g).toEqual(['Drama', 'Sci-Fi']);
    expect(saved?.p).toEqual(['Netflix', 'WOW']);
  });
});

describe('logMovieWatch', () => {
  it('Neuer Film: speichert Event, meldet Leaderboard und feuert Pet-Ton "movie"', async () => {
    await logMovieWatch('u', 100, 'Inception', 148, undefined, ['Drama'], ['Netflix']);
    const saved = firstSaved();
    expect(saved?.t).toBe('mv');
    expect(saved?.s).toBe(100);
    expect(updateLeaderboardStats).toHaveBeenCalledWith('u', {
      moviesWatched: 1,
      watchtimeMinutes: 148,
    });
    expect(triggerPetReaction).toHaveBeenCalledWith({ tone: 'movie' });
  });

  it('Film mit Rating: Pet-Ton "rated" und rat im Event', async () => {
    await logMovieWatch('u', 101, 'Dune', 155, 9);
    const saved = firstSaved();
    expect(saved?.rat).toBe(9);
    expect(triggerPetReaction).toHaveBeenCalledWith({ tone: 'rated' });
  });

  it('nutzt die Default-Laufzeit 120, wenn keine übergeben wird', async () => {
    await logMovieWatch('u', 102, 'X');
    expect(updateLeaderboardStats).toHaveBeenCalledWith('u', {
      moviesWatched: 1,
      watchtimeMinutes: 120,
    });
  });

  it('Bulk-Marking: überspringt Leaderboard und Pet – speichert aber Event und Streak', async () => {
    mocks.checkMovieBulkMarking.mockReturnValue({
      isBulkMarking: true,
      distributedDate: new Date(),
    });
    await logMovieWatch('u', 103, 'Bulk Movie', 100);
    expect(firstSaved()?.t).toBe('mv');
    expect(updateWatchStreak).toHaveBeenCalled();
    expect(updateLeaderboardStats).not.toHaveBeenCalled();
    expect(triggerPetReaction).not.toHaveBeenCalled();
  });

  it('Duplikat: aktualisiert nur das Rating des bestehenden Events, ohne neues Event/Pet', async () => {
    fb.setAt(`${EVENTS}/legacy1`, {
      timestamp: new Date().toISOString(),
      type: 'movie_watch',
      movieId: 100,
    });
    await logMovieWatch('u', 100, 'Inception', 148, 7);

    expect(fb.getAt(`${EVENTS}/legacy1/rating`)).toBe(7);
    const events = fb.getAt(EVENTS) as Record<string, unknown>;
    expect(Object.keys(events)).toEqual(['legacy1']); // kein zweites Event
    expect(triggerPetReaction).not.toHaveBeenCalled();
  });

  it('Duplikat (Compact-Format): dedupt gegen {t:"mv", s} und patcht rat statt zu duplizieren', async () => {
    // Regressionsschutz: Events werden compact gespeichert (t/s), die frühere
    // Dedupe-Query orderByChild('movieId') traf das nie → jedes Re-Log duplizierte.
    fb.setAt(`${EVENTS}/compact1`, { ts: Math.floor(Date.now() / 1000), t: 'mv', s: 100 });
    await logMovieWatch('u', 100, 'Inception', 148, 8);

    expect(fb.getAt(`${EVENTS}/compact1/rat`)).toBe(8); // Compact patcht `rat`, nicht `rating`
    const events = fb.getAt(EVENTS) as Record<string, unknown>;
    expect(Object.keys(events)).toEqual(['compact1']); // kein zweites Event
    expect(triggerPetReaction).not.toHaveBeenCalled();
  });
});
