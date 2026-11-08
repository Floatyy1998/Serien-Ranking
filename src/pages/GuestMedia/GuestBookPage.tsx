import {
  AutoStories,
  Groups,
  Insights,
  MenuBook,
  NotificationsActive,
  Star,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookLinks } from '../../hooks/books/useBookLinks';
import { displayVolume, editionLanguage } from '../../lib/books/bookSeries';
import { coverAtSize } from '../../lib/books/bookSearchMapping';
import { addGuestReadingPick } from '../../services/account/guestOnboarding';
import { fetchMoreByAuthor } from '../../services/api/bookDiscovery';
import { searchBooks } from '../../services/api/booksApi';
import { tmdbFetch } from '../../services/api/tmdbClient';
import {
  loadBookCatalogDescription,
  loadBookCatalogItem,
} from '../../services/catalog/bookCatalog';
import { appLocale, t } from '../../services/i18n';
import type { BookAdaptation, BookSearchResult } from '../../types/Book';
import { getImageUrl } from '../../utils/imageUrl';
import { bookItem } from '../Onboarding/hooks/useReadingPicks';
import {
  GuestFinal,
  GuestHero,
  GuestLegal,
  GuestPitch,
  GuestRail,
  GuestShell,
  GuestSticky,
  GuestStory,
  type GuestNotice,
  type GuestRailItem,
} from './GuestParts';
import { useHeroCtaVisible } from './useHeroCtaVisible';

const bookLink = (id: string) => `/books/${encodeURIComponent(id)}`;

async function resolveBook(id: string): Promise<BookSearchResult | null> {
  const own = await loadBookCatalogItem(id).catch(() => null);
  if (own) return own;
  const isbn = id.match(/97[89]\d{10}/)?.[0];
  if (!isbn) return null;
  const hits = await searchBooks(isbn).catch(() => []);
  return hits.find((hit) => hit.isbn13 === isbn) ?? null;
}

