import firebase from 'firebase/compat/app';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { getMangaDexInfo } from '../../services/mangadexService';
import { getDisplayFormatKey } from './mangaUtils';

/**
 * Zentrale Funktion zum Hinzufügen eines Manga zur Liste.
 * Holt automatisch die aktuelle Kapitelzahl von MangaUpdates für laufende Manga.
 * WICHTIG: Keine undefined Werte - Firebase wirft sonst einen Error.
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
      : null;

  // Build manga object - use null instead of undefined (Firebase rejects undefined)
  const manga: Record<string, unknown> = {
    nmr: nextNmr,
    anilistId: result.id,
    title: result.title.english || result.title.romaji,
    titleRomaji: result.title.romaji,
    poster: result.coverImage.large,
    chapters: result.chapters ?? null,
    volumes: result.volumes ?? null,
    status: result.status || null,
    format: getDisplayFormatKey(result.countryOfOrigin, result.format),
    countryOfOrigin: result.countryOfOrigin || null,
    genres: result.genres || [],
    averageScore: result.averageScore ?? null,
    startDate: startDateStr,
    isAdult: result.isAdult || false,
    rating: {},
    currentChapter: 0,
    readStatus: 'planned',
    addedAt: new Date().toISOString(),
  };

  // Only add optional fields if they have values (avoid undefined in Firebase)
  if (result.title.english) manga.titleEnglish = result.title.english;
  if (result.bannerImage) manga.bannerImage = result.bannerImage;
  if (result.description) manga.description = result.description;

  // Fuer laufende Manga MangaUpdates abfragen — AniList's chapters-Feld ist
  // bei vielen ongoing/hiatus Serien veraltet (z.B. Vagabond meldet 2 statt
  // 326), MangaUpdates spiegelt den echten Releasestand.
  if (result.status === 'RELEASING') {
    try {
      const mdInfo = await getMangaDexInfo(result.title.english || result.title.romaji);
      if (mdInfo.latestChapter && mdInfo.latestChapter > 0) {
        manga.latestChapterAvailable = mdInfo.latestChapter;
      }
    } catch {
      // Nicht kritisch - Manga wird trotzdem hinzugefügt
    }
  }

  await firebase.database().ref(`users/${userId}/manga/${result.id}`).set(manga);
}
