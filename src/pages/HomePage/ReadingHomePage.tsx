import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaseOpeningOverlay } from '../../components/pet/CaseOpeningOverlay';
import { ReadingGreetingTitle } from '../../components/reading/ReadingGreetingTitle';
import { useAuth } from '../../contexts/AuthContext';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { usePetEnabled } from '../../hooks/pet/usePetEnabled';
import { useReadingAreas } from '../../hooks/ui/useReadingAreas';
import { usesArea } from '../../lib/reading/readingMedium';
import { t } from '../../services/i18n';
import { useBookYear } from '../Books/hooks/useBookYear';
import { AdminMessageBanner } from './cards/AdminMessageBanner';
import { PlayTestBanner } from './cards/PlayTestBanner';
import { useGreetingIdentity } from './hooks/useGreetingIdentity';
import { useHomeConfig } from './hooks/useHomeConfig';
import { useUnifiedNotifications } from './hooks/useUnifiedNotifications';
import { GreetingSection, type GreetingPod } from './sections/GreetingSection';
import { HomeSearchOverlay } from './sections/HomeSearchOverlay';
import { ReadingHomeSections } from './sections/ReadingHomeSections';
import { NotificationSheet } from './sheets/NotificationSheet';
import { WrappedNotification } from './sheets/WrappedNotification';

type SearchFilter = 'all' | 'books' | 'manga';

/**
 * Startseite beim Schwerpunkt „Manga & Bücher": Lese-Gruß, gemeinsame Suche, Glocke,
 * Freunde-Aktivität und der Inhalt der Lesen-Seite. Die Serien-Startseite liegt dann
 * unter /watch hinter dem Dock-Platz „Serien".
 */
export const ReadingHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const identity = useGreetingIdentity(user ?? null);
  const config = useHomeConfig(user?.uid ?? '');
  const petEnabled = usePetEnabled();
  const notifs = useUnifiedNotifications();
  const areas = useReadingAreas();
  const bookYear = useBookYear();
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState<{ filter: SearchFilter; query?: string } | null>(null);
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
      ...(usesArea(areas, 'books')
        ? [
            {
              key: 'books',
              value: bookList.length,
              label: t('Bücher'),
              to: '/books',
              highlight: false,
            },
          ]
        : []),
      ...(usesArea(areas, 'manga')
        ? [
            {
              key: 'manga',
              value: mangaList.length,
              label: 'Manga',
              to: '/manga',
              highlight: false,
            },
          ]
        : []),
    ],
    [areas, bookList.length, mangaList.length]
  );

  if (!user) return <div>{t('Weiterleitung…')}</div>;

  const openSearch = (filter: SearchFilter, query?: string) => setSearch({ filter, query });

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
        searchHint={
          areas === 'books'
            ? t('Titel, Autor oder ISBN suchen...')
            : areas === 'manga'
              ? t('Manga, Manhwa, Manhua suchen...')
              : t('Bücher und Manga suchen...')
        }
        onSearch={() => openSearch(areas === 'both' ? 'all' : areas)}
        title={
          <ReadingGreetingTitle
            displayName={identity.displayName}
            areas={areas}
            onSearch={(query, medium) => openSearch(medium, query)}
          />
        }
      />

      <ReadingHomeSections
        config={config}
        areas={areas}
        bookYear={bookYear}
        onSearch={(filter) => openSearch(filter)}
      />

      <HomeSearchOverlay
        open={!!search}
        onClose={() => setSearch(null)}
        homePath="/"
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

      {petEnabled && (
        <CaseOpeningOverlay dropData={caseOpeningDrop} onClose={() => setCaseOpeningDrop(null)} />
      )}
    </div>
  );
};
