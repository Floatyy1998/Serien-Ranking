// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { noteRouteChange } from './useRatingsOrigin';

const fromReading = () => sessionStorage.getItem('ratingsFromReading');

afterEach(() => sessionStorage.clear());

describe('noteRouteChange', () => {
  it('merkt sich den Einstieg von einer Lese-Seite', () => {
    noteRouteChange('/reading', '/ratings');
    expect(fromReading()).toBe('1');
  });

  it('vergisst ihn beim Einstieg von woanders', () => {
    noteRouteChange('/reading', '/ratings');
    noteRouteChange('/', '/ratings');
    expect(fromReading()).toBe('0');
  });

  it('lässt die Herkunft bei der Rückkehr von einer Detailseite stehen', () => {
    noteRouteChange('/reading', '/ratings');
    noteRouteChange('/series/42', '/ratings');
    noteRouteChange('/books/gb-1', '/ratings');
    expect(fromReading()).toBe('1');
  });

  it('ignoriert andere Ziele', () => {
    noteRouteChange('/reading', '/stats');
    expect(fromReading()).toBeNull();
  });
});
