import { AutoStories, Favorite, MenuBook } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import type { SharedItem, TasteMatchResult } from '../../../services/social/tasteMatchService';
import { ACCENT_COLORS } from '../constants';
import { SharedItemCard } from '../parts/SharedItemCard';
import { t } from '../../../services/i18n';

interface ReadingTabProps {
  result: TasteMatchResult;
  cardBg: string;
}

const ReadingSection: React.FC<{
  items: SharedItem[];
  type: 'manga' | 'book';
  label: string;
  cardBg: string;
}> = ({ items, type, label, cardBg }) => {
  const perfectMatches = items.filter((i) => i.ratingDiff !== undefined && i.ratingDiff < 1);
  const Icon = type === 'manga' ? AutoStories : MenuBook;

  return (
    <div className="tm-reading-section">
      <div
        className="tm-section-header"
        style={{ background: cardBg, border: `1px solid ${ACCENT_COLORS.reading}20` }}
      >
        <Icon style={{ fontSize: 20, color: ACCENT_COLORS.reading }} />
        <span className="tm-section-header__text">{label}</span>
        {perfectMatches.length > 0 && (
          <span
            className="tm-section-header__badge"
            style={{ color: ACCENT_COLORS.match, background: `${ACCENT_COLORS.match}15` }}
          >
            <Favorite style={{ fontSize: 12 }} />
            {t('{n} perfekte Matches', { n: perfectMatches.length })}
          </span>
        )}
      </div>
      <div className="tm-shared-list">
        {items.map((item, i) => (
          <SharedItemCard key={item.id} item={item} index={i} type={type} bgColor={cardBg} />
        ))}
      </div>
    </div>
  );
};

export const ReadingTab: React.FC<ReadingTabProps> = React.memo(({ result, cardBg }) => {
  const manga = result.mangaOverlap.shared;
  const books = result.bookOverlap.shared;

  return (
    <motion.div
      key="reading"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {manga.length > 0 && (
        <ReadingSection
          items={manga}
          type="manga"
          label={t('{n} gemeinsame Manga', { n: manga.length })}
          cardBg={cardBg}
        />
      )}
      {books.length > 0 && (
        <ReadingSection
          items={books}
          type="book"
          label={t('{n} gemeinsame Bücher', { n: books.length })}
          cardBg={cardBg}
        />
      )}
      {manga.length === 0 && books.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="tm-empty-state"
          style={{ background: cardBg }}
        >
          <div
            className="tm-empty-state__icon"
            style={{ background: `${ACCENT_COLORS.reading}15` }}
          >
            <MenuBook style={{ fontSize: 36, color: ACCENT_COLORS.reading, opacity: 0.6 }} />
          </div>
          <p className="tm-empty-state__title">{t('Keine gemeinsamen Manga oder Bücher')}</p>
          <p className="tm-empty-state__subtitle">{t('Lest ihr verschiedene Sachen?')}</p>
        </motion.div>
      )}
    </motion.div>
  );
});

ReadingTab.displayName = 'ReadingTab';
