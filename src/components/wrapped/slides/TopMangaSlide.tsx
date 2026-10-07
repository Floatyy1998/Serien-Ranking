import React from 'react';
import { motion } from 'framer-motion';
import type { MangaWrappedStats } from '../../../types/Wrapped';
import { dateLocale, t } from '../../../services/i18n';

interface TopMangaSlideProps {
  manga: MangaWrappedStats;
}

const monthName = (month: number) =>
  new Date(2000, month, 1).toLocaleDateString(dateLocale(), { month: 'long' });

export const TopMangaSlide: React.FC<TopMangaSlideProps> = ({ manga }) => {
  const [top, ...rest] = manga.topManga;

  return (
    <div
      style={{
        minHeight: 'var(--vh, 100vh)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1b1030 0%, #2d1449 50%, #4a1d5e 100%)',
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
          background: 'radial-gradient(circle, rgba(232,121,249,0.35) 0%, transparent 70%)',
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
        {t('Deine Top Manga')}
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
            background: 'linear-gradient(135deg, #f0abfc 0%, #e879f9 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {manga.totalChapters.toLocaleString()}
        </div>
        <div style={{ fontSize: '1.1rem', opacity: 0.85, marginTop: 6 }}>
          {t('Kapitel aus {n} Manga gelesen', { n: manga.uniqueManga })}
        </div>
      </motion.div>

      {top && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1, marginBottom: 22 }}
        >
          {top.poster && (
            <img
              src={top.poster}
              alt={top.title}
              style={{
                width: 110,
                borderRadius: 12,
                boxShadow: '0 18px 50px rgba(0,0,0,0.5), 0 0 34px rgba(232,121,249,0.35)',
              }}
            />
          )}
          <div style={{ textAlign: 'left', maxWidth: 220 }}>
            <div style={{ fontSize: '0.8rem', letterSpacing: '2px', opacity: 0.6 }}>
              {t('Am meisten gelesen')}
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
            <div style={{ color: '#f0abfc', fontWeight: 700 }}>
              {t('{n} Kapitel', { n: top.chapters })}
            </div>
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
              key={entry.anilistId}
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
              <span style={{ color: '#f0abfc', fontWeight: 700, fontSize: '0.9rem' }}>
                {entry.chapters}
              </span>
            </li>
          ))}
        </motion.ol>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.95 }}
        style={{ marginTop: 22, fontSize: '0.95rem', zIndex: 1 }}
      >
        {t('Lesemonat: {month} mit {n} Kapiteln', {
          month: monthName(manga.mostReadMonth),
          n: manga.mostReadMonthChapters,
        })}
      </motion.p>
    </div>
  );
};

export default TopMangaSlide;
