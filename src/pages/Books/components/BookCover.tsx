import React, { useState } from 'react';
import { coverAtSize, directCoverAtSize } from '../../../lib/books/bookSearchMapping';
import { generatedCoverColors } from '../../../lib/books/bookSpine';
import './books.css';
import { pauseOffscreen } from './pauseOffscreen';

interface BookCoverProps {
  book: { id: string; title: string; authors?: string[]; cover?: string };
  fallbackSrc?: string;
  width?: number | string;
  /** Buchkörper mit Seitenschnitt und Rückenschatten. */
  depth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
  /** Open-Library-Größe; Standard M, mit depth L. */
  size?: 'M' | 'L';
}

/** Cover mit Fallback-Kette; ohne Bild ein gesetztes Titel-Cover in Leinenfarbe. */
export const BookCover: React.FC<BookCoverProps> = React.memo(
  ({ book, fallbackSrc, width, depth = false, className, style, eager, size }) => {
    const px = size ?? (depth ? 'L' : 'M');
    const sources = [
      ...new Set([
        coverAtSize(book.cover, px),
        directCoverAtSize(book.cover, px),
        coverAtSize(fallbackSrc, px),
      ]),
    ].filter((s): s is string => !!s);
    const [failed, setFailed] = useState<string[]>([]);
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const src = sources.find((s) => !failed.includes(s));
    const loaded = !!src && loadedSrc === src;
    const fail = (url: string) => setFailed((prev) => [...prev, url]);
    const colors = generatedCoverColors(book);
    const author = book.authors?.[0];

    return (
      <div
        className={`bk-cover${depth ? ' bk-cover--depth' : ''}${className ? ` ${className}` : ''}`}
        style={{ width, ...style }}
      >
        <div
          ref={pauseOffscreen}
          className={`bk-cover-face${src && !loaded ? ' bk-cover-face--loading' : ''}`}
        >
          {src ? (
            <img
              key={src}
              src={src}
              alt=""
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => fail(src)}
              onLoad={(e) => (e.currentTarget.naturalWidth < 20 ? fail(src) : setLoadedSrc(src))}
            />
          ) : (
            <div
              className="bk-cover-generated"
              style={{
                background: `linear-gradient(160deg, ${colors.bg}, ${colors.bg}dd 60%, #00000055)`,
              }}
            >
              <span className="bk-cover-gen-band" style={{ background: colors.band }} />
              <span className="bk-cover-gen-title" style={{ color: colors.fg }}>
                {book.title}
              </span>
              {author && (
                <span className="bk-cover-gen-author" style={{ color: colors.fg }}>
                  {author}
                </span>
              )}
              <span
                className="bk-cover-gen-band bk-cover-gen-band--bottom"
                style={{ background: colors.band }}
              />
            </div>
          )}
          <span className="bk-cover-sheen" aria-hidden />
        </div>
      </div>
    );
  }
);
BookCover.displayName = 'BookCover';
