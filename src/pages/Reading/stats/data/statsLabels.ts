import type { ShelfId } from '../../../../services/api/bookDiscovery';
import type { ReadingStatus } from '../../../../lib/reading/readingStats';
import { t } from '../../../../services/i18n';
import type { BookFormat } from '../../../../types/Book';
import { SHELF_TITLES } from '../../../Books/data/genres';

/** Deutsche Namen für AniList-Genres; Fachbegriffe wie „Slice of Life" bleiben, wie sie sind. */
const ANILIST_LABEL: Record<string, () => string> = {
  Action: () => t('Action'),
  Adventure: () => t('Abenteuer'),
  Comedy: () => t('Komödie'),
  Drama: () => t('Drama'),
  Music: () => t('Musik'),
  Psychological: () => t('Psychologie'),
  Sports: () => t('Sport'),
  Supernatural: () => t('Übernatürlich'),
};

export function genreLabel(key: string): string {
  if (key.startsWith('anilist:')) {
    const genre = key.slice(8);
    return ANILIST_LABEL[genre]?.() ?? genre;
  }
  if (key.startsWith('book:')) return key.slice(5);
  return SHELF_TITLES[key as ShelfId]?.() ?? key;
}

export const STATUS_LABEL: Record<ReadingStatus, () => string> = {
  reading: () => t('Lese ich'),
  planned: () => t('Geplant'),
  completed: () => t('Beendet'),
  paused: () => t('Pausiert'),
  dropped: () => t('Abgebrochen'),
};

export const BOOK_FORMAT_LABEL: Record<BookFormat, () => string> = {
  print: () => t('Gedruckt'),
  ebook: () => t('E-Book'),
  audio: () => t('Hörbuch'),
};
