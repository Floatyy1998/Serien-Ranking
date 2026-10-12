import React from 'react';
import { motion } from 'framer-motion';
import type { BookWrappedStats } from '../../../types/Wrapped';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { dateLocale, t } from '../../../services/i18n';

interface TopBooksSlideProps {
  books: BookWrappedStats;
}

const monthName = (month: number) =>
  new Date(2000, month, 1).toLocaleDateString(dateLocale(), { month: 'long' });

const GOLD = '#f5c97a';

export const TopBooksSlide: React.FC<TopBooksSlideProps> = ({ books }) => {
  const [top, ...rest] = books.topBooks;

  return (
    <div
      style={{
        minHeight: 'var(--vh, 100vh)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a120b 0%, #2e1d10 50%, #4a2c14 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
        color: 'white',
        textAlign: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 360,
          height: 360,
          background: 'radial-gradient(circle, rgba(245,201,122,0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: '1rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: 18,
          zIndex: 1,
        }}
      >
        {t('Dein Lesejahr')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 110 }}
        style={{ zIndex: 1, marginBottom: 24 }}
      >
        <div
          style={{
            fontSize: 'clamp(3rem, 14vw, 5.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #fde7b8 0%, #f5c97a 50%, #e39b4a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {books.pagesRead.toLocaleString(dateLocale())}
        </div>
        <div style={{ fontSize: '1.1rem', opacity: 0.85, marginTop: 6 }}>
          {books.booksFinished === 1
            ? t('Seiten gelesen, 1 Buch beendet')
            : t('Seiten gelesen, {n} Bücher beendet', { n: books.booksFinished })}
        </div>
      </motion.div>

      {top && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1, marginBottom: 22 }}
        >
          {top.cover && (
            <img
              src={coverAtSize(top.cover, 'L')}
              alt={top.title}
              referrerPolicy="no-referrer"
              style={{
                width: 110,
                borderRadius: '4px 10px 10px 4px',
                boxShadow: '0 18px 50px rgba(0,0,0,0.5), 0 0 34px rgba(245,201,122,0.3)',
              }}
            />
          )}
          <div style={{ textAlign: 'left', maxWidth: 220 }}>
            <div style={{ fontSize: '0.8rem', letterSpacing: '2px', opacity: 0.6 }}>
              {t('Dein Buch des Jahres')}
            </div>
            <div
              style={{
                fontSize: 'clamp(1.2rem, 5vw, 1.6rem)',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                lineHeight: 1.2,
                margin: '4px 0',
              }}
            >
              {top.title}
            </div>
            {top.author && <div style={{ color: GOLD, fontWeight: 700 }}>{top.author}</div>}
          </div>
        </motion.div>
      )}

      {rest.length > 0 && (
        <motion.ol
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: 'min(340px, 100%)',
            zIndex: 1,
          }}
        >
          {rest.map((entry, index) => (
            <li
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.07)',
                textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: 800, opacity: 0.6, width: 18 }}>{index + 2}</span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 600,
                }}
              >
                {entry.title}
              </span>
              {entry.pages ? (
                <span style={{ color: GOLD, fontWeight: 700, fontSize: '0.9rem' }}>
                  {t('{n} S.', { n: entry.pages })}
                </span>
              ) : null}
            </li>
          ))}
        </motion.ol>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.95 }}
        style={{ marginTop: 22, fontSize: '0.95rem', zIndex: 1, maxWidth: 360 }}
      >
        {books.mostReadMonthPages > 0
          ? t('Lesemonat: {month} mit {n} Seiten', {
              month: monthName(books.mostReadMonth),
              n: books.mostReadMonthPages.toLocaleString(dateLocale()),
            })
          : books.longestBook
            ? t('Dickstes Buch: {title} mit {n} Seiten', {
                title: books.longestBook.title,
                n: books.longestBook.pages,
              })
            : ''}
      </motion.p>
    </div>
  );
};
