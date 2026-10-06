import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbGet = vi.hoisted(() => vi.fn());
vi.mock('../db/ref', () => ({ dbGet }));

async function load() {
  return import('./publicDirectoryService');
}

beforeEach(() => {
  vi.resetModules();
  dbGet.mockReset();
});

describe('fetchPublicDirectory', () => {
  it('liest die Einträge und verwirft unvollständige', async () => {
    dbGet.mockResolvedValue({
      updatedAt: 1,
      entries: [
        {
          uid: 'u1',
          publicId: 'p1',
          displayName: ' Bärbel ',
          username: 'baerbel',
          photoURL: '',
          series: 12.4,
          movies: -3,
          watchtimeMinutes: 900,
        },
        { uid: 'u2' },
        null,
      ],
    });
    const { fetchPublicDirectory } = await load();

    expect(await fetchPublicDirectory()).toEqual([
      {
        uid: 'u1',
        publicId: 'p1',
        displayName: 'Bärbel',
        username: 'baerbel',
        photoURL: null,
        series: 12,
        movies: 0,
        watchtimeMinutes: 900,
      },
    ]);
    expect(dbGet).toHaveBeenCalledWith('publicProfileDirectory');
  });

  it('akzeptiert Einträge als Objekt (RTDB-Array mit Lücken)', async () => {
    dbGet.mockResolvedValue({ entries: { 0: { uid: 'a', publicId: 'pa', username: 'anna' } } });
    const { fetchPublicDirectory } = await load();
    const [entry] = await fetchPublicDirectory();
    expect(entry?.displayName).toBe('anna');
  });

  it('cached den Snapshot, force lädt neu', async () => {
    dbGet.mockResolvedValue(null);
    const { fetchPublicDirectory } = await load();
    expect(await fetchPublicDirectory()).toEqual([]);
    await fetchPublicDirectory();
    expect(dbGet).toHaveBeenCalledTimes(1);
    await fetchPublicDirectory(true);
    expect(dbGet).toHaveBeenCalledTimes(2);
  });
});
