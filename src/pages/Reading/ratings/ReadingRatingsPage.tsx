import { Star, WorkspacePremium } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, PageHeader, PageLayout } from '../../../components/ui';
import { LoadingSpinner } from '../../../components/ui/feedback/LoadingSpinner';
import { QuickRatingSheet } from '../../../components/ui/overlay/QuickRatingSheet';
import { useAuth } from '../../../contexts/AuthContext';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import { mangaStandLabel } from '../../../lib/manga/progress';
import { usesArea } from '../../../lib/reading/readingMedium';
import {
  availableKinds,
  buildRatingItems,
  formatRating,
  rankRatingItems,
  ratingQueue,
  ratingSummary,
  type RankedItem,
  type RatingItem,
  type RatingKind,
} from '../../../lib/reading/readingRatings';
import { dateLocale, t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import { BookCover } from '../../Books/components/BookCover';
import '../../Books/components/books.css';
import { bookPath } from '../../Books/helpers';
import { useBookActions } from '../../Books/hooks/useBookActions';
import { FORMAT_COLORS, getDisplayFormat, getDisplayFormatKey } from '../../Manga/mangaUtils';
import './ReadingRatingsPage.css';

/** Medaillen sind Semantik, kein Theme — wie auf der Rangliste. */
const MEDALS = ['#f3c969', '#cfd6df', '#d79663'];

const KIND_LABELS: Record<RatingKind, () => string> = {
  book: () => t('Bücher'),
  manga: () => 'Manga',
};

const bookBadge = (book: Book): string =>
  book.format === 'ebook' ? t('E-Book') : book.format === 'audio' ? t('Hörbuch') : t('Buch');

const hrefFor = (item: RatingItem): string => {
  if (item.kind === 'manga') return `/manga/${item.manga.anilistId}`;
  const { id } = item.book;
  return id.startsWith('manga-') ? `/manga/${id.slice(6)}` : bookPath(id);
};

const tagOf = (item: RatingItem, bookColor: string): { label: string; color: string } =>
  item.kind === 'book'
    ? { label: bookBadge(item.book), color: bookColor }
    : {
        label: getDisplayFormat(item.manga.countryOfOrigin, item.manga.format),
        color:
          FORMAT_COLORS[getDisplayFormatKey(item.manga.countryOfOrigin, item.manga.format)] ||
          bookColor,
      };

const subOf = (item: RatingItem): string => {
  if (item.kind === 'book') return item.book.authors?.[0] ?? '';
  return item.manga.readStatus === 'completed' ? t('Beendet') : mangaStandLabel(item.manga);
};

const medalFor = (place: number): string | undefined => MEDALS[place - 1];

const Cover = ({ item, eager }: { item: RatingItem; eager?: boolean }) =>
  item.kind === 'book' ? (
    <BookCover book={item.book} className="rrt-cover" eager={eager} />
  ) : (
    <div className="rrt-cover rrt-cover--img">
      <img
        src={item.manga.poster || PLACEHOLDER_SVG}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );

const Tag = ({ item, bookColor }: { item: RatingItem; bookColor: string }) => {
  const tag = tagOf(item, bookColor);
  return (
    <span className="rrt-tag" style={{ color: tag.color, background: `${tag.color}1f` }}>
      {tag.label}
    </span>
  );
};

/** Bewertungen aller gelesenen Titel als Ranking: Podium, Rangliste und was noch offen ist. */
export const ReadingRatingsPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { bookList, loading: booksLoading } = useBooksList();
  const { mangaList, loading: mangaLoading } = useMangaList();
  const bookActions = useBookActions();
  const areas = useReadingAreas();
  const navigate = useNavigate();
  const showBooks = usesArea(areas, 'books');
  const showManga = usesArea(areas, 'manga');

  const [kind, setKind] = useState<RatingKind | null>(null);
  const [rateBook, setRateBook] = useState<Book | null>(null);

  const all = useMemo(
    () => buildRatingItems(showBooks ? bookList : [], showManga ? mangaList : [], user?.uid),
    [bookList, mangaList, showBooks, showManga, user?.uid]
  );
  const kinds = useMemo(() => availableKinds(all), [all]);
  const activeKind = kind && kinds.includes(kind) ? kind : null;
  const ranked = useMemo(() => rankRatingItems(all, activeKind), [all, activeKind]);
  const queue = useMemo(() => ratingQueue(all, activeKind), [all, activeKind]);
  const stats = useMemo(() => ratingSummary(ranked), [ranked]);
  const locale = dateLocale();
  const loading = (showBooks && booksLoading) || (showManga && mangaLoading);
  const bookColor = currentTheme.accent;

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const score = (value: number) => formatRating(value, locale, true);

  const openRate = (item: RatingItem) => {
    if (item.kind === 'book' && !item.book.id.startsWith('manga-')) setRateBook(item.book);
    else navigate(`${hrefFor(item)}#rating`);
  };

  const spot = (item: RankedItem, index: number) => {
    const medal = medalFor(item.place) ?? currentTheme.text.muted;
    return (
      <button
        key={item.key}
        type="button"
        className={`rrt-spot rrt-spot--${index + 1}`}
        style={{ ['--medal' as string]: medal }}
        aria-label={t('{title} öffnen', { title: item.title })}
        onClick={() => navigate(hrefFor(item))}
      >
        <span className="rrt-spot-cover">
          <Cover item={item} eager />
          <span className="rrt-spot-score">
            <Star style={{ fontSize: 14 }} />
            {score(item.rating)}
          </span>
        </span>
        <span className="rrt-spot-title">{item.title}</span>
        <span className="rrt-spot-sub" style={{ color: currentTheme.text.muted }}>
          {subOf(item) || tagOf(item, bookColor).label}
        </span>
        <span className="rrt-plinth">
          {item.place === 1 && <WorkspacePremium style={{ fontSize: 20 }} />}
          <span className="rrt-plinth-place">{item.place}</span>
        </span>
      </button>
    );
  };

  return (
    <PageLayout>
      <PageHeader
        title={t('Bewertungen')}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        subtitle={
          stats.count > 0
            ? t('{n} bewertet · Ø {avg}', {
                n: stats.count,
                avg: formatRating(stats.average, locale, true),
              })
            : t('{n} Titel', { n: all.length })
        }
        icon={<Star />}
      />

      <div className="rrt-page">
        {kinds.length > 0 && (
          <div className="rrt-filters" role="group" aria-label={t('Medium')}>
            {[null, ...kinds].map((k) => (
              <button
                key={k ?? 'all'}
                type="button"
                aria-pressed={activeKind === k}
                className={`rrt-chip ${activeKind === k ? 'rrt-chip--active' : ''}`}
                onClick={() => setKind(k)}
              >
                {k ? KIND_LABELS[k]() : t('Alle')}
              </button>
            ))}
          </div>
        )}

        {loading && all.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <>
            {queue.length > 0 && (
              <section className="rrt-queue" aria-label={t('Noch zu bewerten')}>
                <h2 className="rrt-heading">
                  {t('Noch zu bewerten')}
                  <span className="rrt-heading-count" style={{ color: currentTheme.text.muted }}>
                    {queue.length}
                  </span>
                </h2>
                <div className="rrt-queue-row">
                  {queue.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="rrt-queue-item"
                      aria-label={t('{title} bewerten', { title: item.title })}
                      onClick={() => openRate(item)}
                    >
                      <Cover item={item} />
                      <span className="rrt-queue-title">{item.title}</span>
                      <span className="rrt-queue-cta">
                        <Star style={{ fontSize: 13 }} />
                        {t('Bewerten')}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {ranked.length === 0 ? (
              <EmptyState
                icon={<Star style={{ fontSize: 40 }} />}
                title={t('Noch keine Bewertungen')}
                description={t('Bewerte, was du gelesen hast – hier entsteht dein Ranking.')}
              />
            ) : (
              <>
                <div className={`rrt-podium rrt-podium--${podium.length}`}>{podium.map(spot)}</div>

                {rest.length > 0 && (
                  <ol className="rrt-list" aria-label={t('Rangliste')}>
                    {rest.map((item) => (
                      <li key={item.key} className="rrt-list-li">
                        <button
                          type="button"
                          className="rrt-row"
                          aria-label={t('{title} öffnen', { title: item.title })}
                          onClick={() => navigate(hrefFor(item))}
                        >
                          <span
                            className="rrt-row-place"
                            style={{ color: currentTheme.text.muted }}
                          >
                            {item.place}
                          </span>
                          <Cover item={item} />
                          <span className="rrt-row-meta">
                            <span className="rrt-row-title">{item.title}</span>
                            <span
                              className="rrt-row-sub"
                              style={{ color: currentTheme.text.muted }}
                            >
                              <Tag item={item} bookColor={bookColor} />
                              {subOf(item) && (
                                <span className="rrt-row-sub-text">{subOf(item)}</span>
                              )}
                            </span>
                          </span>
                          <span
                            className="rrt-row-score"
                            aria-label={t('Bewertung {rating}', { rating: score(item.rating) })}
                          >
                            <Star style={{ fontSize: 17 }} />
                            {score(item.rating)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
          </>
        )}
      </div>

      {rateBook && (
        <QuickRatingSheet
          isOpen
          onClose={() => setRateBook(null)}
          seriesTitle={rateBook.title}
          eyebrow={t('Deine Bewertung')}
          initialRating={0}
          genreStage={false}
          onRate={(value) => {
            void bookActions.rate(rateBook, Math.round(value * 10) / 10);
            setRateBook(null);
          }}
        />
      )}
    </PageLayout>
  );
};
