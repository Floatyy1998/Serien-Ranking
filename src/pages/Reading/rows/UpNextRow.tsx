import { Bookmarks } from '@mui/icons-material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import { getUpNext } from '../../../lib/manga/overview';
import { mangaStand, volumesLabel } from '../../../lib/manga/progress';
import { t } from '../../../services/i18n';
import { bookPath } from '../../Books/helpers';
import { MangaPosterCard } from '../../Manga/components/MangaPosterCard';
import { MangaPosterRow } from '../../Manga/components/MangaPosterRow';

interface UpNextRowProps {
  showBooks: boolean;
  showManga: boolean;
}

const stamp = (value?: string) => new Date(value || 0).getTime();

/** Als Nächstes: dein Bücherstapel und geplante Manga in einer Reihe, zuletzt Vorgemerktes zuerst. */
export const UpNextRow = ({ showBooks, showManga }: UpNextRowProps) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();

  const entries = useMemo(() => {
    const books = showBooks
      ? bookList
          .filter((b) => b.status === 'planned' && !b.wishedAt)
          .map((book) => ({ key: `b-${book.id}`, at: stamp(book.addedAt), book }))
      : [];
    const manga = showManga
      ? getUpNext(mangaList).map((m) => ({
          key: `m-${m.anilistId}`,
          at: stamp(m.addedAt),
          manga: m,
        }))
      : [];
    return [...books, ...manga].sort((a, b) => b.at - a.at).slice(0, 24);
  }, [bookList, mangaList, showBooks, showManga]);

  if (entries.length === 0) return null;

  return (
    <MangaPosterRow
      icon={<Bookmarks />}
      iconColor={currentTheme.accent}
      title={t('Als Nächstes')}
      onSeeAll={
        showBooks
          ? () => navigate('/books/shelf?status=planned')
          : () => navigate('/manga/reading-list')
      }
    >
      {entries.map((entry) => {
        if ('book' in entry && entry.book) {
          const { book } = entry;
          return (
            <MangaPosterCard
              key={entry.key}
              title={book.title}
              poster={coverAtSize(book.cover, 'M') || PLACEHOLDER_SVG}
              badge={t('Buch')}
              meta={book.authors?.[0]}
              onClick={() => navigate(bookPath(book.id))}
            />
          );
        }
        const { manga } = entry as { manga: (typeof mangaList)[number] };
        const { unit, total } = mangaStand(manga);
        return (
          <MangaPosterCard
            key={entry.key}
            title={manga.title}
            poster={manga.poster}
            format={manga.format}
            countryOfOrigin={manga.countryOfOrigin}
            score={manga.averageScore ? (manga.averageScore / 10).toFixed(1) : undefined}
            meta={
              total > 0
                ? unit === 'volume'
                  ? volumesLabel(total)
                  : t('{n} Kapitel', { n: total })
                : manga.genres?.[0]
            }
            onClick={() => navigate(`/manga/${manga.anilistId}`)}
          />
        );
      })}
    </MangaPosterRow>
  );
};
