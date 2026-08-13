// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { readSeenTours, resetSeenTours, writeSeenTours } from './pageTour';

const STORAGE_KEY = 'pageToursSeen';

beforeEach(() => localStorage.clear());

describe('readSeenTours', () => {
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

describe('writeSeenTours / resetSeenTours', () => {
  it('schreibt und liest denselben Zustand', () => {
    writeSeenTours({ '/': 1, '/series/:id': 3 });
    expect(readSeenTours()).toEqual({ '/': 1, '/series/:id': 3 });
  });

  it('macht mit dem Zurücksetzen alle Hilfen wieder fällig', () => {
    writeSeenTours({ '/': 1 });
    resetSeenTours();
    expect(readSeenTours()).toEqual({});
  });
});
