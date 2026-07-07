import { useCallback, useEffect, useMemo, useState } from 'react';
import { dbRef, userPath } from '../../services/db/ref';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useRecommendations } from '../../hooks/useRecommendations';
import type { RecommendationMediaType } from '../../types/Recommendation';
import { ADMIN_UID } from '../../config/admin';

export interface RecommendationCardData {
  recId: string;
  mediaId: number;
  mediaType: RecommendationMediaType;
  mediaTitle: string;
  mediaPoster?: string;
  mediaBackdrop?: string;
  senderName: string;
  senderPhotoURL?: string;
  message?: string;
}

export interface UnifiedNotification {
  id: string;
  kind:
    | 'activity'
    | 'request'
    | 'discussion'
    | 'announcement'
    | 'bug_ticket'
    | 'pet'
    | 'recommendation';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  navigateTo?: string;
  icon:
    | 'tv'
    | 'movie'
    | 'star'
    | 'watchlist'
    | 'person'
    | 'chat'
    | 'heart'
    | 'flag'
    | 'announcement'
    | 'bug'
    | 'feature'
    | 'pet'
    | 'recommendation';
  requestId?: string;
  notificationId?: string;
  fromUsername?: string;
  action?: 'case_opening';
  dropData?: { dropId: string; accessoryId: string; rarity: string };
  recommendationData?: RecommendationCardData;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  navigateTo: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'announcement_anime-season-2026-07',
    title: 'Neu: Anime-Season-Kalender',
    message:
      'Alle Anime der Season auf einen Blick: Premieren-Timeline mit Live-Countdown zur nächsten großen Premiere, „Staffel 2"/„NEU"-Chips, Termine wie in deinem Kalender (TVMaze-geprüft) und Direkteinstieg zu deinen Serien. Alles in den Patch Notes.',
    timestamp: new Date('2026-07-02T20:00:00+02:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_friend-insights-2026-06-28',
    title: 'Neu: Mehr über deine Freunde',
    message:
      'Freunde-Stand auf jeder Seriendetail-Seite, „Was schaut Lisa gerade", „Worauf wartet sie", Pet-Sneakpeek mit Snack-Geschenk und Air-Date + Watched-Date pro Folge. Alles in den Patch Notes.',
    timestamp: new Date('2026-06-28T20:10:00+02:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_anime-activity-polish-2026-06',
    title: 'Neu: Anime-Filler, Aktivitäts-Ticker & mehr',
    message:
      'Anime-Filler/Recap auf Detail-Seite und in der Episoden-Liste, Freunde-Aktivitäten als sanfter Ticker auf der Homepage, Streaming-Reminder mit Pausieren-Button, Pet-Reaktionen auf Streaks, sanfte Seitenwechsel – alles in den Patch Notes.',
    timestamp: new Date('2026-06-27T08:00:00+02:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_recommendations-2026-06',
    title: 'Neu: Empfehlungen an Freunde',
    message:
      'Auf jeder Detailseite ist jetzt ein „Empfehlen"-Button. Schick Serien & Filme an deine Freunde – sie sehen die Empfehlung als Karte im Bell-Hub mit „Anschauen" oder „Nope". Freunde, die das Item schon haben, sind ausgegraut.',
    timestamp: new Date('2026-06-06T06:00:00+02:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_streaming-abos-2026-06',
    title: 'Neu: Streaming-Abos',
    message:
      'Pflege deine aktiven Anbieter, sieh was du ungenutzt zahlst, finde Watchlist-Lücken und filtere alles nach deinen Abos. Calendar bekommt Brand-Color-Streifen, Override pro Serie ist möglich.',
    timestamp: new Date('2026-06-01T16:00:00+02:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_homepage-layout-2026-02',
    title: 'Neues Feature: Homepage Layout',
    message:
      'Du kannst jetzt deine Homepage-Sektionen sortieren und ausblenden! Gehe zu Profil \u2192 Homepage Layout um es auszuprobieren.',
    timestamp: new Date('2026-02-28T12:00:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_updates-2026-03',
    title: 'Neue Features: Kalender, Fortschritt & mehr',
    message: 'Neuer Kalender, Progress-Bars, Provider-Filter & Schnellmarkierung.',
    timestamp: new Date('2026-03-01T12:00:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_ki-empfehlungen-2026-03',
    title: 'Neu: KI-Empfehlungen',
    message:
      'Personalisierte Serien- und Film-Vorschläge basierend auf deinem Geschmack. Jetzt unter "Für dich" auf der Startseite ausprobieren!',
    timestamp: new Date('2026-03-26T22:00:00+01:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_card-redesign-2026-03',
    title: 'Neues Design: Trending & Co.',
    message:
      'Trending, Saisonal und Bestbewertet haben ein neues Kino-Design mit Rang-Nummern, Genres und Ratings bekommen!',
    timestamp: new Date('2026-03-27T18:00:00+01:00').getTime(),
    navigateTo: '/patch-notes',
  },
  {
    id: 'announcement_qol-update-2026-03',
    title: 'QoL-Update: Kalender, Detail & Provider',
    message:
      'Auto-Scroll zum heutigen Tag, Staffelpause/Staffelende-Chips, Provider-Badges auf allen Karten, smarter Status-Badge und mehr!',
    timestamp: new Date('2026-03-27T13:30:00+01:00').getTime(),
    navigateTo: '/patch-notes',
  },
];

export interface UseUnifiedNotificationsReturn {
  unifiedNotifications: UnifiedNotification[];
  totalUnreadBadge: number;
  dismissAnnouncement: (id: string) => void;
  handleMarkAllNotificationsRead: () => void;
  markAsRead: (id: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  acceptRecommendation: (recId: string) => void;
  declineRecommendation: (recId: string) => void;
}

export function useUnifiedNotifications(): UseUnifiedNotificationsReturn {
  const {
    unreadActivitiesCount,
    lastReadActivitiesTime,
    friendActivities,
    friendRequests,
    unreadRequestsCount,
    markActivitiesAsRead,
    markRequestsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
  } = useOptimizedFriends();
  const { user } = useAuth() || {};
  const isAdmin = user?.uid === ADMIN_UID;
  const {
    notifications,
    unreadCount: notificationUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const {
    recommendations,
    pendingCount: pendingRecommendationsCount,
    accept: acceptRecommendation,
    decline: declineRecommendation,
  } = useRecommendations();

  // Source of truth: Firebase. localStorage wurde von PWAs geleert
  // (iOS WebKit 7-Tage-Regel, Android unter Storage-Pressure), wodurch der
  // Bell-Badge nach jedem Cold-Start auf ANNOUNCEMENTS.length zurueckschnellte.
  // Wert wird mit der uid getaggt, sodass beim User-Wechsel der derived
  // lastReadAnnouncementsTime per useMemo zurueck auf null faellt — ohne
  // synchronen setState im Effect-Body.
  const [storedReadTime, setStoredReadTime] = useState<{ uid: string; ts: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    let cancelled = false;
    const ref = dbRef(userPath(uid, 'readTimes', 'announcements'));
    ref
      .once('value')
      .then((snap) => {
        if (cancelled) return;
        const val = snap.val();
        if (typeof val === 'number') {
          setStoredReadTime({ uid, ts: val });
        } else {
          // First-time hydration: alte Announcements nicht als "neu" auferstehen lassen
          const now = Date.now();
          setStoredReadTime({ uid, ts: now });
          ref.set(now).catch(() => {}); // bewusst still: Hydration-Write ist Best-effort
        }
      })
      .catch(() => {
        // offline — Badge faellt auf 0 zurueck statt faelschlich auf 5
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const lastReadAnnouncementsTime = useMemo(
    () => (user && storedReadTime?.uid === user.uid ? storedReadTime.ts : null),
    [user, storedReadTime]
  );

  const dismissAnnouncement = useCallback(
    (id: string) => {
      const ann = ANNOUNCEMENTS.find((a) => a.id === id);
      if (!ann || !user) return;
      const uid = user.uid;
      setStoredReadTime((prev) => {
        const current = prev?.uid === uid ? prev.ts : 0;
        const next = Math.max(current, ann.timestamp);
        if (next === current) return prev;
        dbRef(userPath(uid, 'readTimes', 'announcements'))
          .set(next)
          // bewusst still: lokaler State ist schon gesetzt, Firebase-Write ist Best-effort
          .catch(() => {});
        return { uid, ts: next };
      });
    },
    [user]
  );

  const unifiedNotifications = useMemo(() => {
    const items: UnifiedNotification[] = [];

    // Feature announcements
    for (const ann of ANNOUNCEMENTS) {
      items.push({
        id: ann.id,
        kind: 'announcement',
        title: ann.title,
        message: ann.message,
        timestamp: ann.timestamp,
        read: lastReadAnnouncementsTime !== null && ann.timestamp <= lastReadAnnouncementsTime,
        navigateTo: ann.navigateTo,
        icon: 'announcement',
      });
    }

    // Friend activities
    for (const act of friendActivities) {
      // „Gesehen"-Aktivitäten gehören in den Feed, NICHT in den Bell-Hub.
      if (act.type === 'episode_watched' || act.type === 'episodes_watched') continue;
      const isMovie =
        act.type === 'movie_added' ||
        act.type === 'movie_rated' ||
        act.type === 'rating_updated_movie' ||
        act.itemType === 'movie';
      const tmdbId = act.tmdbId || act.itemId;
      const isRating =
        act.type === 'rating_updated' ||
        act.type === 'rating_updated_movie' ||
        act.type === 'movie_rated' ||
        act.type === 'series_rated';
      const isWatchlist =
        act.type === 'series_added_to_watchlist' || act.type === 'movie_added_to_watchlist';

      items.push({
        id: `act_${act.id}`,
        kind: 'activity',
        title: act.userName || 'Freund',
        message: `hat "${act.itemTitle || 'Unbekannt'}" ${isRating ? 'bewertet' : isWatchlist ? 'auf die Watchlist gesetzt' : 'hinzugef\u00fcgt'}${isRating && act.rating ? ` (${act.rating}/10)` : ''}`,
        timestamp: act.timestamp,
        // Pro-Eintrag-Read-State statt „alle-oder-keiner": ein Eintrag gilt als
        // gelesen, wenn er älter ist als der letzte Lese-Zeitpunkt.
        read: lastReadActivitiesTime > 0 && act.timestamp <= lastReadActivitiesTime,
        navigateTo: tmdbId ? (isMovie ? `/movie/${tmdbId}` : `/series/${tmdbId}`) : undefined,
        icon: isRating ? 'star' : isWatchlist ? 'watchlist' : isMovie ? 'movie' : 'tv',
      });
    }

    // Friend requests
    for (const req of friendRequests) {
      items.push({
        id: `req_${req.id}`,
        kind: 'request',
        title: 'Freundschaftsanfrage',
        message: req.fromUsername || 'Unbekannt',
        timestamp: req.timestamp || req.sentAt || 0,
        read: unreadRequestsCount === 0,
        requestId: req.id,
        fromUsername: req.fromUsername,
        icon: 'person',
      });
    }

    // Discussion notifications
    for (const n of notifications) {
      let navigateTo: string | undefined;
      if (n.data?.discussionPath) {
        const path = n.data.discussionPath as string;
        if (path.includes('episode/')) {
          const match = path.match(/episode\/(\d+)_s(\d+)_e(\d+)/);
          if (match) navigateTo = `/episode/${match[1]}/s/${match[2]}/e/${match[3]}`;
        }
        if (!navigateTo) {
          const pathMatch = path.match(/discussions\/(series|movie)\/(\d+)/);
          if (pathMatch) navigateTo = `/${pathMatch[1]}/${pathMatch[2]}`;
        }
        if (!navigateTo && n.data.itemType && n.data.itemId) {
          navigateTo = `/${n.data.itemType}/${n.data.itemId}`;
        }
      }

      const isBugTicket = n.type === 'bug_ticket_reply' || n.type === 'bug_ticket_status';
      const isPet = n.type === 'accessory_drop';
      const isPendingDrop = n.type === 'pending_accessory_drop';

      const item: UnifiedNotification = {
        id: `notif_${n.id}`,
        kind: isPet || isPendingDrop ? 'pet' : isBugTicket ? 'bug_ticket' : 'discussion',
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read,
        navigateTo:
          isPet || isPendingDrop
            ? '/pets'
            : isBugTicket
              ? isAdmin
                ? `/admin?tab=tickets&ticket=${(n.data?.ticketId as string) || ''}`
                : '/bug-report'
              : navigateTo,
        notificationId: n.id,
        icon:
          isPet || isPendingDrop
            ? 'pet'
            : isBugTicket
              ? n.data?.ticketType === 'feature'
                ? 'feature'
                : 'bug'
              : n.type === 'discussion_reply'
                ? 'chat'
                : n.type === 'spoiler_flag'
                  ? 'flag'
                  : n.type === 'discussion_like'
                    ? 'heart'
                    : 'chat',
      };

      if (isPendingDrop && n.data) {
        item.action = 'case_opening';
        item.dropData = {
          dropId: n.data.dropId as string,
          accessoryId: n.data.accessoryId as string,
          rarity: n.data.rarity as string,
        };
      }

      items.push(item);
    }

    // Recommendations (only pending — accepted/declined disappear from feed)
    for (const rec of recommendations) {
      if (rec.status !== 'pending') continue;
      items.push({
        id: `rec_${rec.id}`,
        kind: 'recommendation',
        title: rec.senderName,
        message: `empfiehlt dir "${rec.mediaTitle}"`,
        timestamp: rec.timestamp,
        read: false,
        navigateTo: rec.mediaType === 'movie' ? `/movie/${rec.mediaId}` : `/series/${rec.mediaId}`,
        icon: 'recommendation',
        recommendationData: {
          recId: rec.id,
          mediaId: rec.mediaId,
          mediaType: rec.mediaType,
          mediaTitle: rec.mediaTitle,
          mediaPoster: rec.mediaPoster,
          mediaBackdrop: rec.mediaBackdrop,
          senderName: rec.senderName,
          senderPhotoURL: rec.senderPhotoURL,
          message: rec.message,
        },
      });
    }

    // Sort by timestamp descending, limit to 30
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, 30);
  }, [
    friendActivities,
    friendRequests,
    notifications,
    recommendations,
    lastReadActivitiesTime,
    unreadRequestsCount,
    lastReadAnnouncementsTime,
    isAdmin,
  ]);

  const totalUnreadBadge =
    unreadActivitiesCount +
    notificationUnreadCount +
    pendingRecommendationsCount +
    (lastReadAnnouncementsTime !== null
      ? ANNOUNCEMENTS.filter((a) => a.timestamp > lastReadAnnouncementsTime).length
      : 0);

  const handleMarkAllNotificationsRead = useCallback(() => {
    markActivitiesAsRead();
    markRequestsAsRead();
    markAllAsRead();
    if (!user) return;
    const uid = user.uid;
    // Mark only what is actually visible right now as read. The previous
    // max(now, latestAnnTs) trick pre-dismissed future-dated announcements
    // and – critically – also poisoned the read state for any announcement
    // that gets shipped later with a past timestamp (deploy-time < bell-open).
    // Plain `Date.now()` keeps the bell honest: future-dated entries stay
    // unread until they actually surface.
    const newReadTime = Date.now();
    setStoredReadTime({ uid, ts: newReadTime });
    dbRef(userPath(uid, 'readTimes', 'announcements'))
      .set(newReadTime)
      // bewusst still: lokaler State ist schon gesetzt, Firebase-Write ist Best-effort
      .catch(() => {});
  }, [markActivitiesAsRead, markRequestsAsRead, markAllAsRead, user]);

  // DevTools escape hatch – lets you reset the announcement read state if
  // you ever need to re-surface a notification (e.g. after a missed deploy).
  //   notificationsDebug.resetAnnouncements()
  //   notificationsDebug.setReadTime(ts)
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    (window as unknown as Record<string, unknown>).notificationsDebug = {
      resetAnnouncements: () => {
        dbRef(userPath(user.uid, 'readTimes', 'announcements'))
          .set(0)
          .then(() => location.reload());
      },
      setReadTime: (ts: number) => {
        dbRef(userPath(user.uid, 'readTimes', 'announcements')).set(ts);
      },
      currentReadTime: () => storedReadTime?.ts ?? null,
    };
  }, [user, storedReadTime]);

  const handleAcceptRecommendation = useCallback(
    (recId: string) => {
      void acceptRecommendation(recId);
    },
    [acceptRecommendation]
  );
  const handleDeclineRecommendation = useCallback(
    (recId: string) => {
      void declineRecommendation(recId);
    },
    [declineRecommendation]
  );

  return {
    unifiedNotifications,
    totalUnreadBadge,
    dismissAnnouncement,
    handleMarkAllNotificationsRead,
    markAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    acceptRecommendation: handleAcceptRecommendation,
    declineRecommendation: handleDeclineRecommendation,
  };
}

export function formatNotificationTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std`;
  const days = Math.floor(hours / 24);
  return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
}
