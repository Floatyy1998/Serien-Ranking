import { motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { progressPercent } from '../../lib/books/bookProgress';
import { coverAtSize } from '../../lib/books/bookSearchMapping';
import { mangaTotalChapters } from '../../lib/manga/overview';
import { t } from '../../services/i18n';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { formatRelativeDay } from '../Manga/mangaUtils';

interface Props {
  friendName: string;
  manga: Manga[];
  ownIds: Set<number>;
  books?: Book[];
  ownsBook?: (book: Book) => boolean;
}

interface ReadingEntry {
  key: string;
  title: string;
  poster?: string;
  progressText: string;
  progress: number;
  lastAt?: string;
  href: string;
  shared: boolean;
}

/** Was der Freund gerade liest — Manga und Bücher, zuletzt gelesene zuerst. */
export const FriendReadingSection = memo(function FriendReadingSection({
  friendName,
  manga,
  ownIds,
  books = [],
  ownsBook,
}: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  const reading = useMemo(() => {
    const entries: ReadingEntry[] = [];
    for (const m of manga) {
      if (m.readStatus !== 'reading' || (m.currentChapter || 0) <= 0) continue;
      const total = mangaTotalChapters(m);
      entries.push({
        key: `m-${m.anilistId}`,
        title: m.title,
        poster: m.poster,
        progressText:
          total > 0
            ? t('Kap. {a} / {b}', { a: m.currentChapter, b: total })
            : t('Kap. {n}', { n: m.currentChapter }),
        progress: total > 0 ? Math.min(100, (m.currentChapter / total) * 100) : 0,
        lastAt: m.lastReadAt || m.addedAt,
        href: `/manga/${m.anilistId}`,
        shared: ownIds.has(m.anilistId),
      });
    }
    for (const b of books) {
      if (b.status !== 'reading') continue;
      const shared = ownsBook?.(b) ?? false;
      entries.push({
        key: `b-${b.id}`,
        title: b.title,
        poster: coverAtSize(b.cover, 'M'),
        progressText: b.pageCount
          ? t('S. {page} / {total}', { page: b.currentPage, total: b.pageCount })
          : t('S. {page}', { page: b.currentPage }),
        progress: progressPercent(b),
        lastAt: b.lastReadAt || b.startedAt || b.addedAt,
        href: shared
          ? `/books/${encodeURIComponent(b.id)}`
          : `/books/search?q=${encodeURIComponent([b.title, b.authors?.[0]].filter(Boolean).join(' '))}`,
        shared,
      });
    }
    return entries
      .sort((a, b) => new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime())
      .slice(0, 5);
  }, [manga, ownIds, books, ownsBook]);

  if (reading.length === 0) return null;

  return (
    <div className="fp-anticipation">
      <div className="fp-anticipation-header" style={{ color: currentTheme.text.primary }}>
        {t('Was {name} gerade liest', { name: friendName })}
      </div>

      <div className="fp-anticipation-list">
        {reading.map((item, idx) => (
          <motion.div
            key={item.key}
            role="button"
            tabIndex={0}
            aria-label={t('{title} öffnen', { title: item.title })}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(item.href)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(item.href);
              }
            }}
            className="fp-card fp-anticipation-item"
          >
            {item.poster ? (
              <img
                src={item.poster}
                alt={item.title}
                className="fp-anticipation-poster"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span
                className="fp-anticipation-poster"
                aria-hidden
                style={{
                  background: `linear-gradient(160deg, ${currentTheme.primary}55, ${currentTheme.accent}33)`,
                }}
              />
            )}
            <div className="fp-anticipation-body">
              <div className="fp-anticipation-title" style={{ color: currentTheme.text.secondary }}>
                {item.title}
              </div>
              <div className="fp-anticipation-episode" style={{ color: currentTheme.text.muted }}>
                {item.progressText}
              </div>
              {item.progress > 0 && (
                <div className="fp-reading-progress" aria-hidden>
                  <span style={{ width: `${item.progress}%` }} />
                </div>
              )}
              <div className="fp-anticipation-meta">
                {item.lastAt && (
                  <span
                    className="fp-anticipation-countdown"
                    style={{ color: currentTheme.accent }}
                  >
                    {formatRelativeDay(item.lastAt, now)}
                  </span>
                )}
                {item.shared && (
                  <span
                    className="fp-anticipation-pair"
                    style={{
                      background: `${currentTheme.secondary}25`,
                      color: currentTheme.secondary,
                    }}
                  >
                    {t('Ihr beide')}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
