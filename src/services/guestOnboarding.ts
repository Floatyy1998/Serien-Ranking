/**
 * Zwischenspeicher für das PRE-Signup-Onboarding. Der Gast durchläuft das volle
 * Onboarding (Genres → Serien → Filme → Abos → Pet) OHNE Konto; die Auswahl
 * liegt lokal, bis er sich anmeldet. Nach dem Signup wendet die App alles an
 * (/add-Pfad) und fragt dann noch den Watch-Fortschritt ab (der braucht die
 * Serie erst im Katalog). Überlebt Popup- und Redirect-Signup.
 */

import type { Pet } from '../types/pet.types';

const KEY = 'guestOnboardingV2';
const MAX_PICKS = 40;

/** Strukturell kompatibel zu OnboardingItem (pages/Onboarding) — bewusst hier
 *  dupliziert, damit services/ nicht aus pages/ importiert (Layer-Regel). */
export interface GuestPick {
  id: number;
  type: 'series' | 'movie';
  title: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  number_of_seasons?: number;
}

export interface GuestPet {
  name: string;
  type: Pet['type'];
}

interface GuestStore {
  picks: GuestPick[];
  subscriptions: string[];
  pet: GuestPet | null;
  updatedAt: number;
}

const EMPTY: GuestStore = { picks: [], subscriptions: [], pet: null, updatedAt: 0 };

function read(): GuestStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<GuestStore>;
    return {
      picks: Array.isArray(parsed?.picks) ? parsed.picks : [],
      subscriptions: Array.isArray(parsed?.subscriptions) ? parsed.subscriptions : [],
      pet: parsed?.pet ?? null,
      updatedAt: parsed?.updatedAt ?? 0,
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(store: GuestStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...store, updatedAt: Date.now() }));
  } catch {
    /* quota/Privatmodus — dann geht die Vorauswahl verloren, kein harter Fehler */
  }
}

export function getGuestPicks(): GuestPick[] {
  return read().picks;
}

export function hasGuestPicks(): boolean {
  return read().picks.length > 0;
}

/** True, sobald der Gast irgendetwas gewählt hat (Titel/Abos/Pet). */
export function hasGuestOnboarding(): boolean {
  const s = read();
  return s.picks.length > 0 || s.subscriptions.length > 0 || s.pet !== null;
}

export function addGuestPick(item: GuestPick): void {
  const store = read();
  if (store.picks.some((p) => p.type === item.type && p.id === item.id)) return;
  if (store.picks.length >= MAX_PICKS) return;
  write({ ...store, picks: [...store.picks, item] });
}

export function removeGuestPick(type: GuestPick['type'], id: number): void {
  const store = read();
  write({ ...store, picks: store.picks.filter((p) => !(p.type === type && p.id === id)) });
}

export function getGuestSubscriptions(): string[] {
  return read().subscriptions;
}

export function setGuestSubscriptions(names: string[]): void {
  write({ ...read(), subscriptions: names });
}

export function getGuestPet(): GuestPet | null {
  return read().pet;
}

export function setGuestPet(pet: GuestPet | null): void {
  write({ ...read(), pet });
}

export function clearGuestPicks(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
