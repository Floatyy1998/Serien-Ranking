import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CaseOpeningOverlay } from '../../components/pet/CaseOpeningOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useEnhancedFirebaseCache } from '../../hooks/data/useEnhancedFirebaseCache';
import { useReadingAreas } from '../../hooks/ui/useReadingAreas';
import { useOwnPhotoURL } from '../../services/profile/ownProfilePhoto';
import '../Books/components/books.css';
import { useBookYear } from '../Books/hooks/useBookYear';
import { useUnifiedNotifications } from '../HomePage/hooks/useUnifiedNotifications';
import { HomeSearchOverlay } from '../HomePage/sections/HomeSearchOverlay';
import { NotificationSheet } from '../HomePage/sheets/NotificationSheet';
import { ReadingBody } from './ReadingBody';
import { ReadingDeck } from './ReadingDeck';
import './ReadingPage.css';

interface SearchState {
  filter: 'all' | 'books' | 'manga';
  query?: string;
  /** Route, auf der die Suche geöffnet wurde — dort lebt das Overlay. */
  path: string;
}

/**
 * Lesen: eine Seite für Bücher und Manga. /reading, /books und /manga zeigen dieselbe,
 * dauerhaft gemountete Seite — alte Links und Benachrichtigungen landen weiter richtig.
 */
export const ReadingPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const areas = useReadingAreas();
  const bookYear = useBookYear();
  const notifs = useUnifiedNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [caseOpeningDrop, setCaseOpeningDrop] = useState<{
    dropId: string;
    accessoryId: string;
    rarity: string;
  } | null>(null);
  const [search, setSearch] = useState<SearchState | null>(null);

  const { data: userData } = useEnhancedFirebaseCache<{ photoURL?: string }>(
    user ? `users/${user.uid}` : '',
    { ttl: 5 * 60 * 1000, useRealtimeListener: true }
  );
  const photoURL = useOwnPhotoURL(userData?.photoURL || user?.photoURL);

  const readingRef = useRef<HTMLDivElement>(null);

  const openSearch = useCallback(
    (filter: SearchState['filter'], query?: string) => setSearch({ filter, query, path: pathname }),
    [pathname]
  );
  const scrollTo = (ref: { current: HTMLElement | null }) =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="bk-page" style={{ background: currentTheme.background.default }}>
      <ReadingDeck
        areas={areas}
        bookYear={bookYear}
        photoURL={photoURL}
        displayName={user?.displayName}
        totalUnreadBadge={notifs.totalUnreadBadge}
        onNotificationsOpen={() => setShowNotifications(true)}
        onSearch={openSearch}
        onShowReading={() => scrollTo(readingRef)}
        onShowCollection={() => navigate('/manga/collection')}
      />

      <ReadingBody
        areas={areas}
        bookYear={bookYear}
        readingRef={readingRef}
        onSearch={openSearch}
      />

      <HomeSearchOverlay
        open={!!search}
        onClose={() => setSearch(null)}
        homePath={search?.path ?? pathname}
        scope="reading"
        areas={areas}
        initialFilter={search?.filter}
        initialQuery={search?.query}
      />

      <NotificationSheet
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          notifs.handleMarkAllNotificationsRead();
        }}
        notifications={notifs.unifiedNotifications}
        onMarkAllRead={notifs.handleMarkAllNotificationsRead}
        onMarkAsRead={notifs.markAsRead}
        onDismissAnnouncement={notifs.dismissAnnouncement}
        onAcceptRequest={notifs.acceptFriendRequest}
        onDeclineRequest={notifs.declineFriendRequest}
        onAcceptRecommendation={notifs.acceptRecommendation}
        onDeclineRecommendation={notifs.declineRecommendation}
        onOpenCaseOpening={setCaseOpeningDrop}
      />
      <CaseOpeningOverlay dropData={caseOpeningDrop} onClose={() => setCaseOpeningDrop(null)} />
    </div>
  );
};
