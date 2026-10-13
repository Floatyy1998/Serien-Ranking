import { AutoStories, Edit } from '@mui/icons-material';
import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { progressPercent, remainingHours } from '../../../lib/books/bookProgress';
import { t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import { BookCover } from '../components/BookCover';
import { bookPath, formatHours } from '../helpers';
import { getOptimalTextColor } from '../../../theme/colorUtils';

interface Props {
  books: Book[];
  onQuickAdd: (book: Book, pages: number) => void;
  onOpenProgress: (book: Book) => void;
  title?: string;
}

export const CurrentlyReadingSection = forwardRef<HTMLElement, Props>(
  ({ books, onQuickAdd, onOpenProgress, title }, ref) => {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();
    if (books.length === 0) return null;

    return (
      <section ref={ref} className="bk-section">
        <SectionHeader
          icon={<AutoStories />}
          iconColor={currentTheme.primary}
          title={title ?? t('Weiterlesen')}
        />
        <HorizontalScrollContainer scrollerClassName="bk-reading-row">
          {books.map((book) => {
            const percent = progressPercent(book);
            const hours = remainingHours(book);
            const open = () => navigate(bookPath(book.id));
            return (
              <article key={book.id} className="bk-reading-card">
                {book.cover && (
                  <div
                    className="bk-reading-card-bg"
                    style={{ backgroundImage: `url(${coverAtSize(book.cover, 'M')})` }}
                  />
                )}
                <div className="bk-reading-cover" onClick={open}>
                  <BookCover book={book} depth size="M" />
                </div>
                <div className="bk-reading-body">
                  <h3
                    className="bk-reading-title"
                    style={{ color: currentTheme.text.secondary }}
                    onClick={open}
                  >
                    {book.title}
                  </h3>
                  <span className="bk-reading-author" style={{ color: currentTheme.text.muted }}>
                    {book.authors?.join(', ')}
                  </span>
                  <div className="bk-progress" style={{ marginTop: 6 }}>
                    <div
                      className="bk-progress-fill"
                      style={{
                        width: `${Math.max(percent, 2)}%`,
                        background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                      }}
                    />
                  </div>
                  <div className="bk-progress-meta" style={{ color: currentTheme.text.muted }}>
                    <span>
                      {book.pageCount
                        ? t('S. {page} / {total}', {
                            page: book.currentPage || 0,
                            total: book.pageCount,
                          })
                        : t('S. {page}', { page: book.currentPage || 0 })}
                    </span>
                    <span>{hours !== null && hours > 0 ? formatHours(hours) : `${percent} %`}</span>
                  </div>
                  <div className="bk-quick-row">
                    {[10, 25].map((step) => (
                      <button
                        key={step}
                        type="button"
                        className="bk-chip-btn"
                        style={{ color: currentTheme.text.secondary }}
                        onClick={() => onQuickAdd(book, step)}
                        aria-label={t('{n} Seiten weiter', { n: step })}
                      >
                        +{step}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="bk-chip-btn bk-chip-btn--primary"
                      onClick={() => onOpenProgress(book)}
                      style={{
                        background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                        color: getOptimalTextColor(currentTheme.primary),
                      }}
                    >
                      <Edit style={{ fontSize: 15 }} />
                      {t('Seite')}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </HorizontalScrollContainer>
      </section>
    );
  }
);
CurrentlyReadingSection.displayName = 'CurrentlyReadingSection';
