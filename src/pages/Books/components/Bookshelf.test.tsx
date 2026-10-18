// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { spineTitleLayout } from '../../../lib/books/bookSpine';
import type { Book } from '../../../types/Book';
import { Bookshelf } from './Bookshelf';

afterEach(cleanup);

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@mui/icons-material', () => ({ ChevronRight: () => null, Star: () => null }));

const books = [
  { id: 'b1', title: 'Das Erbe der Elfen', authors: ['Andrzej Sapkowski'] },
  { id: 'b2', title: '1984', authors: ['George Orwell'] },
] as Book[];

describe('Bookshelf', () => {
  it('setzt lange Titel kleiner und auf breiten Rücken zweizeilig', () => {
    const spine = { width: 24, height: 150, bands: 0 as const };
    expect(spineTitleLayout('1984', spine)).toEqual({ fontSize: 11, lines: 1, maxHeight: 124 });
    expect(spineTitleLayout('Das Erbe der Elfen', spine).fontSize).toBeLessThan(11);
    expect(
      spineTitleLayout('Das Schwert der Vorsehung', { ...spine, width: 20, bands: 1 })
    ).toMatchObject({ fontSize: 8, lines: 1 });
    expect(spineTitleLayout('Das Schwert der Vorsehung', { ...spine, width: 40 }).lines).toBe(2);
  });

  it('zeigt am Handy erst eine Vorschau und öffnet beim zweiten Tipp', () => {
    navigate.mockClear();
    render(<Bookshelf books={books} />);
    const spine = screen.getByRole('button', { name: 'Das Erbe der Elfen · Andrzej Sapkowski' });

    fireEvent.click(spine);
    expect(navigate).not.toHaveBeenCalled();
    expect(document.querySelector('.bk-shelf-peek-title')?.textContent).toBe('Das Erbe der Elfen');
    expect(document.querySelector('.bk-shelf-peek-author')?.textContent).toBe('Andrzej Sapkowski');

    fireEvent.click(spine);
    expect(navigate).toHaveBeenCalledWith('/books/b1');
  });

  it('öffnet über die Vorschaukarte und schließt sie beim Tipp daneben', () => {
    navigate.mockClear();
    render(<Bookshelf books={books} />);
    fireEvent.click(screen.getByRole('button', { name: '1984 · George Orwell' }));
    fireEvent.click(document.querySelector('.bk-shelf-peek') as HTMLElement);
    expect(navigate).toHaveBeenCalledWith('/books/b2');

    fireEvent.click(screen.getByRole('button', { name: 'Das Erbe der Elfen · Andrzej Sapkowski' }));
    fireEvent.pointerDown(document.body);
    expect(document.querySelector('.bk-shelf-peek')).toBeNull();
  });
});
