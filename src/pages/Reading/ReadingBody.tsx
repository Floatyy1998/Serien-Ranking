import { AutoAwesome, AutoStories, LocalLibrary, Tune, UploadFile } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Fragment, useCallback, type ReactNode, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/ui';
import { READING_SECTION_AREA } from '../../config/readingSections';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useReadingLayout } from '../../hooks/ui/useReadingLayout';
import { tapScaleSmall } from '../../lib/motion';
import { ANILIST_GENRE_FOR } from '../../lib/reading/genreMap';
import { suggestionAreas, usesArea, type ReadingAreas } from '../../lib/reading/readingMedium';
import { dateLocale, t } from '../../services/i18n';
import type { Book } from '../../types/Book';
import { Bookshelf } from '../Books/components/Bookshelf';
import '../Books/components/books.css';
import { GenreTiles } from '../Books/discover/DiscoverParts';
import { ShelfDedupeContext } from '../Books/discover/discoverDedupe';
import '../Books/discover/discover.css';
import type { BookYear } from '../Books/hooks/useBookYear';
import { useReadingOverview } from '../Books/hooks/useReadingOverview';
import { StatTile } from '../Books/sections/BookStatsSection';
import { useBookSections } from '../Books/useBookSections';
import { useMangaSections } from '../Manga/useMangaSections';
import './ReadingPage.css';
import { ForYouMixedRow, GenreMixedRow, NewMixedRow } from './discover/MixedDiscover';
import { LibrarySection } from './rows/LibrarySection';
import { ContinueReadingRow } from './rows/ContinueReadingRow';
import { NewForYouRow } from './rows/NewForYouRow';
import { UpNextRow } from './rows/UpNextRow';

interface ReadingBodyProps {
  areas: ReadingAreas;
  bookYear: BookYear;
  /** Sprungziel „Weiterlesen" für den Kopf. */
  readingRef: RefObject<HTMLDivElement | null>;
  onSearch: (filter: 'all' | 'books' | 'manga') => void;
}

