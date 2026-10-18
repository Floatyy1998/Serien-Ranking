import { AutoAwesome, Whatshot } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookShelves } from '../../../hooks/books/useBookShelf';
import { useMangaForBook, useOwnedBooks } from '../../../hooks/books/useOwnedBooks';
import { useMangaGenrePicks } from '../../../hooks/manga/useMangaGenrePicks';
import { useMangaTrending } from '../../../hooks/manga/useMangaTrending';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { curateShelf, daySeed, mixShelves, resultKeys } from '../../../lib/books/discoverMix';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import { getTopGenres } from '../../../lib/manga/overview';
import { ANILIST_GENRE_FOR } from '../../../lib/reading/genreMap';
import type { ShelfId } from '../../../services/api/bookDiscovery';
import { t } from '../../../services/i18n';
import type { BookSearchResult } from '../../../types/Book';
import type { AniListMangaSearchResult } from '../../../types/Manga';
import { GENRES, SHELF_TITLES } from '../../Books/data/genres';
import { useOpenResult } from '../../Books/discover/DiscoverParts';
import { useShelfClaim, useShelfTaken } from '../../Books/discover/discoverDedupe';
import { useHideOwned } from '../../Books/discover/useAddFlow';
import { MangaPosterCard } from '../../Manga/components/MangaPosterCard';
import '../../Manga/components/MangaCards.css';

export interface DiscoverManga {
  id: number;
  title: string;
  poster: string;
  format?: string;
  countryOfOrigin?: string;
  score?: string;
}

export const mangaFromAniList = (m: AniListMangaSearchResult): DiscoverManga => ({
  id: m.id,
  title: m.title.english || m.title.romaji,
  poster: m.coverImage.large,
  format: m.format,
  countryOfOrigin: m.countryOfOrigin,
  score: m.averageScore ? (m.averageScore / 10).toFixed(1) : undefined,
});

const MIN_RATINGS = 5;
const bookScore = (r: BookSearchResult) =>
  r.avgRating && (r.ratingCount ?? 0) >= MIN_RATINGS ? (r.avgRating * 2).toFixed(1) : undefined;

/** Abwechselnd Buch und Manga, damit keine Sorte die Reihe dominiert. */
function interleave<A, B>(a: A[], b: B[]): (A | B)[] {
  const out: (A | B)[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

const useOwnedMangaIds = () => {
  const { mangaList, hiddenMangaList } = useMangaList();
  return useMemo(
    () => new Set([...mangaList, ...hiddenMangaList].map((m) => m.anilistId)),
    [mangaList, hiddenMangaList]
  );
};

interface MixedRowProps {
  sectionRef?: React.Ref<HTMLElement>;
  title: string;
  caption?: string;
  icon: React.ReactNode;
  iconColor: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  books: BookSearchResult[];
  manga: DiscoverManga[];
  loading: boolean;
}

/** Eine Entdecken-Reihe mit Büchern und Manga im gleichen Kartenformat. */
export const MixedRow = ({
  sectionRef,
  title,
  caption,
  icon,
  iconColor,
  onSeeAll,
  seeAllLabel,
  books,
  manga,
  loading,
}: MixedRowProps) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const ownedFor = useOwnedBooks();
  const mangaFor = useMangaForBook();
  const openResult = useOpenResult();
  const ownedManga = useOwnedMangaIds();
  const entries = interleave(
    books.map((book) => ({ kind: 'book' as const, book })),
    manga.map((item) => ({ kind: 'manga' as const, item }))
  );
  const empty = entries.length === 0;

  return (
    <section ref={sectionRef} className="manga-section" hidden={!loading && empty}>
      <SectionHeader
        icon={icon}
        iconColor={iconColor}
        title={title}
        onSeeAll={onSeeAll}
        seeAllLabel={seeAllLabel}
        style={caption ? { marginBottom: 4 } : undefined}
      />
      {caption && (
        <p className="dsc-caption" style={{ color: currentTheme.text.muted }}>
          {caption}
        </p>
      )}
      <HorizontalScrollContainer gap={14} style={{ padding: '0 20px' }}>
        {empty && loading
          ? Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="mpc" aria-hidden>
                <div className="mpc-art" />
              </div>
            ))
          : entries.map((entry) =>
              entry.kind === 'book' ? (
                <MangaPosterCard
                  key={`b-${entry.book.id}`}
                  title={entry.book.title}
                  poster={
                    coverAtSize(entry.book.cover, 'M') ||
                    entry.book.coverFallback ||
                    PLACEHOLDER_SVG
                  }
                  badge={t('Buch')}
                  meta={entry.book.authors?.[0]}
                  score={bookScore(entry.book)}
                  owned={!!(ownedFor(entry.book) || mangaFor(entry.book))}
                  onClick={() => openResult(entry.book)}
                />
              ) : (
                <MangaPosterCard
                  key={`m-${entry.item.id}`}
                  title={entry.item.title}
                  poster={entry.item.poster}
                  format={entry.item.format}
                  countryOfOrigin={entry.item.countryOfOrigin}
                  score={entry.item.score}
                  owned={ownedManga.has(entry.item.id)}
                  onClick={() => navigate(`/manga/${entry.item.id}`)}
                />
              )
            )}
      </HorizontalScrollContainer>
    </section>
  );
};

interface AreaProps {
  showBooks: boolean;
  showManga: boolean;
}

