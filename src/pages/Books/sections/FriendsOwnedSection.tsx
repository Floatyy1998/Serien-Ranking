import { PeopleAlt } from '@mui/icons-material';
import React, { useMemo } from 'react';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { bookMatchKey, createBookIndex } from '../../../lib/books/bookIdentity';
import { bookAsResult } from '../../../lib/books/bookSearchMapping';
import { t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import { BookCover } from '../components/BookCover';
import { useOpenResult } from '../discover/DiscoverParts';
import { useFriendsOwnedBooks } from '../hooks/useFriendsOwnedBooks';

/** Bücher, die Freunde besitzen und du noch nicht — zum Ausleihen anfragen. */
export const FriendsOwnedSection: React.FC<{ ownBooks: Book[] }> = ({ ownBooks }) => {
  const { currentTheme } = useTheme();
  const openResult = useOpenResult();
  const all = useFriendsOwnedBooks();

  const groups = useMemo(() => {
    const mine = createBookIndex(ownBooks);
    const byKey = new Map<string, { book: Book; owners: string[] }>();
    for (const { book, friendName } of all) {
      const key = bookMatchKey(book.title, book.authors);
      if (mine.has(book)) continue;
      const hit = byKey.get(key);
      if (hit) hit.owners.push(friendName);
      else byKey.set(key, { book, owners: [friendName] });
    }
    return [...byKey.values()].slice(0, 20);
  }, [all, ownBooks]);

  if (groups.length === 0) return null;

  return (
    <section className="bk-section">
      <SectionHeader
        icon={<PeopleAlt />}
        iconColor={currentTheme.status.success}
        title={t('Bei Freunden im Besitz')}
      />
      <HorizontalScrollContainer scrollerClassName="bk-carousel">
        {groups.map(({ book, owners }) => (
          <button
            key={book.id}
            type="button"
            className="bk-carousel-item"
            onClick={() => openResult(bookAsResult(book))}
          >
            <BookCover book={book} />
            <span className="bk-item-title" style={{ color: currentTheme.text.secondary }}>
              {book.title}
            </span>
            <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
              {owners.length > 1
                ? t('{name} +{n}', { name: owners[0], n: owners.length - 1 })
                : owners[0]}
            </span>
          </button>
        ))}
      </HorizontalScrollContainer>
    </section>
  );
};
