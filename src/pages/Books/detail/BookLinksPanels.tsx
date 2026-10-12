import { Check, Movie, Tv, ViewWeek } from '@mui/icons-material';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { bookMatchKey } from '../../../lib/books/bookIdentity';
import { t } from '../../../services/i18n';
import type { Book, BookSeriesPart } from '../../../types/Book';
import { getImageUrl } from '../../../utils/imageUrl';
import { BookCover } from '../components/BookCover';
import { useOpenByTitle, useOpenResult } from '../discover/DiscoverParts';
import { bookPath } from '../helpers';
import type { AdaptationMeta } from '../hooks/useAdaptationMeta';
import { useSeriesPartBooks } from '../hooks/useSeriesPartBooks';

const base = (title: string, authors?: string[]) => bookMatchKey(title, authors).split('|')[0];

const ownedPart = (part: BookSeriesPart, seriesId: string, library: Book[]) =>
  library.find(
    (b) =>
      (b.series?.wikidataId === seriesId && b.series.position === part.position) ||
      base(b.title, b.authors) === base(part.title)
  );

export const BookSeriesPanel: React.FC<{
  seriesId: string;
  name: string;
  parts: BookSeriesPart[];
  current: Book | null;
  currentPosition?: number;
  library: Book[];
  author?: string;
}> = ({ seriesId, name, parts, current, currentPosition, library, author }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const openResult = useOpenResult();
  const { open } = useOpenByTitle();
  const lookups = useMemo(
    () =>
      parts.length < 2
        ? []
        : parts
            .filter((part) => !ownedPart(part, seriesId, library))
            .map((part) => ({ part, author })),
    [parts, seriesId, library, author]
  );
  const found = useSeriesPartBooks(lookups);
  if (parts.length < 2) return null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="bd-panel">
      <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
        <ViewWeek style={{ fontSize: 20, color: currentTheme.accent }} />
        {name || t('Reihe')}
        <span className="bk-muted" style={{ color: currentTheme.text.muted, fontWeight: 700 }}>
          · {t('{n} Bände', { n: parts.length })}
        </span>
      </h2>
      <div className="bd-series-strip">
        {parts.map((part) => {
          const owned = ownedPart(part, seriesId, library);
          const match = found[part.wikidataId];
          const isCurrent =
            (currentPosition && part.position === currentPosition) ||
            (!!current && base(current.title, current.authors) === base(part.title));
          const upcoming = !!part.publishedDate && part.publishedDate > today;
          const read = owned?.status === 'completed';
          return (
            <button
              key={`${part.position}-${part.wikidataId}`}
              type="button"
              className="bd-series-part"
              onClick={() =>
                owned
                  ? navigate(bookPath(owned.id))
                  : match
                    ? openResult(match)
                    : void open(part.title, author)
              }
            >
              <span style={{ position: 'relative' }}>
                <BookCover
                  book={
                    owned ?? {
                      id: part.wikidataId,
                      title: part.title,
                      authors: author ? [author] : [],
                      cover: match?.cover,
                    }
                  }
                  fallbackSrc={owned ? undefined : match?.coverFallback}
                  style={{
                    outline: isCurrent ? `2px solid ${currentTheme.primary}` : undefined,
                    outlineOffset: 3,
                    borderRadius: 8,
                    opacity: upcoming ? 0.55 : 1,
                  }}
                />
                <span
                  className="bd-series-pos"
                  style={{
                    background: isCurrent ? currentTheme.primary : 'rgba(0,0,0,0.7)',
                    color: '#fff',
                  }}
                >
                  {part.position}
                </span>
                {read && (
                  <span
                    className="bd-series-state"
                    style={{ background: currentTheme.status.success, color: '#fff' }}
                  >
                    <Check style={{ fontSize: 15 }} />
                  </span>
                )}
              </span>
              <span className="bk-item-title" style={{ color: currentTheme.text.secondary }}>
                {part.title}
              </span>
              <span
                className="bk-item-sub"
                style={{ color: upcoming ? currentTheme.status.warning : currentTheme.text.muted }}
              >
                {upcoming
                  ? t('Erscheint {year}', { year: part.publishedDate?.slice(0, 4) ?? '' })
                  : owned
                    ? t('In deinen Büchern')
                    : (part.publishedDate?.slice(0, 4) ?? '')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const BookAdaptationsPanel: React.FC<{ items: AdaptationMeta[] }> = ({ items }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  if (items.length === 0) return null;
  return (
    <div className="bd-panel">
      <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
        <Movie style={{ fontSize: 20, color: currentTheme.status.purple }} />
        {t('Verfilmt als')}
      </h2>
      <div className="bd-series-strip">
        {items.map((a) => (
          <button
            key={`${a.kind}-${a.tmdbId}`}
            type="button"
            className="bd-adapt"
            onClick={() => navigate(`/${a.kind === 'series' ? 'series' : 'movie'}/${a.tmdbId}`)}
          >
            <span className="bd-adapt-poster">
              {a.poster ? (
                <img src={getImageUrl(a.poster, 'w185')} alt="" loading="lazy" />
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: currentTheme.text.muted,
                  }}
                >
                  {a.kind === 'series' ? <Tv /> : <Movie />}
                </span>
              )}
              <span
                className="bd-adapt-badge"
                style={{
                  background: a.inList ? `${currentTheme.status.success}dd` : 'rgba(0,0,0,0.6)',
                  color: '#fff',
                }}
              >
                {a.inList ? t('In deiner Liste') : a.kind === 'series' ? t('Serie') : t('Film')}
              </span>
            </span>
            <span className="bk-item-title" style={{ color: currentTheme.text.secondary }}>
              {a.displayTitle}
            </span>
            <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
              {[a.kind === 'series' ? t('Serie') : t('Film'), a.year].filter(Boolean).join(' · ')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
