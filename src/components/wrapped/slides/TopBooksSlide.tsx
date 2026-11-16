import React from 'react';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { dateLocale, t } from '../../../services/i18n';
import type { BookWrappedStats, TopBookEntry } from '../../../types/Wrapped';
import { TopList, type SlideProps } from '../kit';
import { fmt } from '../kitHelpers';

const monthName = (month: number) =>
  new Date(2000, month, 1).toLocaleDateString(dateLocale(), { month: 'long' });

const amount = (book: TopBookEntry): string =>
  [book.author, book.pages ? t('{n} Seiten', { n: book.pages }) : ''].filter(Boolean).join(', ');

export const TopBooksSlide: React.FC<{ books: BookWrappedStats } & SlideProps> = ({
  books,
  active,
}) => {
  const [top, ...rest] = books.topBooks.slice(0, 5);
  if (!top) return null;
  const total = `${fmt(books.pagesRead)} ${
    books.booksFinished === 1
      ? t('Seiten gelesen, 1 Buch beendet')
      : t('Seiten gelesen, {n} Bücher beendet', { n: books.booksFinished })
  }`;
  const extra = books.longestBook
    ? t('Dickstes Buch: {title} mit {n} Seiten', {
        title: books.longestBook.title,
        n: books.longestBook.pages,
      })
    : t('Lesemonat: {month} mit {n} Seiten', {
        month: monthName(books.mostReadMonth),
        n: books.mostReadMonthPages,
      });
  return (
    <TopList
      active={active}
      kicker={t('Dein Buch des Jahres')}
      hero={{
        key: top.id,
        title: top.title,
        heroImage: top.cover ? coverAtSize(top.cover, 'L') : undefined,
        value: amount(top),
      }}
      rest={rest.map((b) => ({
        key: b.id,
        title: b.title,
        image: b.cover ? coverAtSize(b.cover, 'M') : undefined,
        value: b.pages ? t('{n} Seiten', { n: b.pages }) : '',
      }))}
      note={`${total}. ${extra}`}
    />
  );
};

export default TopBooksSlide;
