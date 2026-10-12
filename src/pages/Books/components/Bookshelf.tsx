import { Star } from '@mui/icons-material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { spineStyle } from '../../../lib/books/bookSpine';
import { t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import './books.css';

interface BookshelfProps {
  books: Book[];
  /** Platzhalter-Rücken, damit ein leeres Regal nicht wie ein Fehler aussieht. */
  ghostCount?: number;
  scale?: number;
  /** Ziel beim Antippen; Standard ist die Buch-Detailseite. */
  hrefFor?: (book: Book) => string;
}

export const BookSpine: React.FC<{ book: Book; scale?: number; onOpen: () => void }> = ({
  book,
  scale = 1,
  onOpen,
}) => {
  const style = spineStyle(book, scale);
  return (
    <button
      type="button"
      className="bk-spine"
      onClick={onOpen}
      title={book.authors?.[0] ? `${book.title} · ${book.authors[0]}` : book.title}
      aria-label={book.title}
    >
      <span
        className="bk-spine-body"
        style={{
          width: style.width,
          height: style.height,
          background: style.bg,
          color: style.fg,
          transform: style.tilt ? `rotate(${style.tilt}deg)` : undefined,
          transformOrigin: 'bottom right',
        }}
      >
        {style.bands > 0 && (
          <span className="bk-spine-band" style={{ top: 12, background: style.band }} />
        )}
        {style.bands > 1 && (
          <span className="bk-spine-band" style={{ top: 18, background: style.band }} />
        )}
        <span className="bk-spine-title">{book.title}</span>
        {style.bands > 0 && (
          <span className="bk-spine-band" style={{ bottom: 22, background: style.band }} />
        )}
        {book.rating && book.rating >= 9 ? (
          <span
            className="bk-spine-mark"
            style={{ color: style.band }}
            aria-label={t('Lieblingsbuch')}
          >
            <Star style={{ fontSize: 11 }} />
          </span>
        ) : null}
      </span>
    </button>
  );
};

export const Bookshelf: React.FC<BookshelfProps> = ({
  books,
  ghostCount = 0,
  scale = 1,
  hrefFor,
}) => {
  const navigate = useNavigate();
  return (
    <div className={`bk-shelf${books.length === 0 ? ' bk-shelf--empty' : ''}`}>
      {books.map((book) => (
        <BookSpine
          key={book.id}
          book={book}
          scale={scale}
          onOpen={() => navigate(hrefFor ? hrefFor(book) : `/books/${encodeURIComponent(book.id)}`)}
        />
      ))}
      {Array.from({ length: books.length === 0 ? ghostCount : 0 }, (_, i) => (
        <span key={`ghost-${i}`} className="bk-spine" aria-hidden style={{ cursor: 'default' }}>
          <span
            className="bk-spine-body"
            style={{
              width: 22 + ((i * 7) % 12),
              height: 120 + ((i * 13) % 30),
              background: 'rgba(255,255,255,0.05)',
              boxShadow: 'none',
            }}
          />
        </span>
      ))}
    </div>
  );
};
