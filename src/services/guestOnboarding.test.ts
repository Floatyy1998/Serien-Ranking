// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addGuestPick,
  clearGuestPicks,
  getGuestPicks,
  hasGuestPicks,
  removeGuestPick,
  type GuestPick,
} from './guestOnboarding';

const series = (id: number): GuestPick => ({
  id,
  type: 'series',
  title: `Serie ${id}`,
  poster_path: `/p${id}.jpg`,
  vote_average: 8,
});

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('guestOnboarding', () => {
  it('startet leer', () => {
    expect(getGuestPicks()).toEqual([]);
    expect(hasGuestPicks()).toBe(false);
  });

  it('fügt Picks hinzu und ist idempotent nach type+id', () => {
    addGuestPick(series(1));
    addGuestPick(series(1));
    addGuestPick({ ...series(1), type: 'movie' });
    const picks = getGuestPicks();
    expect(picks).toHaveLength(2);
    expect(hasGuestPicks()).toBe(true);
  });

  it('entfernt nur den passenden type+id', () => {
    addGuestPick(series(1));
    addGuestPick(series(2));
    removeGuestPick('series', 1);
    expect(getGuestPicks().map((p) => p.id)).toEqual([2]);
  });

  it('begrenzt auf maximal 40 Picks', () => {
    for (let i = 0; i < 60; i++) addGuestPick(series(i));
    expect(getGuestPicks()).toHaveLength(40);
  });

  it('clear leert den Speicher', () => {
    addGuestPick(series(1));
    clearGuestPicks();
    expect(getGuestPicks()).toEqual([]);
  });

  it('übersteht kaputtes localStorage-JSON', () => {
    localStorage.setItem('guestOnboardingV2', '{nicht json');
    expect(getGuestPicks()).toEqual([]);
  });
});
