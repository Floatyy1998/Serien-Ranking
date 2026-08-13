import { describe, expect, it } from 'vitest';
import { findTour, isTourPending, markTourSeen, matchesPath, type PageTour } from './pageTour';

const tour = (path: string, version = 1): PageTour => ({
  path,
  version,
  title: 'Titel',
  intro: 'Intro',
  actions: [{ icon: 'check', title: 'Aktion', text: 'Text' }],
});

describe('matchesPath', () => {
  it('trifft einen exakten Pfad', () => {
    expect(matchesPath('/calendar', '/calendar')).toBe(true);
  });

  it('behandelt führende und doppelte Schrägstriche gleich', () => {
    expect(matchesPath('/calendar', '/calendar/')).toBe(true);
  });

  it('lässt :param auf ein Segment passen', () => {
    expect(matchesPath('/series/:id', '/series/1396')).toBe(true);
  });

  it('greift nicht über Segmentgrenzen hinweg', () => {
    expect(matchesPath('/series/:id', '/series/1396/season/2')).toBe(false);
    expect(matchesPath('/series/:id', '/series')).toBe(false);
  });

  it('trennt die Wurzel von allem anderen', () => {
    expect(matchesPath('/', '/')).toBe(true);
    expect(matchesPath('/', '/calendar')).toBe(false);
  });
});

describe('findTour', () => {
  const tours = [tour('/'), tour('/manga/search'), tour('/manga/:id'), tour('/series/:id')];

  it('findet die Hilfe zur Wurzel', () => {
    expect(findTour(tours, '/')?.path).toBe('/');
  });

  it('bevorzugt den exakten Treffer vor dem Muster', () => {
    expect(findTour(tours, '/manga/search')?.path).toBe('/manga/search');
  });

  it('fällt auf das Muster zurück', () => {
    expect(findTour(tours, '/manga/4242')?.path).toBe('/manga/:id');
  });

  it('gibt null zurück, wo es keine Hilfe gibt', () => {
    expect(findTour(tours, '/settings')).toBeNull();
  });
});

describe('gesehen-Zustand', () => {
  it('steht bei unbekannter Seite noch aus', () => {
    expect(isTourPending({}, tour('/calendar'))).toBe(true);
  });

  it('steht nach dem Sehen nicht mehr aus', () => {
    const seen = markTourSeen({}, tour('/calendar'));
    expect(isTourPending(seen, tour('/calendar'))).toBe(false);
  });

  it('steht bei erhöhter Version wieder aus', () => {
    const seen = markTourSeen({}, tour('/calendar', 1));
    expect(isTourPending(seen, tour('/calendar', 2))).toBe(true);
  });

  it('lässt andere Seiten unberührt', () => {
    const seen = markTourSeen({ '/search': 3 }, tour('/calendar'));
    expect(seen).toEqual({ '/search': 3, '/calendar': 1 });
  });
});
