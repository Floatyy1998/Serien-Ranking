import { describe, expect, it } from 'vitest';
import type { FriendActivity } from '../../types/Friend';
import {
  activityPath,
  bookPreviewFromActivity,
  bundleActivities,
  countByAction,
  describeActivity,
} from './activityBundles';

const MIN = 60_000;
let seq = 0;
const act = (overrides: Partial<FriendActivity>): FriendActivity => ({
  id: `a${seq++}`,
  userId: 'baerbel',
  userName: 'Bärbel',
  type: 'series_added',
  itemTitle: 'Titel',
  timestamp: 0,
  ...overrides,
});

describe('describeActivity', () => {
  it('ordnet Serien, Filme, Manga und Bücher zu', () => {
    expect(describeActivity(act({ type: 'rating_updated_movie', tmdbId: 5 }))).toEqual({
      media: 'movie',
      action: 'rated',
      id: 5,
    });
    expect(describeActivity(act({ type: 'manga_finished', itemId: 30013 }))).toEqual({
      media: 'manga',
      action: 'finished',
      id: 30013,
    });
    expect(describeActivity(act({ type: 'book_added', itemId: 'gb-abc' }))?.media).toBe('book');
  });

  it('lässt Gesehen- und Lösch-Einträge weg', () => {
    expect(describeActivity(act({ type: 'episodes_watched' }))).toBeNull();
    expect(describeActivity(act({ type: 'series_deleted' }))).toBeNull();
  });
});

describe('activityPath', () => {
  it('führt je Medium auf die richtige Seite', () => {
    expect(activityPath('series', 1399)).toBe('/series/1399');
    expect(activityPath('movie', 27205)).toBe('/movie/27205');
    expect(activityPath('manga', 30013)).toBe('/manga/30013');
    expect(activityPath('book', 'gb-a/b')).toBe('/books/gb-a%2Fb');
    expect(activityPath('series', undefined)).toBeNull();
  });
});

describe('bundleActivities', () => {
  it('bündelt eine Sitzung und verschmilzt Aktionen zum selben Titel', () => {
    const bundles = bundleActivities([
      act({ type: 'series_added', tmdbId: 1, itemTitle: 'Heirate meinen Mann', timestamp: 0 }),
      act({
        type: 'series_added_to_watchlist',
        tmdbId: 1,
        itemTitle: 'Heirate meinen Mann',
        timestamp: 1 * MIN,
      }),
      act({
        type: 'rating_updated',
        tmdbId: 1,
        itemTitle: 'Heirate meinen Mann',
        rating: 8,
        timestamp: 2 * MIN,
      }),
      act({ type: 'series_added', tmdbId: 2, itemTitle: 'Emily in Paris', timestamp: 30 * MIN }),
      act({ type: 'movie_added', tmdbId: 3, itemTitle: 'Wie verhext', timestamp: 40 * MIN }),
    ]);
    expect(bundles).toHaveLength(1);
    const [bundle] = bundles;
    expect(bundle.titles.map((t) => t.title)).toEqual([
      'Wie verhext',
      'Emily in Paris',
      'Heirate meinen Mann',
    ]);
    const merged = bundle.titles[2];
    expect(merged.actions).toEqual(['rated', 'watchlist', 'added']);
    expect(merged.rating).toBe(8);
    expect(countByAction(bundle)).toEqual([
      ['added', 2],
      ['rated', 1],
    ]);
  });

  it('trennt Sitzungen mit großer Lücke und verschiedene Personen', () => {
    const hour = 60 * MIN;
    const bundles = bundleActivities([
      act({ tmdbId: 1, timestamp: 0 }),
      act({ tmdbId: 2, timestamp: 5 * hour }),
      act({ tmdbId: 3, timestamp: 5 * hour + MIN, userId: 'flo', userName: 'Flo' }),
    ]);
    expect(bundles.map((b) => [b.userName, b.titles.length])).toEqual([
      ['Flo', 1],
      ['Bärbel', 1],
      ['Bärbel', 1],
    ]);
  });

  it('nimmt die neueste Bewertung, wenn mehrfach bewertet wurde', () => {
    const [bundle] = bundleActivities([
      act({ type: 'manga_rated', itemId: 9, rating: 6, timestamp: 0 }),
      act({ type: 'manga_rated', itemId: 9, rating: 9, timestamp: MIN }),
    ]);
    expect(bundle.titles).toHaveLength(1);
    expect(bundle.titles[0].rating).toBe(9);
  });

  it('ignoriert Gesehen-Einträge beim Bündeln', () => {
    expect(bundleActivities([act({ type: 'episode_watched', timestamp: 0 })])).toEqual([]);
  });
});

describe('bookPreviewFromActivity', () => {
  it('baut eine Buchvorschau aus der Aktivität', () => {
    const preview = bookPreviewFromActivity(
      act({
        type: 'book_finished',
        itemType: 'book',
        itemId: 'ol-OL1W',
        itemTitle: 'Der Report der Magd',
        author: 'Margaret Atwood',
        poster: 'https://covers.example/1.jpg',
        bookRef: { olWorkId: 'OL1W', source: 'openlibrary' },
      })
    );
    expect(preview).toMatchObject({
      id: 'ol-OL1W',
      title: 'Der Report der Magd',
      authors: ['Margaret Atwood'],
      olWorkId: 'OL1W',
      source: 'openlibrary',
    });
    expect(bookPreviewFromActivity(act({ type: 'series_added' }))).toBeNull();
  });
});
