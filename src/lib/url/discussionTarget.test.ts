import { describe, expect, it } from 'vitest';
import { discussionIdFromHash, discussionTarget } from './discussionTarget';

describe('discussionTarget', () => {
  it('führt ein Like auf eine Diskussion zur Serie, auch ohne gespeicherten Pfad', () => {
    expect(discussionTarget({ discussionId: '-Nabc', itemId: 1396, itemType: 'series' })).toBe(
      '/series/1396#discussion--Nabc'
    );
  });

  it('führt Folgen-Diskussionen zur Folge', () => {
    expect(
      discussionTarget({
        discussionId: '-Nabc',
        itemId: 1396,
        itemType: 'episode',
        seasonNumber: 2,
        episodeNumber: 5,
      })
    ).toBe('/episode/1396/s/2/e/5#discussion--Nabc');
    expect(
      discussionTarget({ discussionId: '-Nabc', discussionPath: 'discussions/episode/7_s1_e3' })
    ).toBe('/episode/7/s/1/e/3#discussion--Nabc');
  });

  it('liest Film und Serie aus dem Pfad', () => {
    expect(discussionTarget({ discussionPath: 'discussions/movie/603' })).toBe('/movie/603');
  });

  it('führt Manga- und Buch-Diskussionen auf ihre Detailseiten', () => {
    expect(
      discussionTarget({ discussionId: '-Nabc', discussionPath: 'discussions/manga/30013' })
    ).toBe('/manga/30013#discussion--Nabc');
    expect(discussionTarget({ discussionPath: 'discussions/book/hc-328491/-Nabc' })).toBe(
      '/books/hc-328491'
    );
    expect(discussionTarget({ itemId: 30013, itemType: 'manga' })).toBe('/manga/30013');
    expect(discussionTarget({ itemId: 'gb-a b', itemType: 'book' })).toBe('/books/gb-a%20b');
  });

  it('nimmt bei geteilten Buch-Threads die Buch-ID statt des Werk-Schlüssels', () => {
    const discussionPath = 'discussions/book/w-dune_herbert';
    expect(
      discussionTarget({ discussionId: '-Nabc', discussionPath, itemId: 'hc-1', itemType: 'book' })
    ).toBe('/books/hc-1#discussion--Nabc');
    expect(discussionTarget({ discussionId: '-Nabc', discussionPath })).toBeUndefined();
  });

  it('liefert nichts ohne brauchbare Angaben', () => {
    expect(discussionTarget(undefined)).toBeUndefined();
    expect(discussionTarget({ discussionId: '-Nabc' })).toBeUndefined();
    expect(discussionTarget({ itemId: 5, itemType: 'episode' })).toBeUndefined();
  });

  it('erkennt die Sprungmarke', () => {
    expect(discussionIdFromHash('#discussion--Nabc')).toBe('-Nabc');
    expect(discussionIdFromHash('#rating')).toBeNull();
    expect(discussionIdFromHash('')).toBeNull();
  });
});
