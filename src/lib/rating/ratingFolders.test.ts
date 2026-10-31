import { describe, expect, it } from 'vitest';
import {
  RATING_FOLDER_NAME_MAX,
  REWATCH_FOLDER_ID,
  compactRatingFolder,
  expandRatingFolders,
  folderDisplayName,
  folderItemKey,
  isRewatchFolder,
  normalizeFolderName,
  withRewatchFolder,
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

  it('pins the rewatch list first regardless of creation time', () => {
    const folders = expandRatingFolders({
      a: { name: 'Marvel', createdAt: 1 },
      [REWATCH_FOLDER_ID]: { name: 'Nochmal schauen', items: { m_5: true } },
    });
    expect(folders.map((f) => f.id)).toEqual([REWATCH_FOLDER_ID, 'a']);
    expect(isRewatchFolder(folders[0])).toBe(true);
    expect(isRewatchFolder('a')).toBe(false);
    expect(folderDisplayName(folders[0])).toBe('Nochmal schauen');
    expect(folderDisplayName(folders[1])).toBe('Marvel');
  });

  it('adds a virtual rewatch list only when none is stored', () => {
    const marvel = { id: 'a', name: 'Marvel', createdAt: 1, items: new Set<string>() };
    const added = withRewatchFolder([marvel]);
    expect(added.map((f) => f.id)).toEqual([REWATCH_FOLDER_ID, 'a']);
    expect(added[0].items.size).toBe(0);
    const stored = { id: REWATCH_FOLDER_ID, name: 'x', createdAt: 0, items: new Set(['s_1']) };
    expect(withRewatchFolder([stored, marvel])).toEqual([stored, marvel]);
  });

  it('compacts a folder back into its stored shape', () => {
    expect(compactRatingFolder(' Marvel ', new Set(['m_1', 's_2']), 5)).toEqual({
      name: 'Marvel',
      createdAt: 5,
      items: { m_1: true, s_2: true },
    });
  });
});