const ReadingWelcome = ({
  areas,
  onSearch,
}: {
  areas: ReadingAreas;
  onSearch: ReadingBodyProps['onSearch'];
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const actions = [
    ...(usesArea(areas, 'books')
      ? [
          {
            key: 'books',
            icon: <LocalLibrary />,
            label: t('Buch suchen'),
            run: () => onSearch('books'),
          },
        ]
      : []),
    ...(usesArea(areas, 'manga')
      ? [
          {
            key: 'manga',
            icon: <AutoStories />,
            label: t('Manga suchen'),
            run: () => onSearch('manga'),
          },
        ]
      : []),
    ...(usesArea(areas, 'books')
      ? [
          {
            key: 'import',
            icon: <UploadFile />,
            label: t('Importieren'),
            run: () => navigate('/books/import'),
          },
        ]
      : []),
  ];

  return (
    <section className="bk-section bk-pad">
      <div className="rd-welcome liquid-glass">
        <div className="rd-welcome-title" style={{ color: currentTheme.text.secondary }}>
          {t('Was liest du gerade?')}
        </div>
        <div className="rd-welcome-text" style={{ color: currentTheme.text.muted }}>
          {areas === 'books'
            ? t('Such dein aktuelles Buch oder hol deine Bibliothek von Goodreads rüber.')
            : t(
                'Leg dein erstes Buch oder deinen ersten Manga an – hier siehst du dann deinen Lesestand.'
              )}
        </div>
        <div className="rd-welcome-actions">
          {actions.map((action) => (
            <motion.button
              key={action.key}
              type="button"
              whileTap={tapScaleSmall}
              className="bk-pod rd-welcome-action"
              onClick={action.run}
              style={{ color: currentTheme.text.secondary }}
            >
              <span style={{ color: currentTheme.primary, display: 'flex' }}>{action.icon}</span>
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * Die eine Lesen-Seite: Bücher und Manga nach Thema statt nach Medium, in der Reihenfolge
 * des Lesen-Layouts (Einstellungen → Design → Lesen-Seite). Wer nur eine Sorte liest,
 * sieht die leeren Bausteine der anderen nicht; „Lesebereiche" blendet eine ganz aus.
 */
export const ReadingBody = ({ areas, bookYear, readingRef, onSearch }: ReadingBodyProps) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const layout = useReadingLayout();
  const { bookList, loading: booksLoading } = useBooksList();
  const { mangaList, loading: mangaLoading } = useMangaList();
  const showBooks = usesArea(areas, 'books');
  const showManga = usesArea(areas, 'manga');
  const hasBooks = bookList.length > 0;
  const hasManga = mangaList.length > 0;
  const both = showBooks && showManga && hasBooks && hasManga;

  const books = useBookSections({ bookYear });
  const manga = useMangaSections({ layout });
  const overview = useReadingOverview(bookYear);
  const { year } = bookYear;

  const loaded = !booksLoading && !mangaLoading;
  const empty = loaded && (showBooks ? !hasBooks : true) && (showManga ? !hasManga : true);
  const hrefFor = useCallback(
    (b: Book) =>
      b.id.startsWith('manga-') ? `/manga/${b.id.slice(6)}` : `/books/${encodeURIComponent(b.id)}`,
    []
  );

  const bookOnly = (node: ReactNode) => (showBooks ? node : null);
  const mangaOnly = (node: ReactNode) => (showManga ? node : null);

  const suggest = suggestionAreas(areas, hasBooks, hasManga);
  const genreShelves = suggest.books
    ? books.genres.shelves
    : books.genres.shelves.filter((id) => id in ANILIST_GENRE_FOR);

  const renderDiscover = (part: string): ReactNode => {
    switch (part) {
      case 'hero':
        return suggest.books ? books.hero : null;
      case 'new':
        return <NewMixedRow showBooks={suggest.books} showManga={suggest.manga} />;
      case 'for-you':
        return (
          <ForYouMixedRow
            showBooks={suggest.books}
            showManga={suggest.manga}
            genres={books.genres.favorite}
            caption={books.genres.caption}
            onEditGenres={books.genres.edit}
          />
        );
      case 'genres':
        return (
          <GenreTiles
            preferred={books.genres.picked}
            onEditFavorites={books.genres.edit}
            onOpenGenre={(genre) => navigate(`/reading/genre/${genre}`)}
            only={suggest.books ? undefined : Object.keys(ANILIST_GENRE_FOR)}
          />
        );
      case 'genre-rows':
        return genreShelves.map((genre) => (
          <GenreMixedRow
            key={genre}
            id={genre}
            showBooks={suggest.books}
            showManga={suggest.manga}
          />
        ));
      default:
        return null;
    }
  };

  const render = (id: string): ReactNode => {
    switch (id) {
      case 'continue-reading':
        return (
          <div ref={readingRef}>
            <ContinueReadingRow showBooks={showBooks} showManga={showManga} />
          </div>
        );
      case 'new':
        return (
          <NewForYouRow
            showBooks={showBooks}
            showManga={showManga}
            nextVolumes={books.nextVolumes}
          />
        );
      case 'for-you': {
        const cards = layout.forYou.order
          .filter((card) => !layout.forYou.hidden.includes(card))
          .map((card) =>
            card === 'goal' ? bookOnly(books.goalCard) : mangaOnly(manga.forYouCards[card])
          )
          .filter(Boolean);
        if (cards.length === 0) return null;
        return (
          <section className="manga-section manga-for-you">
            <SectionHeader
              icon={<AutoAwesome />}
              iconColor={currentTheme.status.warning}
              title={t('Für dich')}
            />
            <div className="manga-for-you-grid">
              {cards.map((card, index) => (
                <Fragment key={index}>{card}</Fragment>
              ))}
            </div>
          </section>
        );
      }
      case 'up-next':
        return <UpNextRow showBooks={showBooks} showManga={showManga} />;
      case 'wishlist':
        return books.wished;
      case 'quick-actions':
        return manga.quickActions;
      case 'shelf':
        if (!both) return showBooks ? books.shelf : null;
        if (overview.shelf.length === 0) return null;
        return (
          <section className="bk-section">
            <SectionHeader
              icon={<LocalLibrary />}
              iconColor={currentTheme.status.warning}
              title={t('Dein Lese-Regal')}
              onSeeAll={() => navigate('/books/shelf')}
              seeAllLabel={t('Ganzes Regal')}
            />
            <div className="bk-pad">
              <Bookshelf books={overview.shelf} hrefFor={hrefFor} />
              <div className="bk-shelf-legend" style={{ color: currentTheme.text.muted }}>
                <span>{t('Bücher und abgeschlossene Manga, nach Lesedatum')}</span>
              </div>
            </div>
          </section>
        );
      case 'library':
        return <LibrarySection showBooks={showBooks} showManga={showManga} />;
      case 'discover':
        if (!loaded) return null;
        return (
          <ShelfDedupeContext.Provider value={books.dedupe}>
            {layout.discover.order
              .filter((part) => !layout.discover.hidden.includes(part))
              .map((part) => (
                <Fragment key={part}>{renderDiscover(part)}</Fragment>
              ))}
          </ShelfDedupeContext.Provider>
        );
      case 'for-shows':
        return suggest.books ? books.forYourShows : null;
      case 'year':
        if (!both) return null;
        return (
          <section className="bk-section">
            <SectionHeader
              icon={<AutoStories />}
              iconColor={currentTheme.accent}
              title={t('Lesejahr {year}', { year })}
            />
            <div className="bk-pad">
              <div className="bk-stat-grid">
                <StatTile
                  value={overview.totalReading}
                  label={t('Gerade am Lesen')}
                  color={currentTheme.primary}
                />
                <StatTile value={overview.finishedThisYear} label={t('Beendet {year}', { year })} />
                <StatTile
                  value={overview.yearStats.pagesRead.toLocaleString(dateLocale())}
                  label={t('Buchseiten {year}', { year })}
                />
                <StatTile
                  value={overview.chapters.toLocaleString(dateLocale())}
                  label={t('Manga-Kapitel gesamt')}
                />
              </div>
            </div>
          </section>
        );
      case 'stats':
        return (
          <>
            {bookOnly(books.stats)}
            {mangaOnly(manga.stats)}
          </>
        );
      case 'owned':
        return books.owned;
      case 'paused':
        return books.paused;
      case 'recently-added':
        return manga.recentlyAdded;
      case 'friends':
        return books.friends;
      default:
        return null;
    }
  };

  const visible = layout.sections.order.filter((id) => {
    if (layout.sections.hidden.includes(id)) return false;
    const area = READING_SECTION_AREA[id];
    return area === 'both' || (area === 'books' ? showBooks : showManga);
  });

  return (
    <>
      {empty && <ReadingWelcome areas={areas} onSearch={onSearch} />}

      {visible.map((id) => (
        <Fragment key={id}>{render(id)}</Fragment>
      ))}

      <div className="manga-page-footer" style={{ gap: 10, flexWrap: 'wrap' }}>
        <motion.button
          type="button"
          whileTap={tapScaleSmall}
          className="manga-customize-btn"
          onClick={() => navigate('/reading/layout')}
          style={{ color: currentTheme.text.secondary }}
        >
          <Tune style={{ fontSize: 18, color: currentTheme.primary }} />
          {t('Lesen-Seite anpassen')}
        </motion.button>
        {showBooks && (
          <motion.button
            type="button"
            whileTap={tapScaleSmall}
            className="manga-customize-btn"
            onClick={() => navigate('/books/import')}
            style={{ color: currentTheme.text.secondary }}
          >
            <UploadFile style={{ fontSize: 18, color: currentTheme.primary }} />
            {t('Bücher importieren')}
          </motion.button>
        )}
      </div>

      {books.sheets}
    </>
  );
};
