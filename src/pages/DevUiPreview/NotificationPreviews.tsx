import { useMemo } from 'react';
import { activityPath, bundleActivities } from '../../lib/social/activityBundles';
import type { FriendActivity } from '../../types/Friend';
import type { UnifiedNotification } from '../HomePage/hooks/useUnifiedNotifications';
import { bundleSentence } from '../HomePage/notifications/activityText';
import { NotificationSheet } from '../HomePage/sheets/NotificationSheet';

const MIN = 60_000;
const now = Date.now();
let seq = 0;

const act = (
  minutesAgo: number,
  overrides: Partial<FriendActivity> & Pick<FriendActivity, 'type' | 'itemTitle'>
): FriendActivity => ({
  id: `p${seq++}`,
  userId: 'baerbel',
  userName: 'Bärbel',
  timestamp: now - minutesAgo * MIN,
  itemType: 'series',
  ...overrides,
});

const ACTIVITIES: FriendActivity[] = [
  act(10, { type: 'series_added', itemTitle: 'Beautiful Bones', tmdbId: 61701 }),
  act(13, { type: 'movie_added', itemTitle: 'Wie verhext', tmdbId: 9822, itemType: 'movie' }),
  act(14, { type: 'movie_added', itemTitle: 'Street Fighter', tmdbId: 11667, itemType: 'movie' }),
  act(14, { type: 'series_added', itemTitle: 'Emily in Paris', tmdbId: 100757 }),
  act(15, { type: 'series_added', itemTitle: 'Pride and Prejudice', tmdbId: 164 }),
  act(15, { type: 'series_added', itemTitle: 'Percy Jackson: Die Serie', tmdbId: 106541 }),
  act(15, { type: 'series_added', itemTitle: 'The Body', tmdbId: 2690 }),
  act(15, { type: 'series_added', itemTitle: 'The Gilded Age', tmdbId: 81723 }),
  act(16, { type: 'series_added', itemTitle: 'Balaraw', tmdbId: 250000 }),
  act(16, { type: 'series_added', itemTitle: 'Nature', tmdbId: 3046 }),
  act(16, { type: 'series_added', itemTitle: "Grey's Anatomy", tmdbId: 1416 }),
  act(28, { type: 'rating_updated', itemTitle: 'Heirate meinen Mann', tmdbId: 247718, rating: 8 }),
  act(28, {
    type: 'series_added_to_watchlist',
    itemTitle: 'Heirate meinen Mann',
    tmdbId: 247718,
  }),
  act(29, { type: 'series_added', itemTitle: 'Heirate meinen Mann', tmdbId: 247718 }),
  act(52, {
    type: 'manga_rated',
    itemTitle: 'Frieren',
    itemType: 'manga',
    itemId: 118586,
    rating: 10,
    userId: 'flo',
    userName: 'Florian',
  }),
  act(240, {
    type: 'book_finished',
    itemTitle: 'Der Report der Magd',
    itemType: 'book',
    itemId: 'ol-OL15832982W',
    author: 'Margaret Atwood',
    bookRef: { olWorkId: 'OL15832982W', source: 'openlibrary' },
  }),
  act(300, {
    type: 'movie_added',
    itemTitle: 'Dune: Part Two',
    tmdbId: 693134,
    itemType: 'movie',
    userId: 'jonas',
    userName: 'Jonas',
  }),
  act(302, {
    type: 'movie_added',
    itemTitle: 'Oppenheimer',
    tmdbId: 872585,
    itemType: 'movie',
    userId: 'jonas',
    userName: 'Jonas',
  }),
  act(303, {
    type: 'rating_updated_movie',
    itemTitle: 'Barbie',
    tmdbId: 346698,
    itemType: 'movie',
    rating: 7,
    userId: 'jonas',
    userName: 'Jonas',
  }),
];

const OTHERS: UnifiedNotification[] = [
  {
    id: 'req_1',
    kind: 'request',
    title: 'Mira',
    message: 'möchte mit dir befreundet sein',
    timestamp: now - 5 * MIN,
    read: false,
    requestId: 'r1',
    icon: 'person',
  },
  {
    id: 'notif_reply',
    kind: 'discussion',
    title: 'Neue Antwort',
    message: 'Florian hat auf deinen Kommentar zu „Severance“ geantwortet',
    timestamp: now - 40 * MIN,
    read: true,
    navigateTo: '/series/95396',
    icon: 'chat',
  },
  {
    id: 'notif_patch',
    kind: 'discussion',
    sourceType: 'admin_message',
    title: 'Neue Patch Notes: Bücher, Pets und Antworten im Chat',
    message:
      'Im Bereich „Lesen“ gibt es jetzt Bücher, deine Pets laufen über das Dock, und im Chat antwortest du direkt auf Nachrichten. Dazu kommen eigene Listen, Long-Press und öffentliche Profile.',
    timestamp: now - 19 * MIN,
    read: false,
    navigateTo: '/patch-notes',
    icon: 'announcement',
  },
  {
    id: 'chat_1',
    kind: 'chat',
    title: 'Florian',
    message: 'Hast du die neue Folge schon gesehen?',
    timestamp: now - 3 * MIN,
    read: false,
    navigateTo: '/chat/flo',
    icon: 'chat',
  },
  {
    id: 'chat_2',
    kind: 'chat',
    title: 'Bärbel',
    message: 'Bild',
    timestamp: now - 22 * MIN,
    read: false,
    navigateTo: '/chat/baerbel',
    icon: 'chat',
  },
];

export const NotificationHubPreview = ({ friendsOnly = false }: { friendsOnly?: boolean }) => {
  const notifications = useMemo(() => {
    const lastRead = now - 20 * MIN;
    const bundles: UnifiedNotification[] = bundleActivities(ACTIVITIES).map((bundle) => {
      const single = bundle.titles.length === 1 ? bundle.titles[0] : null;
      return {
        id: bundle.id,
        kind: 'activity',
        title: bundle.userName,
        message: bundleSentence(bundle),
        timestamp: bundle.latest,
        read: bundle.latest <= lastRead,
        navigateTo: single ? (activityPath(single.media, single.id) ?? undefined) : undefined,
        icon: 'tv',
        bundle,
      };
    });
    return [...(friendsOnly ? [] : OTHERS), ...bundles].sort((a, b) => b.timestamp - a.timestamp);
  }, [friendsOnly]);

  const noop = () => {};
  return (
    <NotificationSheet
      isOpen
      onClose={noop}
      notifications={notifications}
      onMarkAllRead={noop}
      onMarkAsRead={noop}
      onDismissAnnouncement={noop}
      onAcceptRequest={noop}
      onDeclineRequest={noop}
      onAcceptRecommendation={noop}
      onDeclineRecommendation={noop}
    />
  );
};
