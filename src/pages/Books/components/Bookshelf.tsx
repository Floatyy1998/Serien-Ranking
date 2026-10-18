import { ChevronRight, Star } from '@mui/icons-material';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spineStyle, spineTitleLayout, type SpineMeasure } from '../../../lib/books/bookSpine';
import { t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import { BookCover } from './BookCover';
import './books.css';

interface BookshelfProps {
  books: Book[];
  /** Platzhalter-Rücken, damit ein leeres Regal nicht wie ein Fehler aussieht. */
  ghostCount?: number;
  scale?: number;
  /** Ziel beim Antippen; Standard ist die Buch-Detailseite. */
  hrefFor?: (book: Book) => string;
}

let spineCanvas: CanvasRenderingContext2D | null | undefined;
const spineWidths = new Map<string, number>();

/** Misst Titel in der Rücken-Schrift (Georgia fett, 0.02em Sperrung) — auch mit Android-Ersatzschrift genau. */
function spineMeasure(): SpineMeasure | undefined {
  if (spineCanvas === undefined) {
    spineCanvas =
      typeof document === 'undefined' || /jsdom/i.test(navigator.userAgent)
        ? null
        : document.createElement('canvas').getContext('2d');
    if (spineCanvas) spineCanvas.font = "700 100px Georgia, 'Times New Roman', serif";
  }
  const ctx = spineCanvas;
  if (!ctx) return undefined;
  return (text) => {
    let width = spineWidths.get(text);
    if (width === undefined) {
      width = (ctx.measureText(text).width / 100 + text.length * 0.02) * 1.04;
      spineWidths.set(text, width);
    }
    return width;
  };
}

const canHover = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const BookSpine: React.FC<{
  book: Book;
  scale?: number;
  onOpen: (el: HTMLElement) => void;
  lifted?: boolean;
  onPeek?: (el: HTMLElement | null) => void;
}> = ({ book, scale = 1, onOpen, lifted = false, onPeek }) => {
  const style = spineStyle(book, scale);
  const title = spineTitleLayout(book.title, style, spineMeasure());
  return (
    <button
      type="button"
      className={`bk-spine${lifted ? ' bk-spine--lifted' : ''}`}
      onClick={(e) => onOpen(e.currentTarget)}
      onMouseEnter={onPeek ? (e) => canHover() && onPeek(e.currentTarget) : undefined}
      onMouseLeave={onPeek ? () => canHover() && onPeek(null) : undefined}
      title={onPeek ? undefined : book.title}
      aria-label={book.authors?.[0] ? `${book.title} · ${book.authors[0]}` : book.title}
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
        <span
          className={`bk-spine-title${title.lines === 2 ? ' bk-spine-title--wrap' : ''}`}
          style={{ fontSize: title.fontSize, maxHeight: title.maxHeight }}
        >
          {title.text}
        </span>
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

const PEEK_WIDTH = 220;
const PEEK_GAP = 8;

interface Peek {
  id: string;
  /** Per Tipp geöffnet (Handy) statt per Hover — dann ist die Karte selbst antippbar. */
  pinned: boolean;
  left: number;
  bottom: number;
}

export const Bookshelf: React.FC<BookshelfProps> = ({
  books,
  ghostCount = 0,
  scale = 1,
  hrefFor,
}) => {
  const navigate = useNavigate();
  const shelfRef = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const peekBook = peek ? books.find((b) => b.id === peek.id) : undefined;

  const open = (book: Book) =>
    navigate(hrefFor ? hrefFor(book) : `/books/${encodeURIComponent(book.id)}`);

  const place = (book: Book, el: HTMLElement, pinned: boolean) => {
    const shelf = shelfRef.current;
    if (!shelf) return;
    const right = el.offsetLeft + el.offsetWidth + PEEK_GAP;
    const left =
      right + PEEK_WIDTH <= shelf.clientWidth
        ? right
        : Math.max(0, el.offsetLeft - PEEK_GAP - PEEK_WIDTH);
    setPeek({
      id: book.id,
      pinned,
      left,
      bottom: shelf.clientHeight - (el.offsetTop + el.offsetHeight) + 6,
    });
  };

  useEffect(() => {
    if (!peek?.pinned) return;
    const close = (e: PointerEvent) => {
      if (!shelfRef.current?.contains(e.target as Node)) setPeek(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [peek?.pinned]);

  return (
    <div ref={shelfRef} className={`bk-shelf${books.length === 0 ? ' bk-shelf--empty' : ''}`}>
      {books.map((book) => (
        <BookSpine
          key={book.id}
          book={book}
          scale={scale}
          lifted={peek?.id === book.id}
          onPeek={(el) => (el ? place(book, el, false) : setPeek((p) => (p?.pinned ? p : null)))}
          onOpen={(el) => {
            if (canHover() || (peek?.pinned && peek.id === book.id)) return open(book);
            place(book, el, true);
          }}
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
      {peek && peekBook && (
        <button
          type="button"
          className={`bk-shelf-peek${peek.pinned ? ' bk-shelf-peek--pinned' : ''}`}
          style={{ left: peek.left, bottom: peek.bottom, width: PEEK_WIDTH }}
          onClick={() => open(peekBook)}
          tabIndex={peek.pinned ? 0 : -1}
          aria-hidden={!peek.pinned}
        >
          <BookCover book={peekBook} width={52} />
          <span className="bk-shelf-peek-text">
            <span className="bk-shelf-peek-title">{peekBook.title}</span>
            {peekBook.authors?.[0] && (
              <span className="bk-shelf-peek-author">{peekBook.authors[0]}</span>
            )}
          </span>
          {peek.pinned && <ChevronRight className="bk-shelf-peek-go" />}
        </button>
      )}
    </div>
  );
};
