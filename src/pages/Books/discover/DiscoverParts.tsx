import { Add, Check, ChevronRight, Star, Whatshot } from '@mui/icons-material';
import { AnimatePresence, motion, type PanInfo, type Variants } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookShelf, useBookShelves } from '../../../hooks/books/useBookShelf';
import { useMangaForBook, useOwnedBooks } from '../../../hooks/books/useOwnedBooks';
import { useSwipeAxisLock } from '../../../hooks/ui/useSwipeAxisLock';
import { sanitizeBookKey } from '../../../lib/books/bookIdentity';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { curateShelf, daySeed, mixShelves, resultKeys } from '../../../lib/books/discoverMix';
import { fetchShelf, type ShelfId } from '../../../services/api/bookDiscovery';
import { findBook } from '../../../services/api/booksApi';
import { dateLocale, t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { BookSearchResult } from '../../../types/Book';
import { BookCover } from '../components/BookCover';
import { pauseOffscreen } from '../components/pauseOffscreen';
import '../components/books.css';
import { GENRES, SHELF_TITLES } from '../data/genres';
import { bookPath } from '../helpers';
import './discover.css';
import { useShelfClaim, useShelfTaken } from './discoverDedupe';
import { useHideOwned } from './useAddFlow';

const MIN_RATINGS = 5;

const ratingLabel = (r: BookSearchResult) =>
  r.avgRating && (r.ratingCount ?? 0) >= MIN_RATINGS
    ? r.avgRating.toLocaleString(dateLocale(), {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : null;

/** Öffnet eigene Bücher direkt, fremde als Vorschau mit den Treffer-Daten. */
export function useOpenResult() {
  const navigate = useNavigate();
  const ownedFor = useOwnedBooks();
  const mangaFor = useMangaForBook();
  return (result: BookSearchResult) => {
    const owned = ownedFor(result);
    const manga = owned ? undefined : mangaFor(result);
    if (manga) {
      navigate(`/manga/${manga.anilistId}`);
      return;
    }
    navigate(bookPath(owned?.id ?? result.id), owned ? undefined : { state: { result } });
  };
}

/** Öffnet ein Buch, von dem nur Titel und Autor bekannt sind (Wikidata): erst suchen, ohne Treffer Detail aus Titel + Autor. */
export function useOpenByTitle() {
  const navigate = useNavigate();
  const ownedFor = useOwnedBooks();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const open = async (title: string, author?: string) => {
    const key = `${title}|${author ?? ''}`;
    if (busyKey) return;
    setBusyKey(key);
    try {
      const result = (await findBook(title, author)) ?? {
        id: sanitizeBookKey(`wd-${title}-${author ?? ''}`),
        title,
        authors: author ? [author] : [],
        source: 'openlibrary' as const,
      };
      const owned = ownedFor(result);
      navigate(bookPath(owned?.id ?? result.id), owned ? undefined : { state: { result } });
    } finally {
      setBusyKey(null);
    }
  };
  return { open, busyKey };
}

export const DiscoverCard: React.FC<{
  result: BookSearchResult;
  rank?: number;
  onAdd: (result: BookSearchResult) => void;
}> = ({ result, rank, onAdd }) => {
  const { currentTheme } = useTheme();
  const ownedFor = useOwnedBooks();
  const mangaFor = useMangaForBook();
  const open = useOpenResult();
  const owned = ownedFor(result) ?? mangaFor(result);
  const rating = ratingLabel(result);

  return (
    <div
      className={`dsc-card${rank ? ' dsc-card--ranked' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => open(result)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open(result);
      }}
    >
      <div className="dsc-card-art">
        {rank ? <span className="dsc-rank">{rank}</span> : null}
        <BookCover book={result} fallbackSrc={result.coverFallback} />
        {owned ? (
          <span className="dsc-owned" style={{ background: currentTheme.status.success }}>
            <Check style={{ fontSize: 16 }} />
          </span>
        ) : (
          <button
            type="button"
            className="dsc-quick-add"
            aria-label={t('Buch hinzufügen')}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(result);
            }}
          >
            <Add style={{ fontSize: 20 }} />
          </button>
        )}
      </div>
      <span className="bk-item-title" style={{ color: currentTheme.text.secondary }}>
        {result.title}
      </span>
      <span className="dsc-card-meta" style={{ color: currentTheme.text.muted }}>
        <span className="bk-item-sub">{result.authors[0] ?? ''}</span>
        {rating && (
          <span
            className="dsc-rating"
            aria-label={t('{rating} von 5 Sternen', { rating })}
            title={t('{n} Bewertungen bei Open Library', { n: result.ratingCount ?? 0 })}
          >
            <Star style={{ fontSize: 13, color: currentTheme.status.warning }} />
            {rating}
          </span>
        )}
      </span>
    </div>
  );
};

export const SkeletonCards: React.FC<{ count?: number; ranked?: boolean }> = ({
  count = 6,
  ranked,
}) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        ref={pauseOffscreen}
        className={`dsc-card${ranked ? ' dsc-card--ranked' : ''}`}
        aria-hidden
      >
        <div
          className="dsc-skeleton"
          style={ranked ? { width: '72%', marginLeft: 'auto' } : undefined}
        />
        <div className="dsc-skeleton-line" style={{ width: '82%' }} />
        <div className="dsc-skeleton-line" style={{ width: '54%', height: 9 }} />
      </div>
    ))}
  </>
);

const ShelfRow: React.FC<{
  sectionRef: React.Ref<HTMLElement>;
  title: string;
  caption?: string;
  icon: React.ReactNode;
  iconColor: string;
  onSeeAll?: () => void;
  items: BookSearchResult[];
  loading: boolean;
  ranked?: boolean;
  onAdd: (result: BookSearchResult) => void;
}> = ({ sectionRef, title, caption, icon, iconColor, onSeeAll, items, loading, ranked, onAdd }) => {
  const { currentTheme } = useTheme();
  return (
    <section ref={sectionRef} className="bk-section">
      <SectionHeader
        icon={icon}
        iconColor={iconColor}
        title={title}
        onSeeAll={onSeeAll}
        seeAllLabel={t('Alle')}
        style={caption ? { marginBottom: 4 } : undefined}
      />
      {caption && (
        <p className="dsc-caption" style={{ color: currentTheme.text.muted }}>
          {caption}
        </p>
      )}
      <HorizontalScrollContainer scrollerClassName="dsc-row">
        {loading && items.length === 0 ? (
          <SkeletonCards ranked={ranked} />
        ) : (
          items.map((r, i) => (
            <DiscoverCard key={r.id} result={r} rank={ranked ? i + 1 : undefined} onAdd={onAdd} />
          ))
        )}
      </HorizontalScrollContainer>
    </section>
  );
};

const NEW_SHELF_LIMIT = 40;

/** Rangliste eines Regals: ohne eigene Bücher, ein Buch je Autor. */
export const DiscoverShelf: React.FC<{
  id: ShelfId;
  onAdd: (result: BookSearchResult) => void;
  ranked?: boolean;
  iconColor?: string;
  dedupeKey?: string;
}> = ({ id, onAdd, ranked, iconColor, dedupeKey }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const hideOwned = useHideOwned();
  const taken = useShelfTaken(dedupeKey);
  const { ref, items, loading, error } = useBookShelf(id, { limit: NEW_SHELF_LIMIT });
  const shown = useMemo(
    () =>
      curateShelf(items, {
        isOwned: (r) => hideOwned(r) || resultKeys(r).some((k) => taken.has(k)),
        perAuthor: 1,
      }).items.slice(0, ranked ? 10 : 20),
    [items, hideOwned, taken, ranked]
  );
  useShelfClaim(dedupeKey, shown);
  if (error || (!loading && shown.length === 0)) return null;

  return (
    <ShelfRow
      sectionRef={ref}
      title={SHELF_TITLES[id]()}
      icon={<Whatshot />}
      iconColor={iconColor ?? currentTheme.primary}
      onSeeAll={() => navigate(`/books/search?genre=${id}`)}
      items={shown}
      loading={loading}
      ranked={ranked}
      onAdd={onAdd}
    />
  );
};

/** Bestbewertete und Geheimtipps aus einem oder mehreren Genres, jeden Tag neu gemischt. */
export const MixedShelf: React.FC<{
  ids: ShelfId[];
  onAdd: (result: BookSearchResult) => void;
  title?: string;
  caption?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  dedupeKey?: string;
}> = ({ ids, onAdd, title, caption, icon, iconColor, dedupeKey }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const hideOwned = useHideOwned();
  const taken = useShelfTaken(dedupeKey);
  const { ref, lists, loading, error } = useBookShelves(
    ids.flatMap((id) => [
      { id, sort: 'gems' as const },
      { id, sort: 'top' as const },
    ])
  );
  const seedKey = ids.join('+');
  const [seed] = useState(() => `${daySeed()}:${seedKey}`);
  const items = useMemo(
    () =>
      mixShelves(lists, {
        seed,
        size: 20,
        isOwned: (r) => hideOwned(r) || resultKeys(r).some((k) => taken.has(k)),
        perAuthor: 1,
      }),
    [lists, seed, hideOwned, taken]
  );
  useShelfClaim(dedupeKey, items);
  if (error || (!loading && items.length === 0)) return null;
  const genre = ids.length === 1 ? GENRES.find((g) => g.id === ids[0]) : undefined;
  const GenreIcon = genre?.icon;

  return (
    <ShelfRow
      sectionRef={ref}
      title={title ?? SHELF_TITLES[ids[0]]()}
      caption={caption}
      icon={icon ?? (GenreIcon ? <GenreIcon /> : <Whatshot />)}
      iconColor={iconColor ?? genre?.colors[1] ?? currentTheme.primary}
      onSeeAll={genre ? () => navigate(`/books/search?genre=${genre.id}`) : undefined}
      items={items}
      loading={loading}
      onAdd={onAdd}
    />
  );
};

export const GenreTiles: React.FC<{ title?: string }> = ({ title }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  return (
    <section className="bk-section">
      <SectionHeader
        icon={<ChevronRight />}
        iconColor={currentTheme.accent}
        title={title ?? t('Stöbern nach Genre')}
      />
      <div className="dsc-genres">
        {GENRES.map((g) => (
          <GenreTile key={g.id} id={g.id} onOpen={() => navigate(`/books/search?genre=${g.id}`)} />
        ))}
      </div>
    </section>
  );
};

const GenreTile: React.FC<{ id: ShelfId; onOpen: () => void }> = ({ id, onOpen }) => {
  const genre = GENRES.find((g) => g.id === id);
  if (!genre) return null;
  const Icon = genre.icon;
  return (
    <button
      type="button"
      className="dsc-genre"
      onClick={onOpen}
      style={{
        background: `radial-gradient(120% 140% at 0% 100%, ${genre.colors[0]}, transparent 70%), linear-gradient(135deg, ${genre.colors[0]}, ${genre.colors[1]})`,
      }}
    >
      <Icon className="dsc-genre-icon" aria-hidden />
      <span className="dsc-genre-label">{genre.label()}</span>
    </button>
  );
};

const HERO_SWIPE_MIN_PX = 50;

const heroSlide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
};

/** Großes Feature-Karussell aus den beliebten Neuerscheinungen (hinter den Top 10), nichts aus deiner Sammlung. */
export const FeaturedHero: React.FC<{ onAdd: (result: BookSearchResult) => void }> = ({
  onAdd,
}) => {
  const { currentTheme } = useTheme();
  const open = useOpenResult();
  const ownedFor = useOwnedBooks();
  const hideOwned = useHideOwned();
  const [featured, setFeatured] = useState<{ result: BookSearchResult; genre: ShelfId }[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const draggedRef = useRef(false);
  useShelfClaim(
    'hero',
    featured.map((f) => f.result)
  );

  useEffect(() => {
    let alive = true;
    fetchShelf('new', { limit: NEW_SHELF_LIMIT })
      .then((list) => {
        if (!alive) return;
        const fresh = curateShelf(list, { isOwned: hideOwned, perAuthor: 1 }).items;
        const picks = (fresh.length > 14 ? fresh.slice(10, 16) : fresh.slice(0, 6)).map(
          (result) => ({ result, genre: 'new' as ShelfId })
        );
        setFeatured(picks);
      })
      .catch(() => alive && setFeatured([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (featured.length < 2 || paused) return;
    const timer = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % featured.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length, paused]);

  const slide = featured[index % Math.max(1, featured.length)];
  const current = slide?.result;
  const canSwipe = featured.length > 1;
  const heroRef = useRef<HTMLElement>(null);
  useSwipeAxisLock(heroRef, canSwipe);

  const step = (delta: 1 | -1) => {
    setDir(delta);
    setIndex((i) => (i + delta + featured.length) % featured.length);
  };

  const jumpTo = (i: number) => {
    if (i === index) return;
    setDir(i > index ? 1 : -1);
    setIndex(i);
  };

  const handleSwipe = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { x, y } = info.offset;
    if (Math.abs(x) < HERO_SWIPE_MIN_PX || Math.abs(x) < Math.abs(y)) return;
    step(x < 0 ? 1 : -1);
  };

  if (!loading && !current) return null;

  return (
    <section
      ref={heroRef}
      className="dsc-hero"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {current?.cover && (
        <div
          className="dsc-hero-bg"
          style={{ backgroundImage: `url(${coverAtSize(current.cover, 'M')})` }}
        />
      )}
      <div
        className="dsc-hero-shade"
        style={{
          background: `linear-gradient(100deg, ${currentTheme.background.default}f2 0%, ${currentTheme.background.default}b3 45%, ${currentTheme.background.default}40 100%)`,
        }}
      />
      {current ? (
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={current.id}
            className="dsc-hero-inner"
            custom={dir}
            variants={heroSlide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeOut' }}
            drag={canSwipe ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            dragMomentum={false}
            dragSnapToOrigin
            onPointerDownCapture={() => {
              draggedRef.current = false;
            }}
            onDragStart={() => {
              draggedRef.current = true;
            }}
            onDragEnd={handleSwipe}
            onClickCapture={(e) => {
              if (!draggedRef.current) return;
              e.preventDefault();
              e.stopPropagation();
            }}
            style={canSwipe ? { touchAction: 'pan-y' } : undefined}
          >
            <div className="dsc-hero-copy">
              <span className="dsc-kicker" style={{ color: '#fff' }}>
                <Whatshot style={{ fontSize: 14, color: currentTheme.status.warning }} />
                {SHELF_TITLES[slide.genre]()}
              </span>
              <h2 className="dsc-hero-title">{current.title}</h2>
              <span className="dsc-hero-author">
                {[current.authors[0], current.publishedYear].filter(Boolean).join(' · ')}
              </span>
            </div>
            <div className="dsc-hero-actions">
              {ownedFor(current) ? (
                <button
                  type="button"
                  className="bk-cta"
                  onClick={() => open(current)}
                  style={{
                    color: getOptimalTextColor(currentTheme.status.success),
                    background: currentTheme.status.success,
                  }}
                >
                  <Check style={{ fontSize: 18 }} />
                  {t('In deinen Büchern')}
                </button>
              ) : (
                <button
                  type="button"
                  className="bk-cta"
                  onClick={() => onAdd(current)}
                  style={{
                    color: getOptimalTextColor(currentTheme.primary),
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  }}
                >
                  <Add style={{ fontSize: 18 }} />
                  {t('Zu meinen Büchern')}
                </button>
              )}
              <button
                type="button"
                className="bk-cta bk-cta--ghost"
                onClick={() => open(current)}
                style={{ color: '#fff', background: 'rgba(0,0,0,0.3)' }}
              >
                {t('Ansehen')}
              </button>
            </div>
            <div
              className="dsc-hero-cover"
              onClick={() => open(current)}
              style={{ cursor: 'pointer' }}
            >
              <BookCover book={current} depth eager />
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="dsc-hero-inner" ref={pauseOffscreen} aria-hidden>
          <div className="dsc-hero-copy">
            <div className="dsc-skeleton-line" style={{ width: 140 }} />
            <div className="dsc-skeleton-line" style={{ width: '80%', height: 30 }} />
            <div className="dsc-skeleton-line" style={{ width: '50%' }} />
          </div>
          <div className="dsc-skeleton" />
        </div>
      )}
      {featured.length > 1 && (
        <div className="dsc-hero-rail">
          {featured.map((f, i) => (
            <button
              key={f.result.id}
              type="button"
              className={`dsc-hero-thumb${i === index ? ' dsc-hero-thumb--on' : ''}`}
              onClick={() => jumpTo(i)}
              aria-label={f.result.title}
              style={i === index ? { outlineColor: currentTheme.primary } : undefined}
            >
              <BookCover book={f.result} />
              <span className="dsc-hero-thumb-label">{f.result.authors[0] ?? ''}</span>
            </button>
          ))}
        </div>
      )}
      {featured.length > 1 && (
        <div className="dsc-hero-dots">
          {featured.map((f, i) => (
            <button
              key={f.result.id}
              type="button"
              aria-label={SHELF_TITLES[f.genre]()}
              className={`dsc-hero-dot${i === index ? ' dsc-hero-dot--on' : ''}`}
              onClick={() => jumpTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
