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
  act(10, { type: 'series_added', itemTitle: 'Bones - Die Knochenjägerin', tmdbId: 1911 }),
  act(13, { type: 'movie_added', itemTitle: 'Wie verhext', tmdbId: 1538497, itemType: 'movie' }),
  act(14, { type: 'movie_added', itemTitle: 'Street Fighter', tmdbId: 1153576, itemType: 'movie' }),
  act(14, { type: 'series_added', itemTitle: 'Emily in Paris', tmdbId: 82596 }),
  act(15, { type: 'series_added', itemTitle: 'Bridgerton', tmdbId: 91239 }),
  act(15, { type: 'series_added', itemTitle: 'Percy Jackson: Die Serie', tmdbId: 103540 }),
  act(15, { type: 'series_added', itemTitle: 'The Body', tmdbId: 291507 }),
  act(15, { type: 'series_added', itemTitle: 'The Gilded Age', tmdbId: 81723 }),
  act(16, { type: 'series_added', itemTitle: 'Arcane', tmdbId: 94605 }),
  act(16, { type: 'series_added', itemTitle: 'Nature', tmdbId: 14951 }),
  act(16, { type: 'series_added', itemTitle: "Grey's Anatomy", tmdbId: 1416 }),
  act(28, { type: 'rating_updated', itemTitle: 'Heirate meinen Mann', tmdbId: 221851, rating: 8 }),
  act(28, {
    type: 'series_added_to_watchlist',
    itemTitle: 'Heirate meinen Mann',
    tmdbId: 221851,
  }),
  act(29, { type: 'series_added', itemTitle: 'Heirate meinen Mann', tmdbId: 221851 }),
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
  act(26 * 60, {
    type: 'movie_added',
    itemTitle: 'The Hunger Games: Catching Fire',
    tmdbId: 101299,
    itemType: 'movie',
    userId: 'saskia',
    userName: 'saskiasteitz',
  }),
  act(3 * 24 * 60, {
    type: 'series_added_to_watchlist',
    itemTitle: 'Severance',
    tmdbId: 95396,
    userId: 'flo',
    userName: 'Florian',
  }),
  act(3 * 24 * 60 + 5, {
    type: 'series_added',
    itemTitle: 'The Bear',
    tmdbId: 136315,
    userId: 'flo',
    userName: 'Florian',
  }),
  act(3 * 24 * 60 + 6, {
    type: 'rating_updated',
    itemTitle: 'Shōgun',
    tmdbId: 126308,
    rating: 9,
    userId: 'flo',
    userName: 'Florian',
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

const ticket = (
  id: string,
  minutesAgo: number,
  title: string,
  message: string,
  read = true
): UnifiedNotification => ({
  id: `notif_${id}`,
  kind: 'bug_ticket',
  title,
  message,
  timestamp: now - minutesAgo * MIN,
  read,
  navigateTo: '/admin?tab=tickets',
  icon: 'feature',
  groupKey: `ticket:${message.match(/"(.+)"/)?.[1] ?? id}`,
});

const TICKETS: UnifiedNotification[] = [
  ticket(
    't1',
    8,
    'Neuer Kommentar',
    'Bärbel hat auf "ISBN gesuchte Mangas werden doppelt angezeigt" geantwortet',
    false
  ),
  ticket(
    't2',
    16 * 60,
    'Neuer Kommentar',
    'Bärbel hat auf "ISBN gesuchte Mangas werden doppelt angezeigt" geantwortet'
  ),
  ticket(
    't3',
    17 * 60,
    'Neuer Kommentar',
    'Bärbel hat auf "ISBN gesuchte Mangas werden doppelt angezeigt" geantwortet'
  ),
  ticket(
    't4',
    16 * 60,
    'Neuer Kommentar',
    'Flo hat auf "Profilanzeige auf Bücher erweitern" geantwortet'
  ),
  ticket(
    't5',
    16 * 60 + 2,
    'Neuer Kommentar',
    'Flo hat auf "Profilanzeige auf Bücher erweitern" geantwortet'
  ),
  ticket('t6', 16 * 60 + 5, 'Neuer Feature-Wunsch', 'Flo: "Profilanzeige auf Bücher erweitern"'),
  ticket('t7', 16 * 60 + 9, 'Neuer Feature-Wunsch', 'Flo: "Bewertungslasche für Bücher"'),
  ticket('t8', 17 * 60, 'Neuer Feature-Wunsch', 'orksorgie: "Büchersuche"'),
  ticket('t9', 30 * 60, 'Neuer Feature-Wunsch', 'orksorgie: "Bücher Infos"'),
];

const OTHERS: UnifiedNotification[] = [
  ...TICKETS,
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