function useAdaptationPosters(adaptations: BookAdaptation[]): GuestRailItem[] {
  const [items, setItems] = useState<GuestRailItem[]>([]);
  const key = adaptations.map((a) => `${a.kind}-${a.tmdbId}`).join(',');
  useEffect(() => {
    let alive = true;
    void Promise.all(
      adaptations.slice(0, 8).map(async (a): Promise<GuestRailItem> => {
        const data = await tmdbFetch<{
          poster_path?: string;
          name?: string;
          title?: string;
          first_air_date?: string;
          release_date?: string;
        }>(`${a.kind === 'series' ? 'tv' : 'movie'}/${a.tmdbId}`).catch(() => null);
        return {
          key: `${a.kind}-${a.tmdbId}`,
          image: data?.poster_path ? getImageUrl(data.poster_path, 'w342') : null,
          title: data?.name || data?.title || a.title,
          sub: [
            (data?.first_air_date || data?.release_date || '').slice(0, 4),
            a.kind === 'series' ? t('Serie') : t('Film'),
          ]
            .filter(Boolean)
            .join(' · '),
          to: `/${a.kind === 'series' ? 'series' : 'movie'}/${a.tmdbId}`,
        };
      })
    ).then((list) => alive && setItems(list));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return items;
}

export const GuestBookPage: React.FC<{ bookId: string }> = ({ bookId }) => {
  const navigate = useNavigate();
  const id = decodeURIComponent(bookId);
  const [state, setState] = useState<{ id: string; book: BookSearchResult | null } | null>(null);
  const [translated, setTranslated] = useState<string | null>(null);
  const [moreByAuthor, setMoreByAuthor] = useState<BookSearchResult[]>([]);
  const book = state?.id === id ? state.book : null;
  const [ctaRef, heroCtaVisible] = useHeroCtaVisible(!!book);

  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    setTranslated(null);
    setMoreByAuthor([]);
    void resolveBook(id).then((found) => alive && setState({ id, book: found }));
    void loadBookCatalogDescription(id, appLocale).then((text) => alive && setTranslated(text));
    return () => {
      alive = false;
    };
  }, [id]);

  const author = book?.authors?.[0];
  useEffect(() => {
    if (!author || !book?.title) return;
    let alive = true;
    fetchMoreByAuthor(author, book.title)
      .then((list) => alive && setMoreByAuthor(list))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [author, book?.title]);

  const { links, parts } = useBookLinks(
    book?.title,
    author,
    book?.series,
    editionLanguage(book ?? undefined)
  );
  const adaptationItems = useAdaptationPosters(links?.adaptations ?? []);

  if (!book) return <GuestShell status={state?.id === id ? 'failed' : 'loading'} />;

  const title = book.title;
  const cover = coverAtSize(book.cover, 'L') || book.cover || book.coverFallback;
  const seriesName = book.series?.name || links?.series?.name;
  const position = book.series?.position ?? links?.series?.position;
  const description = translated || book.description;

  const facts = [
    book.publishedYear ? String(book.publishedYear) : '',
    book.pageCount ? t('{n} Seiten', { n: book.pageCount }) : '',
    seriesName && position ? t('Band {n}', { n: position }) : '',
    book.publisher || '',
  ].filter(Boolean);

  const seriesItems: GuestRailItem[] = parts.map((part) => {
    const volume = displayVolume(part, seriesName);
    const partCover = part.result?.cover ? coverAtSize(part.result.cover, 'M') : null;
    return {
      key: `${part.position}-${part.wikidataId}`,
      image: partCover || null,
      title: part.title,
      sub: part.publishedDate?.slice(0, 4),
      badge: t('Bd. {n}', { n: volume }),
      to: part.result ? bookLink(part.result.id) : undefined,
      current: position !== undefined && part.position === position,
    };
  });

  const authorItems: GuestRailItem[] = moreByAuthor
    .filter((b) => b.cover && b.id !== book.id)
    .slice(0, 14)
    .map((b) => ({
      key: b.id,
      image: coverAtSize(b.cover, 'M') || b.cover,
      title: b.title,
      sub: b.publishedYear ? String(b.publishedYear) : undefined,
      to: bookLink(b.id),
    }));

  const notice: GuestNotice | null =
    seriesName && parts.length > 1
      ? {
          title: t('Teil der Reihe {name}', { name: seriesName }),
          text: t('{n} Bände — TV-RANK sagt dir, wenn der nächste erscheint.', {
            n: parts.length,
          }),
        }
      : null;

  const startTracking = () => {
    addGuestReadingPick({ ...bookItem(book), status: 'planned' });
    navigate('/join');
  };

  const pages = book.pageCount || 320;

  return (
    <GuestShell status="ready">
      <GuestHero
        backdrop={cover}
        blurBackdrop
        poster={cover}
        eyebrow={t('Buch')}
        eyebrowDetail={(book.categories || []).slice(0, 3)}
        title={title}
        byline={book.authors?.length ? book.authors.slice(0, 3).join(', ') : undefined}
        tagline={book.subtitle}
        rating={book.avgRating ? book.avgRating.toFixed(1) : undefined}
        facts={facts}
        ctaRef={ctaRef}
        onCta={startTracking}
      />

      <main className="gm-main">
        <GuestStory overviewTitle={t('Klappentext')} overview={description} notice={notice} />

        {seriesItems.length > 1 && (
          <GuestRail
            title={t('Die Reihe: {name}', { name: seriesName ?? '' })}
            items={seriesItems}
          />
        )}

        <GuestRail title={t('Verfilmt')} items={adaptationItems} />

        <GuestPitch
          heading={t('Mehr als ein Regal: so liest du {title}.', { title })}
          cover={cover}
          title={title}
          mockSub={t('Seite {p} von {n}', { p: Math.round(pages * 0.4), n: pages })}
          progress={40}
          chips={[
            { icon: <MenuBook />, label: t('Weiterlesen') },
            { icon: <Star />, label: t('Deine Bewertung') },
          ]}
          features={[
            {
              icon: <AutoStories />,
              title: t('Seite für Seite'),
              text: t('Lesestand, Lesetempo und wie lange du für {title} noch brauchst.', {
                title,
              }),
            },
            {
              icon: <NotificationsActive />,
              title: t('Der nächste Band kommt nicht ohne dich'),
              text: t('Reihen im Blick: TV-RANK zeigt dir, was als Nächstes erscheint.'),
            },
            {
              icon: <Groups />,
              title: t('Mit Freunden lesen'),
              text: t('Sieh, was Freunde lesen, empfiehl Bücher und tausch dich aus.'),
            },
            {
              icon: <Insights />,
              title: t('Dein Lesejahr'),
              text: t('Seiten, Bücher und Rekorde — dazu Serien, Filme und Manga in einer App.'),
            },
          ]}
        />

        {author && <GuestRail title={t('Mehr von {name}', { name: author })} items={authorItems} />}

        <GuestFinal cover={cover} title={title} onCta={startTracking} />
        <GuestLegal source={t('Buchdaten: Hardcover, Open Library, Deutsche Nationalbibliothek')} />
      </main>

      <GuestSticky visible={!heroCtaVisible} cover={cover} title={title} onCta={startTracking} />
    </GuestShell>
  );
};
