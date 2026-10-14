// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bundleActivities } from '../../../lib/social/activityBundles';
import type { FriendActivity } from '../../../types/Friend';
import type { UnifiedNotification } from '../hooks/useUnifiedNotifications';
import { ActivityBundleItem } from './ActivityBundleItem';
import { bundleSentence } from './activityText';

afterEach(cleanup);

const act = (overrides: Partial<FriendActivity>): FriendActivity => ({
  id: String(Math.random()),
  userId: 'baerbel',
  userName: 'Bärbel',
  type: 'series_added',
  itemTitle: 'Titel',
  timestamp: 1_000_000,
  ...overrides,
});

const itemFor = (activities: FriendActivity[]): UnifiedNotification => {
  const [bundle] = bundleActivities(activities);
  return {
    id: bundle.id,
    kind: 'activity',
    title: 'Bärbel',
    message: bundleSentence(bundle),
    timestamp: bundle.latest,
    read: false,
    icon: 'tv',
    bundle,
  };
};

describe('ActivityBundleItem', () => {
  it('klappt eine Sitzung auf und öffnet den gewählten Titel', () => {
    const onOpen = vi.fn();
    render(
      <ActivityBundleItem
        item={itemFor([
          act({ tmdbId: 1416, itemTitle: "Grey's Anatomy" }),
          act({ type: 'movie_added', itemType: 'movie', tmdbId: 346698, itemTitle: 'Barbie' }),
        ])}
        posterFor={() => undefined}
        onOpen={onOpen}
      />
    );
    expect(screen.getByText('hat 2 Titel hinzugefügt')).toBeTruthy();
    expect(screen.queryByText('Barbie')).toBeNull();

    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByText('Barbie'));
    expect(onOpen).toHaveBeenCalledWith('/movie/346698', undefined);
  });

  it('öffnet einen einzelnen Buch-Eintrag direkt mit Vorschau', () => {
    const onOpen = vi.fn();
    render(
      <ActivityBundleItem
        item={itemFor([
          act({
            type: 'book_finished',
            itemType: 'book',
            itemId: 'ol-OL1W',
            itemTitle: 'Der Report der Magd',
            bookRef: { olWorkId: 'OL1W', source: 'openlibrary' },
          }),
        ])}
        posterFor={() => undefined}
        onOpen={onOpen}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith(
      '/books/ol-OL1W',
      expect.objectContaining({ result: expect.objectContaining({ olWorkId: 'OL1W' }) })
    );
  });
});
