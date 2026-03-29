import { useCallback, useMemo, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContextDef';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';

export interface UnifiedNotification {
  id: string;
  kind: 'activity' | 'request' | 'discussion' | 'announcement' | 'bug_ticket';
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
    | 'bug';
  requestId?: string;
  notificationId?: string;
  fromUsername?: string;
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
}

export function useUnifiedNotifications(): UseUnifiedNotificationsReturn {
  const {
    unreadActivitiesCount,
    friendActivities,
    friendRequests,
    unreadRequestsCount,
    markActivitiesAsRead,
    markRequestsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
  } = useOptimizedFriends();
  const {
    notifications,
    unreadCount: notificationUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    } catch {
      return [];
    }
  });

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissedAnnouncements((prev) => {
      const updated = [...prev, id];
      localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
        read: dismissedAnnouncements.includes(ann.id),
        navigateTo: ann.navigateTo,
        icon: 'announcement',
      });
    }

    // Friend activities
    for (const act of friendActivities) {
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
        read: unreadActivitiesCount === 0 || false,
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
      items.push({
        id: `notif_${n.id}`,
        kind: isBugTicket ? 'bug_ticket' : 'discussion',
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read,
        navigateTo: isBugTicket ? '/bug-report' : navigateTo,
        notificationId: n.id,
        icon: isBugTicket
          ? 'bug'
          : n.type === 'discussion_reply'
            ? 'chat'
            : n.type === 'spoiler_flag'
              ? 'flag'
              : n.type === 'discussion_like'
                ? 'heart'
                : 'chat',
      });
    }

    // Sort by timestamp descending, limit to 30
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, 30);
  }, [
    friendActivities,
    friendRequests,
    notifications,
    unreadActivitiesCount,
    unreadRequestsCount,
    dismissedAnnouncements,
  ]);

  const totalUnreadBadge =
    unreadActivitiesCount +
    notificationUnreadCount +
    ANNOUNCEMENTS.filter((a) => !dismissedAnnouncements.includes(a.id)).length;

  const handleMarkAllNotificationsRead = useCallback(() => {
    markActivitiesAsRead();
    markRequestsAsRead();
    markAllAsRead();
    // Dismiss all announcements
    const allIds = ANNOUNCEMENTS.map((a) => a.id);
    setDismissedAnnouncements(allIds);
    localStorage.setItem('dismissed_announcements', JSON.stringify(allIds));
  }, [markActivitiesAsRead, markRequestsAsRead, markAllAsRead]);

  return {
    unifiedNotifications,
    totalUnreadBadge,
    dismissAnnouncement,
    handleMarkAllNotificationsRead,
    markAsRead,
    acceptFriendRequest,
    declineFriendRequest,
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
