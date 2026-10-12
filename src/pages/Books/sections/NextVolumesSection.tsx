import { LibraryAddCheck } from '@mui/icons-material';
import React, { useMemo } from 'react';
import { SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { dateLocale, t } from '../../../services/i18n';
import { BookCover } from '../components/BookCover';
import { useOpenByTitle, useOpenResult } from '../discover/DiscoverParts';
import type { SeriesProgress } from '../hooks/useNextVolumes';
import { useSeriesPartBooks } from '../hooks/useSeriesPartBooks';

export const NextVolumesSection: React.FC<{ items: SeriesProgress[] }> = ({ items }) => {
  const { currentTheme } = useTheme();
  const { open } = useOpenByTitle();
  const openResult = useOpenResult();
  const lookups = useMemo(
    () => items.map((item) => ({ part: item.next.part, author: item.author })),
    [items]
  );
  const found = useSeriesPartBooks(lookups);
  if (items.length === 0) return null;

  return (
    <section className="bk-section">
      <SectionHeader
        icon={<LibraryAddCheck />}
        iconColor={currentTheme.accent}
        title={t('Nächster Band')}
      />
      <div className="bk-carousel" style={{ gap: 12 }}>
        {items.map((item) => {
          const { part, state, daysUntil } = item.next;
          const match = found[part.wikidataId];
          const stateText =
            state === 'upcoming' && daysUntil
              ? daysUntil === 1
                ? t('Erscheint morgen')
                : t('Erscheint in {n} Tagen', { n: daysUntil })
              : state === 'available'
                ? t('Schon erschienen')
                : t('Termin offen');
          const stateColor =
            state === 'upcoming'
              ? currentTheme.status.warning
              : state === 'available'
                ? currentTheme.status.success
                : currentTheme.text.muted;
          const dateText =
            state === 'upcoming' && part.publishedDate
              ? new Date(`${part.publishedDate}T12:00:00`).toLocaleDateString(dateLocale(), {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : null;
          return (
            <button
              key={item.seriesId}
              type="button"
              className="bk-source-card"
              style={{ width: 280 }}
              onClick={() => (match ? openResult(match) : void open(part.title, item.author))}
            >
              <BookCover
                book={{
                  id: part.wikidataId,
                  title: part.title,
                  authors: item.author ? [item.author] : [],
                  cover: match?.cover,
                }}
                fallbackSrc={match?.coverFallback}
              />
              <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span className="bk-source-kicker" style={{ color: currentTheme.text.muted }}>
                  {item.seriesName
                    ? t('Band {n} · {series}', { n: part.position, series: item.seriesName })
                    : t('Band {n}', { n: part.position })}
                </span>
                <span
                  className="bk-item-title"
                  style={{ color: currentTheme.text.secondary, fontSize: 15 }}
                >
                  {part.title}
                </span>
                <span
                  className="bk-badge"
                  style={{ background: `${stateColor}22`, color: stateColor }}
                >
                  {stateText}
                </span>
                {dateText && (
                  <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
                    {dateText}
                  </span>
                )}
                <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
                  {t('{n} von {m} gelesen', { n: item.ownedCount, m: item.total })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
