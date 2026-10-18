import { AutoStories } from '@mui/icons-material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useContinueReading } from '../../../hooks/manga/useContinueReading';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { progressPercent, sortByRecentActivity } from '../../../lib/books/bookProgress';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import { standLabel } from '../../../lib/manga/progress';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { bookPath } from '../../Books/helpers';
import { useBookActions } from '../../Books/hooks/useBookActions';
import { MangaPosterCard } from '../../Manga/components/MangaPosterCard';
import { MangaPosterRow } from '../../Manga/components/MangaPosterRow';
import { saveReadProgress } from '../../Manga/saveReadProgress';

const BOOK_STEP = 10;

interface ContinueReadingRowProps {
  showBooks: boolean;
  showManga: boolean;
}

/** Weiterlesen: Bücher und Manga in einer Reihe, zuletzt Gelesenes zuerst, mit Schnell-Knopf. */
export const ContinueReadingRow = ({ showBooks, showManga }: ContinueReadingRowProps) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();
  const continueManga = useContinueReading();
  const actions = useBookActions();
  const onAction = getOptimalTextColor(currentTheme.primary);

  const entries = useMemo(() => {
    const books = showBooks
      ? sortByRecentActivity(bookList)
          .filter((b) => b.status === 'reading')
          .map((book) => ({
            key: `b-${book.id}`,
            at: new Date(book.lastReadAt || book.startedAt || book.addedAt || 0).getTime(),
            book,
          }))
      : [];
    const manga = showManga
      ? continueManga.map((item) => ({
          key: `m-${item.anilistId}`,
          at: new Date(item.lastReadAt || 0).getTime(),
          item,
        }))
      : [];
    return [...books, ...manga].sort((a, b) => b.at - a.at).slice(0, 16);
  }, [bookList, continueManga, showBooks, showManga]);

  if (entries.length === 0) return null;

  return (
    <MangaPosterRow
      icon={<AutoStories />}
      iconColor={currentTheme.primary}
      title={t('Weiterlesen')}
      onSeeAll={showManga && !showBooks ? () => navigate('/manga/reading-list') : undefined}
    >
      {entries.map((entry) => {
        if ('book' in entry && entry.book) {
          const { book } = entry;
          const page = book.currentPage || 0;
          const done = !!book.pageCount && page >= book.pageCount;
          return (
            <MangaPosterCard
              key={entry.key}
              title={book.title}
              poster={coverAtSize(book.cover, 'M') || PLACEHOLDER_SVG}
              badge={t('Buch')}
              meta={
                book.pageCount
                  ? t('S. {page} / {total}', { page, total: book.pageCount })
                  : t('S. {page}', { page })
              }
              progress={progressPercent(book)}
              action={{
                label: `+${BOOK_STEP}`,
                ariaLabel: t('„{title}": {n} Seiten weiter', { title: book.title, n: BOOK_STEP }),
                disabled: done,
                color: onAction,
                onClick: () => void actions.saveProgress(book, page + BOOK_STEP),
              }}
              onClick={() => navigate(bookPath(book.id))}
            />
          );
        }
        const { item } = entry as { item: (typeof continueManga)[number] };
        const { stand } = item;
        const done = stand.total > 0 && stand.current >= stand.total;
        return (
          <MangaPosterCard
            key={entry.key}
            title={item.title}
            poster={item.poster}
            format={item.format}
            countryOfOrigin={item.countryOfOrigin}
            meta={standLabel(stand, true)}
            progress={item.progress}
            action={{
              label: '+1',
              ariaLabel:
                stand.unit === 'volume'
                  ? t('„{title}": einen Band weiter', { title: item.title })
                  : t('„{title}": ein Kapitel weiter', { title: item.title }),
              disabled: done,
              color: onAction,
              onClick: () => {
                const manga = mangaList.find((m) => m.anilistId === item.anilistId);
                if (!user || !manga) return;
                void saveReadProgress(user.uid, manga, {
                  next: stand.current + 1,
                  previous: stand.current,
                  total: stand.total || null,
                });
              },
            }}
            onClick={() => navigate(`/manga/${item.anilistId}`)}
          />
        );
      })}
    </MangaPosterRow>
  );
};
