import {
  AutoAwesome,
  Bookmarks,
  LocalLibrary,
  PauseCircle,
  Redeem,
  Search,
  UploadFile,
} from '@mui/icons-material';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/ui';
import { CaseOpeningOverlay } from '../../components/pet/CaseOpeningOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { useBooksList } from '../../contexts/BooksListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBooksForYourShows } from '../../hooks/books/useBasedOnBooks';
import { useBookEvents } from '../../hooks/books/useBookEvents';
import { useReadingGoal } from '../../hooks/books/useReadingGoal';
import { useEnhancedFirebaseCache } from '../../hooks/data/useEnhancedFirebaseCache';
import { isFinishedInYear, sortByRecentActivity } from '../../lib/books/bookProgress';
import { computeBookYearStats } from '../../lib/books/bookStats';
import { tasteGenres } from '../../lib/books/readingTaste';
import { t } from '../../services/i18n';
import { useOwnPhotoURL } from '../../services/profile/ownProfilePhoto';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { Book } from '../../types/Book';
import { useUnifiedNotifications } from '../HomePage/hooks/useUnifiedNotifications';
import { NotificationSheet } from '../HomePage/sheets/NotificationSheet';
import { HomeSearchOverlay } from '../HomePage/sections/HomeSearchOverlay';
import { Bookshelf } from './components/Bookshelf';
import { ProgressSheet } from './components/ProgressSheet';
import './components/books.css';
import { useBookActions } from './hooks/useBookActions';
import { GENRES } from './data/genres';
import { DiscoverShelf, FeaturedHero, GenreTiles, MixedShelf } from './discover/DiscoverParts';
import { ShelfDedupeContext, useShelfDedupeStore } from './discover/discoverDedupe';
import { useAddFlow } from './discover/useAddFlow';
import { useNextVolumes } from './hooks/useNextVolumes';
import { useReadingTaste } from './hooks/useReadingTaste';
import { BookCarouselSection } from './sections/BookCarouselSection';
import { BooksDeck } from './sections/BooksDeck';
import { BookStatsSection } from './sections/BookStatsSection';
import { CurrentlyReadingSection } from './sections/CurrentlyReadingSection';
import { ForYourShowsSection } from './sections/ForYourShowsSection';
import { NextVolumesSection } from './sections/NextVolumesSection';
import { ReadingGoalSection } from './sections/ReadingGoalSection';

const GENRE_SHELVES = ['fantasy', 'thriller', 'romance', 'scifi', 'ya', 'classics'] as const;
const SHELF_ORDER = ['new', 'hero', 'for-you', ...GENRE_SHELVES];

