import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Book } from '../../../types/Book';
import { BookCover } from '../components/BookCover';
import { bookPath } from '../helpers';

interface Props {
  books: Book[];
  title: string;
  icon: React.ReactNode;
  iconColor?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  subtitle?: (book: Book) => string | undefined;
}

export const BookCarouselSection: React.FC<Props> = ({
  books,
  title,
  icon,
  iconColor,
  onSeeAll,
  seeAllLabel,
  subtitle,
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  if (books.length === 0) return null;

  return (
    <section className="bk-section">
      <SectionHeader
        icon={icon}
        iconColor={iconColor}
        title={title}
        onSeeAll={onSeeAll}
        seeAllLabel={seeAllLabel}
      />
      <div className="bk-carousel">
        {books.map((book) => (
          <button
            key={book.id}
            type="button"
            className="bk-carousel-item"
            onClick={() => navigate(bookPath(book.id))}
          >
            <BookCover book={book} />
            <span className="bk-item-title" style={{ color: currentTheme.text.secondary }}>
              {book.title}
            </span>
            <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
              {subtitle?.(book) ?? book.authors?.[0] ?? ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
