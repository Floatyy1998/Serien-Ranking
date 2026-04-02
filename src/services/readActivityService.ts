import firebase from 'firebase/compat/app';
import type { Manga } from '../types/Manga';

interface ChapterReadEvent {
  type: 'chapter_read';
  timestamp: string;
  month: number;
  dayOfWeek: number;
  hour: number;
  mangaId: number;
  mangaTitle: string;
  chapterNumber: number;
  volumeNumber?: number;
  format?: string;
  genres?: string[];
  isReread: boolean;
}

interface MangaRatingEvent {
  type: 'manga_rating';
  timestamp: string;
  mangaId: number;
  mangaTitle: string;
  rating: number;
}

function getEventsPath(userId: string): string {
  const year = new Date().getFullYear();
  return `${userId}/wrapped/${year}/mangaEvents`;
}

export async function logChapterRead(
  userId: string,
  manga: Manga,
  chapterNumber: number,
  previousChapter: number
): Promise<void> {
  const now = new Date();
  const chaptersRead = chapterNumber - previousChapter;

  // Log each chapter individually for accurate tracking
  const promises: Promise<void>[] = [];
  for (let i = 0; i < chaptersRead; i++) {
    const event: ChapterReadEvent = {
      type: 'chapter_read',
      timestamp: now.toISOString(),
      month: now.getMonth() + 1,
      dayOfWeek: now.getDay(),
      hour: now.getHours(),
      mangaId: manga.anilistId,
      mangaTitle: manga.title,
      chapterNumber: previousChapter + i + 1,
      volumeNumber: manga.currentVolume || undefined,
      format: manga.format,
      genres: manga.genres,
      isReread: (manga.rereadCount || 0) > 0,
    };

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
  const now = new Date();
  const event: MangaRatingEvent = {
    type: 'manga_rating',
    timestamp: now.toISOString(),
    mangaId: manga.anilistId,
    mangaTitle: manga.title,
    rating,
  };

  await firebase.database().ref(getEventsPath(userId)).push(event);
}
