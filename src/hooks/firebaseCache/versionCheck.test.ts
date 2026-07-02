import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const values = new Map<string, unknown>();
  const onceMock = vi.fn(async (path: string) => ({ val: () => values.get(path) ?? null }));
  return { values, onceMock };
});

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: (path: string) => ({
        once: () => fb.onceMock(path),
      }),
    }),
  },
}));

vi.mock('../../services/offlineFirebaseService', () => ({
  offlineFirebaseService: {
    getCacheVersion: vi.fn(async () => 42),
  },
}));

import { offlineFirebaseService } from '../../services/offlineFirebaseService';
import {
  fetchRemoteVersion,
  fetchVersionPair,
  normalizeVersion,
  versionsMatch,
} from './versionCheck';

describe('versionsMatch', () => {
  it('true wenn beide Versionen vorhanden und gleich', () => {
    expect(versionsMatch(42, 42)).toBe(true);
  });

  it('true auch bei Version 0 === 0 (0 ist eine valide Version)', () => {
    expect(versionsMatch(0, 0)).toBe(true);
  });

  it('false wenn Remote-Version fehlt', () => {
    expect(versionsMatch(null, 42)).toBe(false);
  });

  it('false wenn Cache-Version fehlt', () => {
    expect(versionsMatch(42, null)).toBe(false);
  });

  it('false wenn beide fehlen (kein Skip ohne Versionen)', () => {
    expect(versionsMatch(null, null)).toBe(false);
  });

  it('false bei unterschiedlichen Versionen', () => {
    expect(versionsMatch(42, 43)).toBe(false);
  });
});

describe('normalizeVersion', () => {
  it('null → undefined', () => {
    expect(normalizeVersion(null)).toBeUndefined();
  });

  it('undefined → undefined', () => {
    expect(normalizeVersion(undefined)).toBeUndefined();
  });

  it('Zahl bleibt erhalten (auch 0)', () => {
    expect(normalizeVersion(7)).toBe(7);
    expect(normalizeVersion(0)).toBe(0);
  });
});

describe('fetchRemoteVersion', () => {
  beforeEach(() => {
    fb.values.clear();
    fb.onceMock.mockClear();
  });

  it('liest den Versionszähler vom versionPath', async () => {
    fb.values.set('users/u1/meta/serienVersion', 1234);
    await expect(fetchRemoteVersion('users/u1/meta/serienVersion')).resolves.toBe(1234);
  });

  it('nicht vorhandene Version → undefined', async () => {
    await expect(fetchRemoteVersion('users/u1/meta/serienVersion')).resolves.toBeUndefined();
  });
});

describe('fetchVersionPair', () => {
  beforeEach(() => {
    fb.values.clear();
    fb.onceMock.mockClear();
    vi.mocked(offlineFirebaseService.getCacheVersion).mockClear();
    vi.mocked(offlineFirebaseService.getCacheVersion).mockResolvedValue(42);
  });

  it('liest Remote- und Cache-Version parallel', async () => {
    fb.values.set('users/u1/meta/serienVersion', 42);
    const result = await fetchVersionPair('users/u1/meta/serienVersion', 'users/u1/seriesWatch');
    expect(result).toEqual({ remoteVersion: 42, cachedVersion: 42 });
    expect(offlineFirebaseService.getCacheVersion).toHaveBeenCalledWith('users/u1/seriesWatch');
  });

  it('fehlende Remote-Version → null (Firebase-Konvention)', async () => {
    const result = await fetchVersionPair('users/u1/meta/serienVersion', 'users/u1/seriesWatch');
    expect(result.remoteVersion).toBeNull();
  });

  it('propagiert Firebase-Fehler (Aufrufer macht dann Full-Load)', async () => {
    fb.onceMock.mockRejectedValueOnce(new Error('boom'));
    await expect(
      fetchVersionPair('users/u1/meta/serienVersion', 'users/u1/seriesWatch')
    ).rejects.toThrow('boom');
  });
});
