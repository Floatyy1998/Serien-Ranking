import { AutoStories, ChevronRight, MenuBook } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { findOwnedBook, useBasedOnBooks } from '../../../hooks/books/useBasedOnBooks';
import { progressPercent } from '../../../lib/books/bookProgress';
import { findBook } from '../../../services/api/booksApi';
import { t } from '../../../services/i18n';
import type { BasedOnBook, Book } from '../../../types/Book';
import { bookPath, searchPath, STATUS_LABELS } from '../helpers';
import { BookCover } from './BookCover';
import './books.css';

const BasedOnRow: React.FC<{ source: BasedOnBook; owned?: Book; kind: 'series' | 'movie' }> = ({
  source,
  owned,
  kind,
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [cover, setCover] = useState<string | undefined>(owned?.cover);

  useEffect(() => {
    if (owned?.cover || source.isSeries) return;
    let alive = true;
    void findBook(source.title, source.author).then((r) => {
      if (alive && r?.cover) setCover(r.cover);
    });
    return () => {
      alive = false;
    };
  }, [owned?.cover, source.isSeries, source.title, source.author]);

  const status = owned ? STATUS_LABELS[owned.status]() : null;
  const pct = owned ? progressPercent(owned) : 0;
  const hint = owned
    ? owned.status === 'reading'
      ? t('Du liest es gerade · {n} %', { n: pct })
      : status
    : kind === 'series'
      ? t('Erst lesen oder erst schauen?')
      : t('Das Buch zum Film');

  return (
    <button
      type="button"
      className="bk-tap"
      onClick={() =>
        navigate(
          owned
            ? bookPath(owned.id)
            : searchPath(source.author ? `${source.title} ${source.author}` : source.title)
        )
      }
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr auto',
        gap: 14,
        alignItems: 'center',
        width: '100%',
        padding: 14,
        borderRadius: 18,
        border: '1px solid var(--glass-border-light)',
        background: `linear-gradient(120deg, ${currentTheme.status.purple}1a, var(--glass-light) 55%)`,
        font: 'inherit',
        textAlign: 'left',
        color: 'inherit',
        cursor: 'pointer',
      }}
    >
      <BookCover
        book={{
          id: source.wikidataId,
          title: source.title,
          authors: source.author ? [source.author] : [],
          cover,
        }}
      />
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span className="bk-source-kicker" style={{ color: currentTheme.status.purple }}>
          {source.isSeries ? t('Basiert auf der Buchreihe') : t('Basiert auf dem Buch')}
        </span>
        <span
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: currentTheme.text.secondary,
            lineHeight: 1.25,
          }}
        >
          {source.title}
        </span>
        {source.author && (
          <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
            {source.author}
          </span>
        )}
        <span
          className="bk-badge"
          style={{
            marginTop: 2,
            background: owned ? `${currentTheme.status.success}22` : 'rgba(255,255,255,0.07)',
            color: owned ? currentTheme.status.success : currentTheme.text.secondary,
          }}
        >
          {owned ? <MenuBook style={{ fontSize: 13 }} /> : <AutoStories style={{ fontSize: 13 }} />}
          {hint}
        </span>
      </span>
      <ChevronRight style={{ color: currentTheme.text.muted }} />
    </button>
  );
};

/** Karte auf Serien- und Filmseiten: die Buchvorlage, mit Stand aus deinen Büchern. */
export const BasedOnBookSection: React.FC<{
  tmdbId: number;
  kind: 'series' | 'movie';
  isMobile: boolean;
}> = ({ tmdbId, kind, isMobile }) => {
  const { books } = useBasedOnBooks(tmdbId, kind);
  const { allBookList } = useBooksList();
  if (books.length === 0) return null;

  return (
    <div
      style={{
        padding: isMobile ? '0 12px 16px' : '0 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {books.slice(0, 2).map((b) => (
        <BasedOnRow
          key={b.wikidataId}
          source={b}
          owned={findOwnedBook(allBookList, b.title, b.author)}
          kind={kind}
        />
      ))}
    </div>
  );
};
