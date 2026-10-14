/** Titel ohne AniList-Eintrag kommen von MangaUpdates und tragen die negierte Serien-ID als anilistId. */
export const isMangaUpdatesId = (id: number): boolean => id < 0;

export const fromMangaUpdatesSeriesId = (seriesId: number): number => -seriesId;

export const toMangaUpdatesSeriesId = (id: number): number => -id;

export interface MangaSourceLink {
  label: string;
  url: string;
}

export const mangaSourceLink = (id: number): MangaSourceLink =>
  isMangaUpdatesId(id)
    ? {
        label: 'MangaUpdates',
        url: `https://www.mangaupdates.com/series/${toMangaUpdatesSeriesId(id).toString(36)}`,
      }
    : { label: 'AniList', url: `https://anilist.co/manga/${id}` };

/** Manga-Seite; mit dem Band aus der ISBN-Suche bietet sie „Bis Band N gelesen" an. */
export const mangaPath = (id: number, volume?: number): string =>
  volume && volume > 0 ? `/manga/${id}?band=${volume}` : `/manga/${id}`;
