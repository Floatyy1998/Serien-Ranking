import { ChevronRight, LocalLibrary, MenuBook } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../../components/ui';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import '../ReadingPage.css';

interface LibrarySectionProps {
  showBooks: boolean;
  showManga: boolean;
}

/** Deine Bibliothek: ganzes Bücherregal und komplette Manga-Sammlung, je eine eigene Seite. */
export const LibrarySection = ({ showBooks, showManga }: LibrarySectionProps) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();

  const cards = [
    ...(showBooks
      ? [
          {
            key: 'books',
            icon: <LocalLibrary />,
            title: t('Bücher'),
            count: bookList.length,
            hint: t('Ganzes Regal mit Filtern'),
            to: '/books/shelf',
          },
        ]
      : []),
    ...(showManga
      ? [
          {
            key: 'manga',
            icon: <MenuBook />,
            title: 'Manga',
            count: mangaList.length,
            hint: t('Komplette Sammlung mit Suche'),
            to: '/manga/collection',
          },
        ]
      : []),
  ].filter((card) => card.count > 0);

  if (cards.length === 0) return null;

  return (
    <section className="bk-section">
      <SectionHeader
        icon={<LocalLibrary />}
        iconColor={currentTheme.primary}
        title={t('Deine Bibliothek')}
      />
      <div className="bk-pad">
        <div className="rd-library">
          {cards.map((card) => (
            <button
              key={card.key}
              type="button"
              className="rd-library-card"
              onClick={() => navigate(card.to)}
              style={{ color: currentTheme.text.secondary }}
            >
              <span className="rd-library-head">
                <span style={{ color: currentTheme.primary, display: 'flex' }}>{card.icon}</span>
                {card.title}
                <ChevronRight
                  className="rd-library-chevron"
                  style={{ fontSize: 20, color: currentTheme.text.muted }}
                />
              </span>
              <span className="rd-library-count" style={{ color: currentTheme.text.primary }}>
                {card.count}
              </span>
              <span className="rd-library-hint" style={{ color: currentTheme.text.muted }}>
                {card.hint}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
