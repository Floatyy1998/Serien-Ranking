// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookCover } from './BookCover';

const book = {
  id: 'ol-OL1W',
  title: 'Fourth Wing',
  authors: ['Rebecca Yarros'],
  cover: 'https://covers.openlibrary.org/b/id/42-L.jpg',
};

const loadWithWidth = (img: HTMLImageElement, width: number) => {
  Object.defineProperty(img, 'naturalWidth', { value: width, configurable: true });
  fireEvent.load(img);
};

describe('BookCover', () => {
  it('zeigt ein geladenes Cover und bleibt nicht im Ladezustand hängen', () => {
    const { container, rerender } = render(<BookCover book={book} />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.src).toMatch(/\/bookcover\/id\/42-M\.jpg$/);
    loadWithWidth(img, 180);
    rerender(<BookCover book={{ ...book }} />);
    expect(container.querySelector('.bk-cover-face--loading')).toBeNull();
  });

  it('bleibt sichtbar, wenn nach dem Hinzufügen die Ersatzquelle wegfällt', () => {
    const fallback = 'https://covers.openlibrary.org/b/isbn/9783423262644-L.jpg?default=false';
    const { container, rerender } = render(<BookCover book={book} fallbackSrc={fallback} />);
    const img = container.querySelector('img') as HTMLImageElement;
    loadWithWidth(img, 180);
    rerender(<BookCover book={{ ...book, id: 'gb-x' }} />);
    expect(container.querySelector('img')).toBe(img);
    expect(container.querySelector('.bk-cover-face--loading')).toBeNull();
  });

  it('fällt vom Spiegel auf Open Library, dann auf die ISBN und zuletzt aufs gesetzte Cover', () => {
    const fallback = 'https://covers.openlibrary.org/b/isbn/9783423262644-L.jpg?default=false';
    const { container } = render(<BookCover book={book} fallbackSrc={fallback} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    const direct = container.querySelector('img') as HTMLImageElement;
    expect(direct.src).toBe('https://covers.openlibrary.org/b/id/42-M.jpg');
    fireEvent.error(direct);
    const next = container.querySelector('img') as HTMLImageElement;
    expect(next.src).toContain('/b/isbn/9783423262644-M.jpg');
    loadWithWidth(next, 1);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.bk-cover-generated')?.textContent).toContain('Fourth Wing');
  });
});
