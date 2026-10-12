import { ChevronRight, LocalLibrary } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookEvents } from '../../../hooks/books/useBookEvents';
import { computeBookYearStats } from '../../../lib/books/bookStats';
import { tapScaleSmall } from '../../../lib/motion';
import { dateLocale, t } from '../../../services/i18n';

/** Brücke von der Schau-Statistik zur Lese-Statistik; nur sichtbar, wenn jemand Bücher trackt. */
export const ReadingStatsBanner = memo(() => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { bookList } = useBooksList();
  const [now] = useState(() => Date.now());
  const year = new Date(now).getFullYear();
  const { events } = useBookEvents(bookList.length ? [year] : []);
  const stats = useMemo(
    () => computeBookYearStats(bookList, events, year, now),
    [bookList, events, year, now]
  );
  if (bookList.length === 0) return null;

  return (
    <motion.button
      type="button"
      className="stats-actor-banner liquid-glass"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      whileTap={tapScaleSmall}
      onClick={() => navigate('/books/stats')}
      aria-label={t('Lese-Statistik öffnen')}
    >
      <div className="stats-actor-content">
        <div
          className="stats-actor-icon-wrap"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.primary}cc 100%)`,
            boxShadow: `0 0 30px ${currentTheme.accent}50`,
          }}
        >
          <LocalLibrary style={{ color: currentTheme.text.secondary, fontSize: '28px' }} />
        </div>
        <div className="stats-actor-text">
          <h2 className="stats-actor-title" style={{ color: currentTheme.text.primary }}>
            {t('Dein Lesejahr')}
          </h2>
          <p className="stats-actor-subtitle" style={{ color: currentTheme.text.secondary }}>
            {t('{n} Bücher · {pages} Seiten {year}', {
              n: stats.booksFinished,
              pages: stats.pagesRead.toLocaleString(dateLocale()),
              year,
            })}
          </p>
        </div>
        <ChevronRight style={{ color: currentTheme.text.muted }} />
      </div>
    </motion.button>
  );
});
ReadingStatsBanner.displayName = 'ReadingStatsBanner';
