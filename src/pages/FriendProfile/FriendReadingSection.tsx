import { motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { mangaTotalChapters } from '../../lib/manga/overview';
import { t } from '../../services/i18n';
import type { Manga } from '../../types/Manga';
import { formatRelativeDay } from '../Manga/mangaUtils';

interface Props {
  friendName: string;
  manga: Manga[];
  ownIds: Set<number>;
}

/** Was der Freund gerade liest — zuletzt gelesene Manga zuerst. */
export const FriendReadingSection = memo(function FriendReadingSection({
  friendName,
  manga,
  ownIds,
}: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());

  const reading = useMemo(
    () =>
      manga
        .filter((m) => m.readStatus === 'reading' && (m.currentChapter || 0) > 0)
        .sort(
          (a, b) =>
            new Date(b.lastReadAt || b.addedAt || 0).getTime() -
            new Date(a.lastReadAt || a.addedAt || 0).getTime()
        )
        .slice(0, 5),
    [manga]
  );

  if (reading.length === 0) return null;

  return (
    <div className="fp-anticipation">
      <div className="fp-anticipation-header" style={{ color: currentTheme.text.primary }}>
        {t('Was {name} gerade liest', { name: friendName })}
      </div>

      <div className="fp-anticipation-list">
        {reading.map((item, idx) => {
          const total = mangaTotalChapters(item);
          const progress = total > 0 ? Math.min(100, (item.currentChapter / total) * 100) : 0;
          return (
            <motion.div
              key={item.anilistId}
              role="button"
              tabIndex={0}
              aria-label={t('{title} öffnen', { title: item.title })}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/manga/${item.anilistId}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/manga/${item.anilistId}`);
                }
              }}
              className="fp-card fp-anticipation-item"
            >
              <img
                src={item.poster}
                alt={item.title}
                className="fp-anticipation-poster"
                loading="lazy"
                decoding="async"
              />
              <div className="fp-anticipation-body">
                <div
                  className="fp-anticipation-title"
                  style={{ color: currentTheme.text.secondary }}
                >
                  {item.title}
                </div>
                <div className="fp-anticipation-episode" style={{ color: currentTheme.text.muted }}>
                  {total > 0
                    ? t('Kap. {a} / {b}', { a: item.currentChapter, b: total })
                    : t('Kap. {n}', { n: item.currentChapter })}
                </div>
                {progress > 0 && (
                  <div className="fp-reading-progress" aria-hidden>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                )}
                <div className="fp-anticipation-meta">
                  {item.lastReadAt && (
                    <span
                      className="fp-anticipation-countdown"
                      style={{ color: currentTheme.accent }}
                    >
                      {formatRelativeDay(item.lastReadAt, now)}
                    </span>
                  )}
                  {ownIds.has(item.anilistId) && (
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
          );
        })}
      </div>
    </div>
  );
});
