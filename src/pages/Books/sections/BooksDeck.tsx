import { LocalLibrary, Search, UploadFile } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText, HeaderActions } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScaleSmall } from '../../../lib/motion';
import type { BookYearStats } from '../../../lib/books/bookStats';
import { t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import { BookCover } from '../components/BookCover';
import { ReadingSwitch } from '../../../components/reading/ReadingSwitch';

interface BooksDeckProps {
  books: Book[];
  yearStats: BookYearStats;
  photoURL?: string | null;
  displayName?: string | null;
  totalUnreadBadge: number;
  onNotificationsOpen: () => void;
  onShowReading: () => void;
  onSearch: () => void;
}

export const BooksDeck: React.FC<BooksDeckProps> = React.memo(
  ({
    books,
    yearStats,
    photoURL,
    displayName,
    totalUnreadBadge,
    onNotificationsOpen,
    onShowReading,
    onSearch,
  }) => {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();

    const reading = useMemo(() => books.filter((b) => b.status === 'reading'), [books]);
    const art = useMemo(
      () =>
        [...reading, ...books.filter((b) => b.status !== 'reading')]
          .filter((b) => b.cover)
          .slice(0, 2),
      [books, reading]
    );

    const pods = [
      { key: 'reading', value: reading.length, label: t('Am Lesen'), onClick: onShowReading },
      {
        key: 'year',
        value: yearStats.booksFinished,
        label: t('Gelesen'),
        onClick: () => navigate('/books/stats'),
      },
      {
        key: 'pages',
        value: yearStats.pagesRead.toLocaleString(),
        label: t('Seiten'),
        onClick: () => navigate('/books/stats'),
      },
      {
        key: 'shelf',
        value: books.length,
        label: t('Im Regal'),
        onClick: () => navigate('/books/shelf'),
      },
    ];

    return (
      <header className="bk-deck-wrap">
        <ReadingSwitch active="books" />
        <motion.div
          className="bk-deck liquid-glass"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          {art.length > 0 && (
            <div className="bk-deck-art" aria-hidden>
              {art.map((b) => (
                <BookCover key={b.id} book={b} />
              ))}
            </div>
          )}
          <div
            className="bk-deck-glow"
            aria-hidden
            style={{
              background: `radial-gradient(ellipse, ${currentTheme.primary}33, transparent 70%)`,
            }}
          />

          <div className="bk-deck-top">
            <div style={{ minWidth: 0, flex: 1 }}>
              <GradientText
                as="h1"
                from={currentTheme.primary}
                to={currentTheme.accent}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 1.2vw + 16px, 30px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.16,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  userSelect: 'none',
                }}
              >
                <LocalLibrary style={{ fontSize: '0.95em', color: currentTheme.primary }} />
                {t('Bücher')}
              </GradientText>
              <p className="bk-deck-sub" style={{ color: currentTheme.text.secondary }}>
                {books.length > 0
                  ? t('{n} Bücher · {m} dieses Jahr gelesen', {
                      n: books.length,
                      m: yearStats.booksFinished,
                    })
                  : t('Dein Bücherregal')}
              </p>
            </div>
            <div className="bk-deck-actions">
              <motion.button
                type="button"
                whileTap={tapScaleSmall}
                className="bk-icon-btn"
                onClick={() => navigate('/books/import')}
                aria-label={t('Bücher importieren')}
                title={t('Bücher importieren')}
                style={{ color: currentTheme.text.secondary }}
              >
                <UploadFile style={{ fontSize: 20 }} />
              </motion.button>
              <HeaderActions
                totalUnreadBadge={totalUnreadBadge}
                onNotificationsOpen={onNotificationsOpen}
                photoURL={photoURL}
                displayName={displayName ?? undefined}
              />
            </div>
          </div>

          <div className="bk-deck-row">
            <motion.button
              type="button"
              whileTap={tapScaleSmall}
              onClick={onSearch}
              aria-label={t('Bücher suchen')}
              className="bk-deck-search"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}14, transparent 45%), var(--glass-light)`,
                borderColor: `${currentTheme.primary}33`,
              }}
            >
              <Search style={{ fontSize: 20, color: currentTheme.primary, flexShrink: 0 }} />
              <span className="bk-deck-search-hint" style={{ color: currentTheme.text.muted }}>
                {t('Titel, Autor oder ISBN suchen...')}
              </span>
            </motion.button>
            {books.length > 0 &&
              pods.map((pod) => (
                <motion.button
                  key={pod.key}
                  type="button"
                  whileTap={tapScaleSmall}
                  onClick={pod.onClick}
                  className="bk-pod"
                  aria-label={`${pod.value} ${pod.label}`}
                >
                  <span className="bk-pod-value" style={{ color: currentTheme.text.secondary }}>
                    {pod.value}
                  </span>
                  <span className="bk-pod-label" style={{ color: currentTheme.text.muted }}>
                    {pod.label}
                  </span>
                </motion.button>
              ))}
          </div>
        </motion.div>
      </header>
    );
  }
);
BooksDeck.displayName = 'BooksDeck';
