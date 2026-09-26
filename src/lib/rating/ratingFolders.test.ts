import { describe, expect, it } from 'vitest';
import {
  RATING_FOLDER_NAME_MAX,
  compactRatingFolder,
  expandRatingFolders,
  folderItemKey,
  normalizeFolderName,
} from './ratingFolders';

describe('ratingFolders', () => {
  it('builds kind-prefixed item keys', () => {
    expect(folderItemKey('series', 12)).toBe('s_12');
    expect(folderItemKey('movie', '34')).toBe('m_34');
  });

  it('normalizes names (whitespace, length cap)', () => {
    expect(normalizeFolderName('  Marvel   Filme ')).toBe('Marvel Filme');
    expect(normalizeFolderName('x'.repeat(80))).toHaveLength(RATING_FOLDER_NAME_MAX);
  });

  it('expands stored folders sorted by creation, skipping nameless fragments', () => {
    const folders = expandRatingFolders({
      b: { name: 'Lieblingsfilme', createdAt: 2, items: { m_1: true, s_2: true } },
      a: { name: 'Marvel', createdAt: 1 },
      broken: { createdAt: 0, items: { s_9: true } },
    });
    expect(folders.map((f) => f.id)).toEqual(['a', 'b']);
    expect([...folders[1].items]).toEqual(['m_1', 's_2']);
    expect(folders[0].items.size).toBe(0);
    expect(expandRatingFolders(null)).toEqual([]);
  });

  it('compacts a folder back into its stored shape', () => {
    expect(compactRatingFolder(' Marvel ', new Set(['m_1', 's_2']), 5)).toEqual({
      name: 'Marvel',
      createdAt: 5,
      items: { m_1: true, s_2: true },
    });
  });
});
