export type ReadingTab = 'all' | 'manga' | 'books';

export const READING_TAB_PATHS: Record<ReadingTab, string> = {
  all: '/reading',
  manga: '/manga',
  books: '/books',
};

const KEY = 'readingTab';

export function getReadingTab(): ReadingTab | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'all' || value === 'manga' || value === 'books' ? value : null;
  } catch {
    return null;
  }
}

export function setReadingTab(tab: ReadingTab): void {
  try {
    localStorage.setItem(KEY, tab);
  } catch {
    /* nur Komfort */
  }
}

/** Ziel des „Lesen"-Platzes im Dock: der zuletzt genutzte Reiter, beim ersten Mal „Alle". */
export function resolveReadingPath(): string {
  return READING_TAB_PATHS[getReadingTab() ?? 'all'];
}
