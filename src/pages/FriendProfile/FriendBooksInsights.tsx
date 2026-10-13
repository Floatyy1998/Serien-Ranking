import { AutoAwesome, Redeem } from '@mui/icons-material';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { HorizontalScrollContainer } from '../../components/ui';
import { bookMatchKey } from '../../lib/books/bookIdentity';
import { bookAsResult } from '../../lib/books/bookSearchMapping';
import { hasReadingTaste, tasteGenres } from '../../lib/books/readingTaste';
import { fetchShelf } from '../../services/api/bookDiscovery';
import { dateLocale, t } from '../../services/i18n';
import type { Book, BookSearchResult } from '../../types/Book';
import { BookCover } from '../Books/components/BookCover';
import { ReadingTasteCard } from '../Books/components/ReadingTasteCard';
import { GENRES } from '../Books/data/genres';
import { useOpenByTitle, useOpenResult } from '../Books/discover/DiscoverParts';
import { useNextVolumes } from '../Books/hooks/useNextVolumes';
import { useReadingTaste } from '../Books/hooks/useReadingTaste';
import { useSeriesPartBooks } from '../Books/hooks/useSeriesPartBooks';
import './FriendBooksInsights.css';

const MAX_WISHES = 10;
const MAX_TASTE_PICKS = 8;

interface GiftIdea {
  key: string;
  title: string;
  authors: string[];
  cover?: string;
  coverFallback?: string;
  reason: string;
  color: string;
  open: () => void;
}

/** Geschenkideen (Wunschliste, fehlender Band einer Reihe, Lieblingsgenre) und Lesegeschmack eines Freundes. */
export const FriendBooksInsights = memo(function FriendBooksInsights({
  friendName,
  books,
}: {
  friendName: string;
  books: Book[];
}) {
  const { currentTheme } = useTheme();
  const openResult = useOpenResult();
  const { open: openByTitle } = useOpenByTitle();
  const [now] = useState(() => Date.now());
  const taste = useReadingTaste(books);
  const { progress } = useNextVolumes(books, now, { readOnly: true });
  const partLookups = useMemo(
    () => progress.map((p) => ({ part: p.next.part, author: p.author })),
    [progress]
  );
  const partBooks = useSeriesPartBooks(partLookups);
  const topGenre = tasteGenres(taste)[0]?.id;
  const [genrePicks, setGenrePicks] = useState<BookSearchResult[]>([]);

  useEffect(() => {
    if (!topGenre) return;
    let alive = true;
    fetchShelf(topGenre)
      .then((list) => {
        if (alive) setGenrePicks(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [topGenre]);

  const ideas = useMemo(() => {
    const has = new Set<string>();
    for (const b of books) {
      has.add(b.id);
      has.add(bookMatchKey(b.title, b.authors));
    }
    const out: GiftIdea[] = [];
    const seen = new Set<string>();
    const push = (idea: GiftIdea, matchKey: string) => {
      if (seen.has(matchKey)) return;
      seen.add(matchKey);
      out.push(idea);
    };

    const wishes = books
      .filter((b) => b.wishedAt)
      .sort((a, b) => (b.wishedAt ?? '').localeCompare(a.wishedAt ?? ''))
      .slice(0, MAX_WISHES);
    for (const book of wishes) {
      push(
        {
          key: `wish-${book.id}`,
          title: book.title,
          authors: book.authors,
          cover: book.cover,
          reason: t('Wunschliste'),
          color: currentTheme.status.warning,
          open: () => openResult(bookAsResult(book)),
        },
        bookMatchKey(book.title, book.authors)
      );
    }

    for (const item of progress) {
      const { part, state, daysUntil } = item.next;
      const match = partBooks[part.wikidataId];
      const upcomingDate =
        state === 'upcoming' && daysUntil && part.publishedDate
          ? new Date(`${part.publishedDate}T12:00:00`).toLocaleDateString(dateLocale(), {
              day: 'numeric',
              month: 'short',
            })
          : null;
      push(
        {
          key: `series-${item.seriesId}`,
          title: match?.title ?? part.title,
          authors: match?.authors ?? (item.author ? [item.author] : []),
          cover: match?.cover,
          coverFallback: match?.coverFallback,
          reason: upcomingDate
            ? t('Erscheint {date}', { date: upcomingDate })
            : t('Band {n} fehlt', { n: part.position }),
          color: currentTheme.status.success,
          open: () => (match ? openResult(match) : void openByTitle(part.title, item.author)),
        },
        bookMatchKey(part.title, item.author ? [item.author] : [])
      );
    }

    const genre = GENRES.find((g) => g.id === topGenre);
    let picks = 0;
    for (const result of genrePicks) {
      if (picks >= MAX_TASTE_PICKS || !genre) break;
      const key = bookMatchKey(result.title, result.authors);
      if (has.has(result.id) || has.has(key)) continue;
      picks += 1;
      push(
        {
          key: `genre-${result.id}`,
          title: result.title,
          authors: result.authors,
          cover: result.cover,
          coverFallback: result.coverFallback,
          reason: genre.label(),
          color: genre.colors[1],
          open: () => openResult(result),
        },
        key
      );
    }
    return out;
  }, [books, progress, partBooks, genrePicks, topGenre, currentTheme, openResult, openByTitle]);

  const showTaste = hasReadingTaste(taste);
  if (ideas.length === 0 && !showTaste) return null;

  return (
    <div className="fbi">
      {ideas.length > 0 && (
        <section className="fbi-block">
          <div className="fbi-head">
            <Redeem style={{ fontSize: 20, color: currentTheme.status.warning }} />
            <span style={{ color: currentTheme.text.primary }}>
              {t('Geschenkideen für {name}', { name: friendName })}
            </span>
          </div>
          <div className="fbi-sub" style={{ color: currentTheme.text.muted }}>
            {t('Aus Wunschliste, offenen Reihen und Lieblingsgenre')}
          </div>
          <HorizontalScrollContainer scrollerClassName="fbi-row">
            {ideas.map((idea) => (
              <button key={idea.key} type="button" className="fbi-card" onClick={idea.open}>
                <BookCover
                  book={{
                    id: idea.key,
                    title: idea.title,
                    authors: idea.authors,
                    cover: idea.cover,
                  }}
                  fallbackSrc={idea.coverFallback}
                />
                <span
                  className="fbi-reason"
                  style={{ color: idea.color, background: `${idea.color}22` }}
                >
                  {idea.reason}
                </span>
                <span className="fbi-title" style={{ color: currentTheme.text.secondary }}>
                  {idea.title}
                </span>
                {idea.authors[0] && (
                  <span className="fbi-author" style={{ color: currentTheme.text.muted }}>
                    {idea.authors[0]}
                  </span>
                )}
              </button>
            ))}
          </HorizontalScrollContainer>
        </section>
      )}
      {showTaste && (
        <section className="fbi-block fbi-taste">
          <div className="fbi-head">
            <AutoAwesome style={{ fontSize: 19, color: currentTheme.primary }} />
            <span style={{ color: currentTheme.text.primary }}>
              {t('{name} liest am liebsten', { name: friendName })}
            </span>
          </div>
          <ReadingTasteCard taste={taste} />
        </section>
      )}
    </div>
  );
});