export const BooksPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { bookList } = useBooksList();
  const navigate = useNavigate();
  const actions = useBookActions();
  const notifs = useUnifiedNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [caseOpeningDrop, setCaseOpeningDrop] = useState<{
    dropId: string;
    accessoryId: string;
    rarity: string;
  } | null>(null);
  const [progressBook, setProgressBook] = useState<Book | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const readingRef = useRef<HTMLElement>(null);
  const [now] = useState(() => Date.now());
  const year = new Date(now).getFullYear();

  const { data: userData } = useEnhancedFirebaseCache<{ photoURL?: string }>(
    user ? `users/${user.uid}` : '',
    { ttl: 5 * 60 * 1000, useRealtimeListener: true }
  );
  const photoURL = useOwnPhotoURL(userData?.photoURL || user?.photoURL);

  const { events } = useBookEvents([year]);
  const { goal, save: saveGoal } = useReadingGoal(year);
  const yearStats = useMemo(
    () => computeBookYearStats(bookList, events, year, now),
    [bookList, events, year, now]
  );

  const sorted = useMemo(() => sortByRecentActivity(bookList), [bookList]);
  const reading = useMemo(() => sorted.filter((b) => b.status === 'reading'), [sorted]);
  const planned = useMemo(
    () =>
      bookList
        .filter((b) => b.status === 'planned' && !b.wishedAt)
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
    [bookList]
  );
  const wished = useMemo(
    () =>
      bookList
        .filter((b) => !!b.wishedAt)
        .sort((a, b) => (b.wishedAt ?? '').localeCompare(a.wishedAt ?? '')),
    [bookList]
  );
  const paused = useMemo(() => sorted.filter((b) => b.status === 'paused'), [sorted]);
  const finishedThisYear = yearStats.finishedBooks;
  const shelfBooks = useMemo(() => {
    const thisYear = bookList.filter((b) => isFinishedInYear(b, year));
    return (thisYear.length >= 3 ? thisYear : bookList.filter((b) => b.status === 'completed'))
      .slice()
      .sort(
        (a, b) =>
          new Date(a.completedAt || a.addedAt).getTime() -
          new Date(b.completedAt || b.addedAt).getTime()
      );
  }, [bookList, year]);
  const shelfIsYear =
    shelfBooks.some((b) => isFinishedInYear(b, year)) &&
    shelfBooks.every((b) => isFinishedInYear(b, year));

  const { progress: nextVolumes } = useNextVolumes(bookList, now);
  const { suggestions, loading: showsLoading } = useBooksForYourShows();
  const { openAdd, sheet: addSheet } = useAddFlow();
  const dedupe = useShelfDedupeStore(SHELF_ORDER);
  const taste = useReadingTaste(bookList);
  const favoriteGenres = useMemo(
    () =>
      tasteGenres(taste)
        .slice(0, 2)
        .map((g) => g.id),
    [taste]
  );
  const favoriteLabels = favoriteGenres
    .map((id) => GENRES.find((g) => g.id === id)?.label())
    .filter(Boolean)
    .join(' & ');

  const quickAdd = useCallback(
    (book: Book, pages: number) => void actions.saveProgress(book, (book.currentPage || 0) + pages),
    [actions]
  );

  const hasBooks = bookList.length > 0;

  return (
    <div className="bk-page" style={{ background: currentTheme.background.default }}>
      <BooksDeck
        books={bookList}
        yearStats={yearStats}
        photoURL={photoURL}
        displayName={user?.displayName}
        totalUnreadBadge={notifs.totalUnreadBadge}
        onNotificationsOpen={() => setShowNotifications(true)}
        onSearch={() => setSearchOpen(true)}
        onShowReading={() =>
          readingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      />

      {!hasBooks && (
        <div className="bk-welcome">
          <div className="bk-welcome-spines" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  height: 44 + ((i * 13) % 22),
                  background: `linear-gradient(180deg, ${currentTheme.primary}${['cc', '88', 'aa', '66', '99'][i]}, ${currentTheme.accent}55)`,
                }}
              />
            ))}
          </div>
          <div className="bk-welcome-copy">
            <h2 className="bk-welcome-title" style={{ color: currentTheme.text.secondary }}>
              {t('Dein Regal ist noch leer')}
            </h2>
            <p className="bk-muted" style={{ color: currentTheme.text.muted }}>
              {t('Such dein aktuelles Buch oder hol deine Bibliothek von Goodreads rüber.')}
            </p>
          </div>
          <div className="bk-welcome-actions">
            <button
              type="button"
              className="bk-cta"
              style={{
                color: getOptimalTextColor(currentTheme.primary),
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              }}
              onClick={() => setSearchOpen(true)}
            >
              <Search style={{ fontSize: 18 }} />
              {t('Buch suchen')}
            </button>
            <button
              type="button"
              className="bk-cta bk-cta--ghost"
              style={{ color: currentTheme.text.secondary }}
              onClick={() => navigate('/books/import')}
            >
              <UploadFile style={{ fontSize: 18 }} />
              {t('Importieren')}
            </button>
          </div>
        </div>
      )}

      <CurrentlyReadingSection
        ref={readingRef}
        books={reading}
        onQuickAdd={quickAdd}
        onOpenProgress={setProgressBook}
      />

      {hasBooks && (
        <ReadingGoalSection
          year={year}
          goal={goal}
          finished={finishedThisYear}
          now={now}
          onSaveGoal={(g) => void saveGoal(g)}
        />
      )}

      <NextVolumesSection items={nextVolumes} />

      <BookCarouselSection
        books={planned.slice(0, 20)}
        title={t('Dein Stapel')}
        icon={<Bookmarks />}
        iconColor={currentTheme.accent}
        onSeeAll={() => navigate('/books/shelf?status=planned')}
        seeAllLabel={t('Alle')}
      />

      <BookCarouselSection
        books={wished.slice(0, 20)}
        title={t('Deine Wunschliste')}
        icon={<Redeem />}
        iconColor={currentTheme.status.warning}
      />

      <BookCarouselSection
        books={paused}
        title={t('Pausiert')}
        icon={<PauseCircle />}
        iconColor={currentTheme.text.muted}
      />

      {shelfBooks.length > 0 && (
        <section className="bk-section">
          <SectionHeader
            icon={<LocalLibrary />}
            iconColor={currentTheme.status.warning}
            title={shelfIsYear ? t('Dein Regal {year}', { year }) : t('Dein Regal')}
            onSeeAll={() => navigate('/books/shelf')}
            seeAllLabel={t('Ganzes Regal')}
          />
          <div className="bk-pad">
            <Bookshelf books={shelfBooks.slice(-60)} />
          </div>
        </section>
      )}

      <BookStatsSection stats={yearStats} currentMonth={new Date(now).getMonth()} />

      {hasBooks && (
        <div className="bk-divider">
          <span style={{ color: currentTheme.text.muted }}>{t('Entdecken')}</span>
        </div>
      )}

      <ShelfDedupeContext.Provider value={dedupe}>
        <FeaturedHero onAdd={openAdd} />

        <DiscoverShelf
          id="new"
          ranked
          onAdd={openAdd}
          iconColor={currentTheme.status.warning}
          dedupeKey="new"
        />

        {favoriteGenres.length > 0 && (
          <MixedShelf
            ids={favoriteGenres}
            onAdd={openAdd}
            title={t('Für dich')}
            caption={t('Weil du gern {genres} liest', { genres: favoriteLabels })}
            icon={<AutoAwesome />}
            iconColor={currentTheme.accent}
            dedupeKey="for-you"
          />
        )}

        <ForYourShowsSection suggestions={suggestions} loading={showsLoading} />

        <GenreTiles />

        {GENRE_SHELVES.map((id) => (
          <MixedShelf key={id} ids={[id]} onAdd={openAdd} dedupeKey={id} />
        ))}
      </ShelfDedupeContext.Provider>

      {addSheet}

      <HomeSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        homePath="/books"
        initialFilter="books"
      />

      <ProgressSheet
        book={progressBook}
        onClose={() => setProgressBook(null)}
        onSave={(page, pageCount) => {
          if (progressBook) void actions.saveProgress(progressBook, page, pageCount);
          setProgressBook(null);
        }}
        onFinish={() => {
          if (progressBook) void actions.changeStatus(progressBook, 'completed');
          setProgressBook(null);
        }}
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
