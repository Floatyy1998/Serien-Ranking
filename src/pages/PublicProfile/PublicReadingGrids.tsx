import { AutoStories, LocalLibrary } from '@mui/icons-material';
import { EmptyState, ProfileItemCard } from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContext';
import { coverAtSize } from '../../lib/books/bookSearchMapping';
import { progressPercent as bookProgressPercent } from '../../lib/books/bookProgress';
import { mangaProgressPercent, userMangaRating } from '../../lib/manga/overview';
import { mangaStandLabel } from '../../lib/manga/progress';
import { t } from '../../services/i18n';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

export const PublicMangaGrid = ({
  items,
  ownerUid,
  theme,
  onOpen,
}: {
  items: Manga[];
  ownerUid: string | null;
  theme: Theme;
  onOpen?: (anilistId: number) => void;
}) =>
  items.length === 0 ? (
    <EmptyState
      icon={<AutoStories style={{ fontSize: '56px' }} />}
      title={t('Keine Manga gefunden')}
      description={t('Versuche andere Filter oder entferne sie.')}
      iconColor={theme.text.muted}
    />
  ) : (
    <div className="fp-grid">
      {items.map((manga, index) => {
        const progress = mangaProgressPercent(manga);
        return (
          <ProfileItemCard
            key={manga.anilistId}
            mediaType="none"
            statusText={mangaStandLabel(manga) || undefined}
            title={manga.title}
            posterUrl={manga.poster}
            isMovie={false}
            rating={userMangaRating(manga, ownerUid ?? undefined)}
            progress={progress > 0 ? progress : undefined}
            providers={[]}
            genres={manga.genres?.slice(0, 2).join(', ') || undefined}
            index={index}
            currentTheme={theme}
            onClick={() => onOpen?.(manga.anilistId)}
          />
        );
      })}
    </div>
  );

export const PublicBooksGrid = ({ items, theme }: { items: Book[]; theme: Theme }) =>
  items.length === 0 ? (
    <EmptyState
      icon={<LocalLibrary style={{ fontSize: '56px' }} />}
      title={t('Keine Bücher gefunden')}
      description={t('Versuche andere Filter oder entferne sie.')}
      iconColor={theme.text.muted}
    />
  ) : (
    <div className="fp-grid">
      {items.map((book, index) => {
        const progress = bookProgressPercent(book);
        return (
          <ProfileItemCard
            key={book.id}
            mediaType="none"
            statusText={
              [
                book.status === 'reading'
                  ? book.pageCount
                    ? t('S. {page} / {total}', { page: book.currentPage, total: book.pageCount })
                    : t('S. {page}', { page: book.currentPage })
                  : book.status === 'planned'
                    ? t('Will ich lesen')
                    : undefined,
                book.ownedAt ? t('Im Besitz') : undefined,
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            }
            title={book.title}
            posterUrl={coverAtSize(book.cover, 'M') ?? ''}
            isMovie={false}
            rating={book.rating ?? 0}
            progress={book.status === 'reading' && progress > 0 ? progress : undefined}
            providers={[]}
            genres={book.authors?.[0]}
            index={index}
            currentTheme={theme}
            onClick={() => {}}
          />
        );
      })}
    </div>
  );
