import { describe, expect, it } from 'vitest';
import { paths, userPath } from './paths';

describe('db paths', () => {
  it('builds per-user data paths', () => {
    expect(paths.seriesItem('u1', 42)).toBe('users/u1/series/42');
    expect(paths.seriesRating('u1', 42)).toBe('users/u1/series/42/rating');
    expect(paths.seriesWatchItem('u1', 42)).toBe('users/u1/seriesWatch/42');
    expect(paths.movieItem('u1', 7)).toBe('users/u1/movies/7');
    expect(paths.mangaItem('u1', 99)).toBe('users/u1/manga/99');
    expect(paths.serienVersion('u1')).toBe('users/u1/meta/serienVersion');
  });

  it('builds notification-state paths from a node name', () => {
    expect(paths.notificationState('u1', 'animeMangaNotifications')).toBe(
      'users/u1/animeMangaNotifications'
    );
  });

  it('userPath joins arbitrary segments under the user root', () => {
    expect(userPath('u1', 'wrapped', 2026, 'events')).toBe('users/u1/wrapped/2026/events');
    expect(userPath('u1')).toBe('users/u1');
  });
});
