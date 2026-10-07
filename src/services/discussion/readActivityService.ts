import { dbRef, userPath } from '../db/ref';
import type { Manga } from '../../types/Manga';

/**
 * Manga events werden im Compact-Format gespeichert (gleiche Konvention wie wrapped/events).
 *   ts: unix seconds, t: "ch"/"rg", s: mangaId, st: title,
 *   ch: (letztes) Kapitel, ch0: erstes Kapitel eines Sprungs, n: Anzahl Kapitel (fehlt = 1),
 *   vol: volumeNumber, fmt: format,
 *   g: genres, rw: isReread (0/1), rat: rating
 */
interface CompactMangaEvent {
  ts: number;
  t: 'ch' | 'rg';
  s: number;
  st: string;
  ch?: number;
  ch0?: number;
  n?: number;
  vol?: number;
  fmt?: string;
  g?: string[];
  rw?: number;
  rat?: number;
}

function getEventsPath(userId: string): string {
  const year = new Date().getFullYear();
  return userPath(userId, 'wrapped', year, 'mangaEvents');
}

export async function logChapterRead(
  userId: string,
  manga: Manga,
  chapterNumber: number,
  previousChapter: number
): Promise<void> {
  const chaptersRead = chapterNumber - previousChapter;
  if (chaptersRead <= 0) return;

  // Ein Ereignis pro Vorgang — ein Sprung über viele Kapitel war vorher ein Push je Kapitel.
  const event: CompactMangaEvent = {
    ts: Math.floor(Date.now() / 1000),
    t: 'ch',
    s: manga.anilistId,
    st: manga.title,
    ch: chapterNumber,
  };
  if (chaptersRead > 1) {
    event.ch0 = previousChapter + 1;
    event.n = chaptersRead;
  }
  if (manga.currentVolume) event.vol = manga.currentVolume;
  if (manga.format) event.fmt = manga.format;
  if (manga.genres && manga.genres.length > 0) event.g = manga.genres;
  if ((manga.rereadCount || 0) > 0) event.rw = 1;

  await dbRef(getEventsPath(userId)).push(event);
}

export async function logMangaRating(userId: string, manga: Manga, rating: number): Promise<void> {
  const event: CompactMangaEvent = {
    ts: Math.floor(Date.now() / 1000),
    t: 'rg',
    s: manga.anilistId,
    st: manga.title,
    rat: rating,
  };

  await dbRef(getEventsPath(userId)).push(event);
}

/** Kapitel- und Bewertungs-Ereignisse eines Jahres (für den Lese-Verlauf). */
export async function fetchMangaEvents(userId: string, year: number): Promise<CompactMangaEvent[]> {
  const snap = await dbRef(userPath(userId, 'wrapped', year, 'mangaEvents')).once('value');
  const raw = (snap.val() || {}) as Record<string, CompactMangaEvent>;
  return Object.values(raw);
}
