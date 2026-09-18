import { describe, expect, it } from 'vitest';
import { autoUnhideUpdates, shouldAutoUnhide } from './autoUnhide';

const series = (o: Record<string, unknown>) => o as never;

describe('shouldAutoUnhide', () => {
  it('false für null/undefined', () => {
    expect(shouldAutoUnhide(null)).toBe(false);
    expect(shouldAutoUnhide(undefined)).toBe(false);
  });

  it('false wenn die Serie sichtbar ist', () => {
    expect(shouldAutoUnhide(series({ id: 1 }))).toBe(false);
    expect(shouldAutoUnhide(series({ id: 1, hidden: false }))).toBe(false);
  });

  it('true nur bei hidden === true', () => {
    expect(shouldAutoUnhide(series({ id: 1, hidden: true }))).toBe(true);
  });
});

describe('autoUnhideUpdates', () => {
  it('gibt leeres Objekt zurück, wenn nichts einzublenden ist', () => {
    expect(autoUnhideUpdates('uid1', null)).toEqual({});
    expect(autoUnhideUpdates('uid1', series({ id: 5 }))).toEqual({});
  });

  it('löscht das hidden-Flag über die Pfad-Map', () => {
    expect(autoUnhideUpdates('uidX', series({ id: 42, hidden: true }))).toEqual({
      'users/uidX/series/42/hidden': null,
    });
  });
});
