// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { dbGetMock, setMock, removeMock, dbRefMock } = vi.hoisted(() => {
  const setMock = vi.fn(() => Promise.resolve());
  const removeMock = vi.fn(() => Promise.resolve());
  return {
    dbGetMock: vi.fn(() => Promise.resolve(null as unknown)),
    setMock,
    removeMock,
    dbRefMock: vi.fn(() => ({ set: setMock, remove: removeMock })),
  };
});

vi.mock('./db/ref', () => ({
  dbGet: dbGetMock,
  dbRef: dbRefMock,
  userPath: (uid: string, ...segments: string[]) => `users/${uid}/${segments.join('/')}`,
}));

import { loadSeenTours, readSeenTours, resetSeenTours, writeSeenTours } from './pageTour';

const STORAGE_KEY = 'pageToursSeen';

beforeEach(() => {
  localStorage.clear();
  dbGetMock.mockClear();
  dbGetMock.mockResolvedValue(null);
  setMock.mockClear();
  removeMock.mockClear();
  dbRefMock.mockClear();
});

afterEach(() => vi.restoreAllMocks());

describe('readSeenTours — der sofort verfügbare Spiegel', () => {
  it('liefert ohne Eintrag ein leeres Objekt', () => {
    expect(readSeenTours()).toEqual({});
  });

  it('liest gespeicherte Versionen', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '/calendar': 2 }));
    expect(readSeenTours()).toEqual({ '/calendar': 2 });
  });

  it('verwirft kaputtes JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'kein json');
    expect(readSeenTours()).toEqual({});
  });

  it('verwirft Nicht-Objekte', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['/calendar']));
    expect(readSeenTours()).toEqual({});
  });

  it('lässt Einträge ohne Zahlenwert fallen', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '/calendar': 2, '/search': 'ja' }));
    expect(readSeenTours()).toEqual({ '/calendar': 2 });
  });
});

describe('loadSeenTours — Stand vom Konto', () => {
  it('fragt den Knoten des Nutzers ab', async () => {
    await loadSeenTours('u1');
    expect(dbGetMock).toHaveBeenCalledWith('users/u1/pageToursSeen');
  });

  it('übernimmt, was auf einem anderen Gerät gesehen wurde', async () => {
    dbGetMock.mockResolvedValue({ _calendar: 1 });
    const seen = await loadSeenTours('u1');
    expect(seen).toEqual({ _calendar: 1 });
  });

  it('lässt die höhere Version gewinnen', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '/calendar': 1 }));
    dbGetMock.mockResolvedValue({ _calendar: 3 });

    const seen = await loadSeenTours('u1');

    expect(seen['/calendar']).toBe(3);
  });

  it('dreht einen neueren lokalen Stand nicht zurück', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '/calendar': 5 }));
    dbGetMock.mockResolvedValue({ _calendar: 2 });

    const seen = await loadSeenTours('u1');

    expect(seen['/calendar']).toBe(5);
  });

  it('fällt offline auf den lokalen Stand zurück', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '/': 1 }));
    dbGetMock.mockRejectedValue(new Error('offline'));

    await expect(loadSeenTours('u1')).resolves.toEqual({ '/': 1 });
  });
});

describe('writeSeenTours', () => {
  it('schreibt lokal und ans Konto', () => {
    writeSeenTours({ '/': 1 }, 'u1');

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual({ '/': 1 });
    expect(dbRefMock).toHaveBeenCalledWith('users/u1/pageToursSeen');
    expect(setMock).toHaveBeenCalledWith({ _: 1 });
  });

  it('ersetzt Zeichen, die RTDB in Schlüsseln verbietet', () => {
    writeSeenTours({ '/series/:id': 2 }, 'u1');
    expect(setMock).toHaveBeenCalledWith({ _series__id: 2 });
  });

  it('schreibt ohne uid nur lokal', () => {
    writeSeenTours({ '/': 1 });
    expect(setMock).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual({ '/': 1 });
  });
});

describe('resetSeenTours', () => {
  it('räumt lokal und am Konto auf', () => {
    writeSeenTours({ '/': 1 }, 'u1');
    resetSeenTours('u1');

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(removeMock).toHaveBeenCalledTimes(1);
  });

  it('räumt ohne uid nur lokal auf', () => {
    writeSeenTours({ '/': 1 });
    resetSeenTours();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(removeMock).not.toHaveBeenCalled();
  });
});
