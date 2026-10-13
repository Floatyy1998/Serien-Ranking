import { Add, Check, ChevronRight, Whatshot } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookShelf } from '../../../hooks/books/useBookShelf';
import { useOwnedBooks } from '../../../hooks/books/useOwnedBooks';
import { sanitizeBookKey } from '../../../lib/books/bookIdentity';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { fetchShelf, type ShelfId } from '../../../services/api/bookDiscovery';
import { findBook } from '../../../services/api/booksApi';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { BookSearchResult } from '../../../types/Book';
import { BookCover } from '../components/BookCover';
import { pauseOffscreen } from '../components/pauseOffscreen';
import '../components/books.css';
import { GENRES, SHELF_TITLES } from '../data/genres';
import { bookPath } from '../helpers';
import './discover.css';

/** Öffnet eigene Bücher direkt, fremde als Vorschau mit den Treffer-Daten. */
export function useOpenResult() {
  const navigate = useNavigate();
  const ownedFor = useOwnedBooks();
  return (result: BookSearchResult) => {
    const owned = ownedFor(result);
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
  const open = useOpenResult();
  const owned = ownedFor(result);

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
      <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
        {result.authors[0] ?? ''}
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

export const DiscoverShelf: React.FC<{
  id: ShelfId;
  onAdd: (result: BookSearchResult) => void;
  ranked?: boolean;
  icon?: React.ReactNode;
  iconColor?: string;
  exclude?: Set<string>;
}> = ({ id, onAdd, ranked, icon, iconColor, exclude }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { ref, items, loading, error } = useBookShelf(id);
  const shown = (exclude ? items.filter((r) => !exclude.has(r.id)) : items).slice(
    0,
    ranked ? 10 : 20
  );
  if (error || (!loading && shown.length === 0)) return null;
  const genre = GENRES.find((g) => g.id === id);

  return (
    <section ref={ref} className="bk-section">
      <SectionHeader
        icon={icon ?? <Whatshot />}
        iconColor={iconColor ?? genre?.colors[1] ?? currentTheme.primary}
        title={SHELF_TITLES[id]()}
        onSeeAll={() => navigate(`/books/search?genre=${id}`)}
        seeAllLabel={t('Alle')}
      />
      <HorizontalScrollContainer scrollerClassName="dsc-row">
        {loading && shown.length === 0 ? (
          <SkeletonCards ranked={ranked} />
        ) : (
          shown.map((r, i) => (
            <DiscoverCard key={r.id} result={r} rank={ranked ? i + 1 : undefined} onAdd={onAdd} />
          ))
        )}
      </HorizontalScrollContainer>
    </section>
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

/** Großes Feature-Karussell aus den beliebten Neuerscheinungen (hinter den Top 10), nichts aus deiner Sammlung. */
export const FeaturedHero: React.FC<{ onAdd: (result: BookSearchResult) => void }> = ({
  onAdd,
}) => {
  const { currentTheme } = useTheme();
  const open = useOpenResult();
  const ownedFor = useOwnedBooks();
  const [featured, setFeatured] = useState<{ result: BookSearchResult; genre: ShelfId }[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchShelf('new')
      .then((list) => {
        if (!alive) return;
        const fresh = list.filter((r) => !ownedFor(r));
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
    const timer = setInterval(() => setIndex((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(timer);
  }, [featured.length, paused]);

  const slide = featured[index % Math.max(1, featured.length)];
  const current = slide?.result;

  if (!loading && !current) return null;

  return (
    <section
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
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="dsc-hero-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
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
              onClick={() => setIndex(i)}
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
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
