import { t } from '../../services/i18n';

export interface LibraryCounts {
  series: number;
  movies: number;
  manga: number;
  books: number;
}

/** „24 Serien · 28 Filme · 3 Manga · 1 Buch" — leere Bereiche fallen weg, Zahl und Wort trennt kein Umbruch. */
export const libraryCountLabel = ({ series, movies, manga, books }: LibraryCounts): string => {
  const parts: string[] = [];
  if (series > 0)
    parts.push(series === 1 ? t('{n} Serie', { n: 1 }) : t('{n} Serien', { n: series }));
  if (movies > 0)
    parts.push(movies === 1 ? t('{n} Film', { n: 1 }) : t('{n} Filme', { n: movies }));
  if (manga > 0) parts.push(manga === 1 ? t('1 Manga') : t('{n} Manga', { n: manga }));
  if (books > 0) parts.push(books === 1 ? t('1 Buch') : t('{n} Bücher', { n: books }));
  return parts.map((part) => part.replace(/ /g, '\u00a0')).join(' · ');
};
