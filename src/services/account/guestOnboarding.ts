/**
 * Zwischenspeicher für das PRE-Signup-Onboarding. Der Gast durchläuft das volle
 * Onboarding (Genres → Serien → Filme → Abos → Pet) OHNE Konto; die Auswahl
 * liegt lokal, bis er sich anmeldet. Nach dem Signup wendet die App alles an
 * (/add-Pfad) und fragt dann noch den Watch-Fortschritt ab (der braucht die
 * Serie erst im Katalog). Überlebt Popup- und Redirect-Signup.
 */

import type { BookSearchResult } from '../../types/Book';
import type { AniListMangaSearchResult } from '../../types/Manga';
import type { Pet } from '../../types/pet.types';
import { parseAppFocus, type AppFocus } from '../settings/appFocus';

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

/** Strukturell kompatibel zu ReadingPick (pages/Onboarding). */
export interface GuestReadingPick {
  key: string;
  kind: 'book' | 'manga';
  title: string;
  cover?: string;
  year?: string;
  book?: BookSearchResult;
  manga?: AniListMangaSearchResult;
  status: 'reading' | 'completed' | 'planned';
}

export interface GuestPet {
  name: string;
  type: Pet['type'];
}

interface GuestStore {
  picks: GuestPick[];
  readingPicks: GuestReadingPick[];
  focus: AppFocus | null;
  genres: string[];
  subscriptions: string[];
  pet: GuestPet | null;
  updatedAt: number;
}

const EMPTY: GuestStore = {
  picks: [],
  readingPicks: [],
  focus: null,
  genres: [],
  subscriptions: [],
  pet: null,
  updatedAt: 0,
};

function read(): GuestStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<GuestStore>;
    return {
      picks: Array.isArray(parsed?.picks) ? parsed.picks : [],
      readingPicks: Array.isArray(parsed?.readingPicks) ? parsed.readingPicks : [],
      focus: parseAppFocus(parsed?.focus),
      genres: Array.isArray(parsed?.genres) ? parsed.genres : [],
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
// Nur echte Titel-Picks zählen: ein Store mit bloß Abos/Pet (z. B. nach
// localStorage-Teilverlust) darf das volle Onboarding NICHT ersetzen — sonst
// schließt der Resume-Flow mit null Serien/Filmen ab.
export function hasGuestOnboarding(): boolean {
  const store = read();
  return store.picks.length > 0 || store.readingPicks.length > 0;
}

export function getGuestReading(): {
  picks: GuestReadingPick[];
  focus: AppFocus | null;
  genres: string[];
} {
  const store = read();
  return { picks: store.readingPicks, focus: store.focus, genres: store.genres };
}

export function setGuestReading(
  picks: GuestReadingPick[],
  focus: AppFocus | null,
  genres: string[]
): void {
  write({ ...read(), readingPicks: picks.slice(0, MAX_PICKS), focus, genres });
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
