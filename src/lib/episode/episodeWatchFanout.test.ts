import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runEpisodeWatchFanout, type EpisodeWatchFanoutParams } from './episodeWatchFanout';

const mocks = vi.hoisted(() => ({
  watchedSeriesWithGenreAllPets: vi.fn(async () => {}),
  updateEpisodeCounters: vi.fn(async () => {}),
  logEpisodeWatch: vi.fn(() => undefined),
}));

vi.mock('../../services/petService', () => ({
  petService: { watchedSeriesWithGenreAllPets: mocks.watchedSeriesWithGenreAllPets },
}));

vi.mock('../../services/watchActivityService', () => ({
  WatchActivityService: { logEpisodeWatch: mocks.logEpisodeWatch },
}));

vi.mock('../../features/badges/minimalActivityLogger', () => ({
  updateEpisodeCounters: mocks.updateEpisodeCounters,
}));

const params = (o: Partial<EpisodeWatchFanoutParams> = {}): EpisodeWatchFanoutParams => ({
  userId: 'uid1',
  seriesId: 1396,
  seriesTitle: 'Breaking Bad',
  seasonNumber: 2,
  episodeNumber: 5,
  runtimeMinutes: 47,
  isRewatch: false,
  genres: ['Drama', 'Crime'],
  providers: ['Netflix'],
  episodeAirDate: '2020-01-01',
  ...o,
});

describe('runEpisodeWatchFanout', () => {
  beforeEach(() => {
    mocks.watchedSeriesWithGenreAllPets.mockClear();
    mocks.updateEpisodeCounters.mockClear();
    mocks.logEpisodeWatch.mockClear();
    mocks.watchedSeriesWithGenreAllPets.mockResolvedValue(undefined);
    mocks.updateEpisodeCounters.mockResolvedValue(undefined);
  });

  it('feuert per Default alle drei Subsysteme (Pet, Badge, Wrapped)', async () => {
    await runEpisodeWatchFanout(params());
    expect(mocks.watchedSeriesWithGenreAllPets).toHaveBeenCalledTimes(1);
    expect(mocks.updateEpisodeCounters).toHaveBeenCalledTimes(1);
    expect(mocks.logEpisodeWatch).toHaveBeenCalledTimes(1);
  });

  it('reicht Genres an den Pet-Service durch', async () => {
    await runEpisodeWatchFanout(params({ genres: ['Comedy'] }));
    expect(mocks.watchedSeriesWithGenreAllPets).toHaveBeenCalledWith('uid1', ['Comedy']);
  });

  it('ersetzt fehlende Genres durch ein leeres Array (Pet-Service)', async () => {
    await runEpisodeWatchFanout(params({ genres: undefined }));
    expect(mocks.watchedSeriesWithGenreAllPets).toHaveBeenCalledWith('uid1', []);
  });

  it('ruft den Badge-Counter mit userId, isRewatch und airDate auf', async () => {
    await runEpisodeWatchFanout(params({ isRewatch: true, episodeAirDate: '2021-02-02' }));
    expect(mocks.updateEpisodeCounters).toHaveBeenCalledWith('uid1', true, '2021-02-02');
  });

  it('ruft das Wrapped-Event mit der vollständigen (1-basierten) Signatur auf', async () => {
    await runEpisodeWatchFanout(params());
    expect(mocks.logEpisodeWatch).toHaveBeenCalledWith(
      'uid1',
      1396,
      'Breaking Bad',
      2,
      5,
      47,
      false,
      ['Drama', 'Crime'],
      ['Netflix']
    );
  });

  it('petXp=false überspringt den Pet-Service', async () => {
    await runEpisodeWatchFanout(params({ petXp: false }));
    expect(mocks.watchedSeriesWithGenreAllPets).not.toHaveBeenCalled();
    expect(mocks.updateEpisodeCounters).toHaveBeenCalledTimes(1);
    expect(mocks.logEpisodeWatch).toHaveBeenCalledTimes(1);
  });

  it('badgeCounters=false überspringt den Badge-Counter', async () => {
    await runEpisodeWatchFanout(params({ badgeCounters: false }));
    expect(mocks.updateEpisodeCounters).not.toHaveBeenCalled();
    expect(mocks.watchedSeriesWithGenreAllPets).toHaveBeenCalledTimes(1);
  });

  it('wrappedEvent=false überspringt das Wrapped-Event', async () => {
    await runEpisodeWatchFanout(params({ wrappedEvent: false }));
    expect(mocks.logEpisodeWatch).not.toHaveBeenCalled();
    expect(mocks.watchedSeriesWithGenreAllPets).toHaveBeenCalledTimes(1);
  });

  it('propagiert Fehler aus dem Pet-Service (kein Schlucken)', async () => {
    mocks.watchedSeriesWithGenreAllPets.mockRejectedValueOnce(new Error('pet down'));
    await expect(runEpisodeWatchFanout(params())).rejects.toThrow('pet down');
    // Badge/Wrapped werden nach dem Pet-Fehler nicht mehr erreicht
    expect(mocks.updateEpisodeCounters).not.toHaveBeenCalled();
  });

  it('propagiert Fehler aus dem Badge-Counter', async () => {
    mocks.updateEpisodeCounters.mockRejectedValueOnce(new Error('badge down'));
    await expect(runEpisodeWatchFanout(params())).rejects.toThrow('badge down');
  });
});
