import { LibraryBooks, LocalLibrary, PauseCircle, Redeem } from '@mui/icons-material';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useBooksList } from '../../contexts/BooksListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBooksForYourShows } from '../../hooks/books/useBasedOnBooks';
import { useReadingGoal } from '../../hooks/books/useReadingGoal';
import { isFinishedInYear, sortByRecentActivity } from '../../lib/books/bookProgress';
import { forYouGenres, genreShelfOrder, pickedGenres } from '../../lib/books/genrePrefs';
import { tasteGenres } from '../../lib/books/readingTaste';
import { showToast } from '../../lib/interaction/toast';
import type { ShelfId } from '../../services/api/bookDiscovery';
import { setFavoriteBookGenres } from '../../services/books/bookService';
import { t } from '../../services/i18n';
import { Bookshelf } from './components/Bookshelf';
import './components/books.css';
import { GENRES } from './data/genres';
import { FeaturedHero } from './discover/DiscoverParts';
import { GenrePickerSheet } from './discover/GenrePicker';
import { useShelfDedupeStore } from './discover/discoverDedupe';
import { useAddFlow } from './discover/useAddFlow';
import type { BookYear } from './hooks/useBookYear';
import { useNextVolumes } from './hooks/useNextVolumes';
import { useReadingTaste } from './hooks/useReadingTaste';
import { BookCarouselSection } from './sections/BookCarouselSection';
import { BookStatsSection } from './sections/BookStatsSection';
import { ForYourShowsSection } from './sections/ForYourShowsSection';
import { FriendsOwnedSection } from './sections/FriendsOwnedSection';
import { ReadingGoalCard } from '../Reading/rows/ReadingGoalCard';

const GENRE_SHELVES: ShelfId[] = ['fantasy', 'thriller', 'romance', 'scifi', 'ya', 'classics'];
const GENRE_IDS = GENRES.map((g) => g.id);

interface BookSectionsOptions {
  bookYear: BookYear;
}

/**
 * Bücher-Bausteine der Lesen-Seite. Die Seite setzt sie thematisch mit den Manga-Bausteinen
 * zusammen; Zustand (Fortschritt, Genre-Wahl, Hinzufügen) lebt hier und gilt für alle.
 */
export function useBookSections({ bookYear }: BookSectionsOptions) {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { bookList, favoriteBookGenres } = useBooksList();
  const navigate = useNavigate();
  const [genrePickerOpen, setGenrePickerOpen] = useState(false);
  const { now, year, yearStats } = bookYear;

  const { goal, save: saveGoal } = useReadingGoal(year);

  const sorted = useMemo(() => sortByRecentActivity(bookList), [bookList]);
  const wished = useMemo(
    () =>
      bookList
        .filter((b) => !!b.wishedAt)
        .sort((a, b) => (b.wishedAt ?? '').localeCompare(a.wishedAt ?? '')),
    [bookList]
  );
  const ownedBooks = useMemo(
    () =>
      bookList
        .filter((b) => !!b.ownedAt)
        .sort((a, b) => (b.ownedAt ?? '').localeCompare(a.ownedAt ?? '')),
    [bookList]
  );
  const paused = useMemo(() => sorted.filter((b) => b.status === 'paused'), [sorted]);
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
  const taste = useReadingTaste(bookList);
  const picked = useMemo(
    () => pickedGenres(GENRE_IDS, favoriteBookGenres) as ShelfId[],
    [favoriteBookGenres]
  );
  const favoriteGenres = useMemo(
    () =>
      forYouGenres(
        picked,
        tasteGenres(taste).map((g) => g.id)
      ) as ShelfId[],
    [picked, taste]
  );
  const favoriteLabels = favoriteGenres
    .map((id) => GENRES.find((g) => g.id === id)?.label())
    .filter(Boolean)
    .join(' & ');
  const genreShelves = useMemo(() => genreShelfOrder(GENRE_SHELVES, picked) as ShelfId[], [picked]);
  const shelfOrder = useMemo(() => ['new', 'hero', 'for-you', ...genreShelves], [genreShelves]);
  const dedupe = useShelfDedupeStore(shelfOrder);
  const saveGenres = useCallback(
    (ids: string[]) => {
      setGenrePickerOpen(false);
      if (!user) return;
      void setFavoriteBookGenres(user.uid, ids).catch(() =>
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error')
      );
    },
    [user]
  );

  const hasBooks = bookList.length > 0;

  return {
    hasBooks,
    /** Nächste Bände deiner Reihen — für „Neu für dich". */
    nextVolumes,
    /** Leseziel als Knopf in der Reihe unter dem Schnellzugriff. */
    goal: hasBooks ? (
      <ReadingGoalCard
        year={year}
        goal={goal}
        finished={yearStats.finishedBooks.length}
        onSaveGoal={(g) => void saveGoal(g)}
      />
    ) : null,
    wished: (
      <BookCarouselSection
        books={wished.slice(0, 20)}
        title={t('Deine Wunschliste')}
        icon={<Redeem />}
        iconColor={currentTheme.status.warning}
      />
    ),
    owned: (
      <BookCarouselSection
        books={ownedBooks.slice(0, 20)}
        title={t('Im Besitz')}
        icon={<LibraryBooks />}
        iconColor={currentTheme.status.success}
        onSeeAll={() => navigate('/reading/library?status=owned')}
        seeAllLabel={t('Alle')}
      />
    ),
    friends: hasBooks ? <FriendsOwnedSection ownBooks={bookList} /> : null,
    paused: (
      <BookCarouselSection
        books={paused}
        title={t('Pausiert')}
        icon={<PauseCircle />}
        iconColor={currentTheme.text.muted}
      />
    ),
    shelf:
      shelfBooks.length > 0 ? (
        <section className="bk-section">
          <SectionHeader
            icon={<LocalLibrary />}
            iconColor={currentTheme.status.warning}
            title={shelfIsYear ? t('Dein Regal {year}', { year }) : t('Dein Regal')}
            onSeeAll={() => navigate('/reading/library')}
            seeAllLabel={t('Ganzes Regal')}
          />
          <div className="bk-pad">
            <Bookshelf books={shelfBooks.slice(-60)} />
          </div>
        </section>
      ) : null,
    stats: <BookStatsSection stats={yearStats} currentMonth={new Date(now).getMonth()} />,
    forYourShows: <ForYourShowsSection suggestions={suggestions} loading={showsLoading} />,
    /** Highlight-Karussell oben in „Entdecken". */
    hero: <FeaturedHero onAdd={openAdd} />,
    /** Genre-Wahl für die gemischten Entdecken-Reihen. */
    genres: {
      picked,
      favorite: favoriteGenres,
      caption: favoriteGenres.length
        ? picked.length
          ? t('Deine Lieblingsgenres: {genres}', { genres: favoriteLabels })
          : t('Weil du gern {genres} liest', { genres: favoriteLabels })
        : undefined,
      shelves: genreShelves,
      edit: () => setGenrePickerOpen(true),
    },
    /** Regale weiter unten zeigen nicht, was weiter oben schon steht. */
    dedupe,
    sheets: (
      <>
        {addSheet}
        <GenrePickerSheet
          open={genrePickerOpen}
          initial={picked}
          onClose={() => setGenrePickerOpen(false)}
          onSave={saveGenres}
        />
      </>
    ),
  };
}
