import { Star } from '@mui/icons-material';
import React, { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { useTheme } from '../../contexts/ThemeContext';
import { useDrawInProgress } from '../../hooks/ui/useDrawInProgress';
import { progressPercent } from '../../lib/books/bookProgress';
import type { Book } from '../../types/Book';
import { BookCover } from '../Books/components/BookCover';
import { STATUS_LABELS, bookPath } from '../Books/helpers';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

const RatingBookCard = React.memo<{ book: Book; theme: Theme; onOpen: (id: string) => void }>(
  ({ book, theme, onOpen }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const done = book.status === 'completed';
    const ring = done ? 100 : book.status === 'reading' ? progressPercent(book) : 0;
    useDrawInProgress(cardRef, ring);
    const rating = book.rating ?? 0;
    const author = book.authors?.[0];
    const statusText =
      book.status === 'reading' && ring > 0 ? `${ring}%` : STATUS_LABELS[book.status]?.();

    return (
      <div
        className="ratings-grid-item"
        role="button"
        tabIndex={0}
        aria-label={book.title}
        onClick={() => onOpen(book.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(book.id);
          }
        }}
      >
        <div
          ref={cardRef}
          className={`ratings-card${
            ring > 0 ? ` ratings-card--ring${ring === 100 ? ' ratings-card--ring-done' : ''}` : ''
          }`}
          style={
            {
              '--ring-color': ring === 100 ? theme.status.success : theme.primary,
            } as React.CSSProperties
          }
        >
          <BookCover book={book} size="L" className="ratings-book-cover" />
          <div className="ratings-card-overlay">
            <div className="ratings-card-top" />
            <div className="ratings-card-bottom">
              <h2 className="ratings-card-title">{book.title}</h2>
              <div className="ratings-card-meta">
                {rating > 0 && (
                  <span className="ratings-card-rating" style={{ color: theme.status.warning }}>
                    <Star className="ratings-card-meta-icon" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {rating > 0 && author && <span className="ratings-card-dot">&bull;</span>}
                {author && <span className="ratings-card-genres">{author}</span>}
              </div>
              {statusText && (
                <div className="ratings-card-progress">
                  <span
                    className="ratings-card-progress-text"
                    style={{
                      color: done
                        ? theme.status.success
                        : ring > 0
                          ? theme.primary
                          : theme.text.muted,
                    }}
                  >
                    {statusText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
RatingBookCard.displayName = 'RatingBookCard';

/** Bücher im Bewertungs-Look; das Cover kommt mit Fallback-Kette aus BookCover. */
export const RatingBooksGrid = React.memo<{ books: Book[]; theme: Theme }>(({ books, theme }) => {
  const navigate = useNavigate();
  const open = useCallback((id: string) => navigate(bookPath(id)), [navigate]);
  return (
    <div className="ratings-grid">
      {books.map((book) => (
        <RatingBookCard key={book.id} book={book} theme={theme} onOpen={open} />
      ))}
      <div className="ratings-spacer" />
    </div>
  );
});
RatingBooksGrid.displayName = 'RatingBooksGrid';
