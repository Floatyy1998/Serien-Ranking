import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaseOpeningOverlay } from '../../components/pet/CaseOpeningOverlay';
import { ReadingSwitch } from '../../components/reading/ReadingSwitch';
import { useAuth } from '../../contexts/AuthContext';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { usePetEnabled } from '../../hooks/pet/usePetEnabled';
import { t } from '../../services/i18n';
import { AdminMessageBanner } from './cards/AdminMessageBanner';
import { PlayTestBanner } from './cards/PlayTestBanner';
import { useGreetingIdentity } from './hooks/useGreetingIdentity';
import { useHomeConfig } from './hooks/useHomeConfig';
import { useUnifiedNotifications } from './hooks/useUnifiedNotifications';
import { GreetingSection, type GreetingPod } from './sections/GreetingSection';
import { ReadingHomeSections } from './sections/ReadingHomeSections';
import { NotificationSheet } from './sheets/NotificationSheet';
import { WrappedNotification } from './sheets/WrappedNotification';

/**
 * Startseite beim Schwerpunkt „Manga & Bücher": die Lese-Übersicht mit Begrüßung,
 * Glocke, Freunde-Aktivität, Bestenliste, Badges und Pet. Die Serien-Startseite
 * liegt dann unter /watch hinter dem Dock-Platz „Serien".
 */
export const ReadingHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const identity = useGreetingIdentity(user ?? null);
  const config = useHomeConfig(user?.uid ?? '');
  const petEnabled = usePetEnabled();
  const notifs = useUnifiedNotifications();
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();
  const [showNotifications, setShowNotifications] = useState(false);
  const [caseOpeningDrop, setCaseOpeningDrop] = useState<{
    dropId: string;
    accessoryId: string;
    rarity: string;
  } | null>(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const pods = useMemo<GreetingPod[]>(
    () => [
      { key: 'books', value: bookList.length, label: t('Bücher'), to: '/books', highlight: false },
      { key: 'manga', value: mangaList.length, label: 'Manga', to: '/manga', highlight: false },
    ],
    [bookList.length, mangaList.length]
  );

  if (!user) return <div>{t('Weiterleitung…')}</div>;

  return (
    <div style={{ overflowY: 'auto', position: 'relative' }}>
      <WrappedNotification />
      <AdminMessageBanner />
      <PlayTestBanner />

      <GreetingSection
        displayName={identity.displayName}
        photoURL={identity.photoURL}
        totalUnreadBadge={notifs.totalUnreadBadge}
        onNotificationsOpen={() => setShowNotifications(true)}
        pods={pods}
        searchHint={t('Bücher, Manga und mehr')}
        above={<ReadingSwitch active="all" />}
      />

      <ReadingHomeSections config={config} />

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

      {petEnabled && (
        <CaseOpeningOverlay dropData={caseOpeningDrop} onClose={() => setCaseOpeningDrop(null)} />
      )}
    </div>
  );
};
