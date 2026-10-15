// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bundleActivities } from '../../../lib/social/activityBundles';
import type { FriendActivity } from '../../../types/Friend';
import type { UnifiedNotification } from '../hooks/useUnifiedNotifications';
import { ActivityBundleItem } from './ActivityBundleItem';
import { bundleSentence } from './activityText';

afterEach(cleanup);

let seq = 0;
const act = (overrides: Partial<FriendActivity>): FriendActivity => ({
  id: `a${seq++}`,
  userId: 'baerbel',
  userName: 'Bärbel',
  type: 'series_added',
  itemTitle: 'Titel',
  timestamp: 1_000_000,
  ...overrides,
});

const itemFor = (activities: FriendActivity[], read = false): UnifiedNotification => {
  const [bundle] = bundleActivities(activities);
  return {
    id: bundle.id,
    kind: 'activity',
    title: 'Bärbel',
    message: bundleSentence(bundle),
    timestamp: bundle.latest,
    read,
    icon: 'tv',
    bundle,
  };
};

describe('ActivityBundleItem', () => {
  it('zeigt jeden Titel mit Medium und öffnet den gewählten', () => {
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
    expect(screen.getByText('1 Serie')).toBeTruthy();
    expect(screen.getByText('1 Film')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Barbie/ }));
    expect(onOpen).toHaveBeenCalledWith('/movie/346698', undefined);
  });

  it('klappt lange Sitzungen hinter +N zusammen', () => {
    const titles = Array.from({ length: 12 }, (_, i) =>
      act({ tmdbId: 100 + i, itemTitle: `Serie ${i}`, timestamp: 1_000_000 - i * 60_000 })
    );
    render(
      <ActivityBundleItem item={itemFor(titles)} posterFor={() => undefined} onOpen={vi.fn()} />
    );
    expect(screen.queryByText('Serie 11')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Alle 12 anzeigen' }));
    expect(screen.getByText('Serie 11')).toBeTruthy();
  });

  it('öffnet über den Namen das Profil', () => {
    const onOpen = vi.fn();
    render(
      <ActivityBundleItem
        item={itemFor([act({ tmdbId: 1, itemTitle: 'Dark' })], true)}
        posterFor={() => undefined}
        onOpen={onOpen}
      />
    );
    fireEvent.click(screen.getByText('Bärbel'));
    expect(onOpen).toHaveBeenCalledWith('/friend/baerbel');
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
    expect(screen.getByText('Buch · ausgelesen')).toBeTruthy();
    fireEvent.click(screen.getByText('Der Report der Magd'));
    expect(onOpen).toHaveBeenCalledWith(
      '/books/ol-OL1W',
      expect.objectContaining({ result: expect.objectContaining({ olWorkId: 'OL1W' }) })
    );
  });
});