/** Neu & beliebt: neue Bücher und Trending-Manga, ohne Eigenes. */
export const NewMixedRow = ({ showBooks, showManga }: AreaProps) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const hideOwned = useHideOwned();
  const taken = useShelfTaken('new');
  const ownedManga = useOwnedMangaIds();
  const { ref, lists, loading } = useBookShelves(
    showBooks ? [{ id: 'new' as ShelfId, limit: 40 }] : []
  );
  const books = useMemo(
    () =>
      showBooks
        ? curateShelf(lists[0] ?? [], {
            isOwned: (r) => hideOwned(r) || resultKeys(r).some((k) => taken.has(k)),
            perAuthor: 1,
          }).items.slice(0, 12)
        : [],
    [showBooks, lists, hideOwned, taken]
  );
  useShelfClaim('new', books);
  const trending = useMangaTrending();
  const manga = useMemo(
    () =>
      showManga
        ? trending
            .filter((m) => !ownedManga.has(m.id))
            .slice(0, 12)
            .map((m) => ({ ...m, score: m.rating ? m.rating.toFixed(1) : undefined }))
        : [],
    [showManga, trending, ownedManga]
  );

  return (
    <MixedRow
      sectionRef={ref}
      title={t('Neu & beliebt')}
      icon={<Whatshot />}
      iconColor={currentTheme.status.warning}
      onSeeAll={() => navigate(showBooks ? '/books/search?genre=new' : '/manga/discover')}
      books={books}
      manga={manga}
      loading={showBooks && loading}
    />
  );
};

interface ForYouMixedRowProps extends AreaProps {
  /** Lieblings- bzw. Geschmacksgenres der Bücher. */
  genres: ShelfId[];
  caption?: string;
  onEditGenres: () => void;
}

/** Für dich: Bücher aus deinen Genres und Manga aus deinem Top-Genre, jeden Tag neu gemischt. */
export const ForYouMixedRow = ({
  showBooks,
  showManga,
  genres,
  caption,
  onEditGenres,
}: ForYouMixedRowProps) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList } = useMangaList();
  const hideOwned = useHideOwned();
  const taken = useShelfTaken('for-you');
  const ownedManga = useOwnedMangaIds();
  const { ref, lists, loading } = useBookShelves(
    showBooks
      ? genres.flatMap((id) => [
          { id, sort: 'gems' as const },
          { id, sort: 'top' as const },
        ])
      : []
  );
  const [seed] = useState(() => `${daySeed()}:${genres.join('+')}`);
  const books = useMemo(
    () =>
      showBooks
        ? mixShelves(lists, {
            seed,
            size: 12,
            isOwned: (r) => hideOwned(r) || resultKeys(r).some((k) => taken.has(k)),
            perAuthor: 1,
          })
        : [],
    [showBooks, lists, seed, hideOwned, taken]
  );
  useShelfClaim('for-you', books);

  const mangaGenre = useMemo(() => {
    const top = getTopGenres(mangaList, user?.uid, 1)[0];
    if (top) return top;
    return genres.map((id) => ANILIST_GENRE_FOR[id]).find(Boolean);
  }, [mangaList, user?.uid, genres]);
  const picks = useMangaGenrePicks(showManga ? mangaGenre : undefined, ownedManga, 12);
  const manga = useMemo(() => picks.map(mangaFromAniList), [picks]);

  return (
    <MixedRow
      sectionRef={ref}
      title={t('Für dich')}
      caption={caption}
      icon={<AutoAwesome />}
      iconColor={currentTheme.accent}
      onSeeAll={showBooks ? onEditGenres : undefined}
      seeAllLabel={t('Anpassen')}
      books={books}
      manga={manga}
      loading={showBooks && loading && genres.length > 0}
    />
  );
};

/** Eine Genre-Reihe mit Büchern und Manga desselben Genres; lädt erst in Sichtweite. */
export const GenreMixedRow = ({ id, showBooks, showManga }: AreaProps & { id: ShelfId }) => {
  const navigate = useNavigate();
  const hideOwned = useHideOwned();
  const taken = useShelfTaken(id);
  const ownedManga = useOwnedMangaIds();
  const { ref, lists, loading } = useBookShelves(
    showBooks
      ? [
          { id, sort: 'gems' as const },
          { id, sort: 'top' as const },
        ]
      : []
  );
  const [seed] = useState(() => `${daySeed()}:${id}`);
  const books = useMemo(
    () =>
      showBooks
        ? mixShelves(lists, {
            seed,
            size: 12,
            isOwned: (r) => hideOwned(r) || resultKeys(r).some((k) => taken.has(k)),
            perAuthor: 1,
          })
        : [],
    [showBooks, lists, seed, hideOwned, taken]
  );
  useShelfClaim(id, books);
  const mangaGenre = ANILIST_GENRE_FOR[id];
  // Manga erst holen, wenn die Reihe in Sichtweite ist (die Buch-Regale laden dann).
  const ready = !showBooks || !loading;
  const picks = useMangaGenrePicks(showManga && ready ? mangaGenre : undefined, ownedManga, 12);
  const manga = useMemo(() => picks.map(mangaFromAniList), [picks]);
  const genre = GENRES.find((g) => g.id === id);
  const GenreIcon = genre?.icon ?? AutoAwesome;

  return (
    <MixedRow
      sectionRef={ref}
      title={SHELF_TITLES[id]()}
      icon={<GenreIcon />}
      iconColor={genre?.colors[1] ?? '#888'}
      onSeeAll={() => navigate(`/reading/genre/${id}`)}
      books={books}
      manga={manga}
      loading={showBooks && loading}
    />
  );
};
