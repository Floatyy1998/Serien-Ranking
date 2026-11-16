import { coverAtSize } from '../../lib/books/bookSearchMapping';
import type { YearFactKey, YearHighlight, YearMedia } from '../../lib/wrapped/yearHighlights';
import { t } from '../../services/i18n';

export const yearTagline = ({ watch, manga, books }: YearMedia): string => {
  if (watch && manga && books) return t('Dein Jahr in Serien, Filmen, Manga & Büchern');
  if (watch && manga) return t('Dein Jahr in Serien, Filmen & Manga');
  if (watch && books) return t('Dein Jahr in Serien, Filmen & Büchern');
  if (manga && books) return t('Dein Jahr in Manga & Büchern');
  if (manga) return t('Dein Jahr in Manga');
  if (books) return t('Dein Jahr in Büchern');
  return t('Dein Jahr in Serien & Filmen');
};

export const factLabel = (key: YearFactKey): string => {
  switch (key) {
    case 'hours':
      return t('Stunden');
    case 'episodes':
      return t('Episoden');
    case 'movies':
      return t('Filme');
    case 'series':
      return t('Serien');
    case 'mangaChapters':
      return t('Manga-Kapitel');
    case 'mangaVolumes':
      return t('Manga-Bände');
    case 'books':
      return t('Bücher');
    case 'pages':
      return t('Seiten gelesen');
    default:
      return t('Tage Streak');
  }
};

export const highlightKindLabel = (kind: YearHighlight['kind']): string => {
  switch (kind) {
    case 'series':
      return t('Serie');
    case 'movie':
      return t('Film');
    case 'manga':
      return t('Manga');
    default:
      return t('Buch');
  }
};

export const highlightMeta = (h: YearHighlight): string => {
  switch (h.kind) {
    case 'series':
      return t('{n} Episoden', { n: h.episodes ?? 0 });
    case 'movie':
      return h.rating ? `${h.rating.toFixed(1)} / 10` : '';
    case 'manga':
      return h.chapters
        ? t('{n} Kapitel', { n: h.chapters })
        : h.volumes
          ? t('{n} Bände', { n: h.volumes })
          : '';
    default:
      return h.author ?? (h.pages ? t('{n} Seiten', { n: h.pages }) : '');
  }
};

export const highlightImage = (h: YearHighlight): string | undefined => {
  if (!h.image) return undefined;
  if (h.kind === 'book') return coverAtSize(h.image, 'L');
  if (h.kind === 'manga' || h.image.startsWith('http')) return h.image;
  return `https://image.tmdb.org/t/p/w342${h.image}`;
};
