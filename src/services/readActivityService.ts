import firebase from 'firebase/compat/app';
import type { Manga } from '../types/Manga';

/**
 * Manga events werden im Compact-Format gespeichert (gleiche Konvention wie wrapped/events).
 *   ts: unix seconds, t: "ch"/"rg", s: mangaId, st: title,
 *   ch: chapterNumber, vol: volumeNumber, fmt: format,
 *   g: genres, rw: isReread (0/1), rat: rating
 */
interface CompactMangaEvent {
  ts: number;
  t: 'ch' | 'rg';
  s: number;
  st: string;
  ch?: number;
  vol?: number;
  fmt?: string;
  g?: string[];
  rw?: number;
  rat?: number;
}

function getEventsPath(userId: string): string {
  const year = new Date().getFullYear();
  return `users/${userId}/wrapped/${year}/mangaEvents`;
}

export async function logChapterRead(
  userId: string,
  manga: Manga,
  chapterNumber: number,
  previousChapter: number
): Promise<void> {
  const nowUnix = Math.floor(Date.now() / 1000);
  const chaptersRead = chapterNumber - previousChapter;

  const promises: Promise<void>[] = [];
  for (let i = 0; i < chaptersRead; i++) {
    const event: CompactMangaEvent = {
      ts: nowUnix,
      t: 'ch',
      s: manga.anilistId,
      st: manga.title,
      ch: previousChapter + i + 1,
    };
    if (manga.currentVolume) event.vol = manga.currentVolume;
    if (manga.format) event.fmt = manga.format;
    if (manga.genres && manga.genres.length > 0) event.g = manga.genres;
    if ((manga.rereadCount || 0) > 0) event.rw = 1;

    promises.push(
      firebase
        .database()
        .ref(getEventsPath(userId))
        .push(event)
        .then(() => undefined)
    );
  }

  await Promise.all(promises);
}

export async function logMangaRating(userId: string, manga: Manga, rating: number): Promise<void> {
  const event: CompactMangaEvent = {
    ts: Math.floor(Date.now() / 1000),
    t: 'rg',
    s: manga.anilistId,
    st: manga.title,
    rat: rating,
  };

  await firebase.database().ref(getEventsPath(userId)).push(event);
}
