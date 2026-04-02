import firebase from 'firebase/compat/app';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import { getMangaDexInfo } from '../../services/mangadexService';
import { getDisplayFormatKey } from './mangaUtils';

/**
 * Zentrale Funktion zum Hinzufügen eines Manga zur Liste.
 * Holt automatisch die aktuelle Kapitelzahl von MangaDex für laufende Manga.
 */
export async function addMangaToList(
  userId: string,
  result: AniListMangaSearchResult,
  nextNmr: number
): Promise<void> {
  const sd = result.startDate;
  const startDateStr =
    sd?.year && sd?.month && sd?.day
      ? `${sd.year}-${String(sd.month).padStart(2, '0')}-${String(sd.day).padStart(2, '0')}`
      : undefined;

  const manga: Manga = {
    nmr: nextNmr,
    anilistId: result.id,
    title: result.title.english || result.title.romaji,
    titleEnglish: result.title.english || undefined,
    titleRomaji: result.title.romaji,
    poster: result.coverImage.large,
    bannerImage: result.bannerImage || undefined,
    description: result.description || undefined,
    chapters: result.chapters,
    volumes: result.volumes,
    status: result.status,
    format: getDisplayFormatKey(result.countryOfOrigin, result.format),
    countryOfOrigin: result.countryOfOrigin,
    genres: result.genres,
    averageScore: result.averageScore,
    startDate: startDateStr,
    isAdult: result.isAdult,
    rating: {},
    currentChapter: 0,
    readStatus: 'planned',
    addedAt: new Date().toISOString(),
  };

  // Für laufende Manga ohne bekannte Kapitelzahl: MangaDex abfragen
  if (!result.chapters && result.status === 'RELEASING') {
    try {
      const mdInfo = await getMangaDexInfo(result.title.english || result.title.romaji);
      if (mdInfo.latestChapter && mdInfo.latestChapter > 0) {
        manga.latestChapterAvailable = mdInfo.latestChapter;
      }
    } catch {
      // Nicht kritisch - Manga wird trotzdem hinzugefügt
    }
  }

  await firebase.database().ref(`${userId}/manga/${result.id}`).set(manga);
}
