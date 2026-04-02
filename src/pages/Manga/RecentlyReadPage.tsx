import { History } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Manga } from '../../types/Manga';

const TIME_RANGES = [
  { days: 7, label: '7 Tage' },
  { days: 30, label: '30 Tage' },
  { days: 90, label: '3 Monate' },
] as const;

interface DateGroup {
  date: string;
  displayDate: string;
  manga: Manga[];
}

function formatGroupDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const diff = today.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Heute';
  if (days === 1) return 'Gestern';
  if (days < 7) return `Vor ${days} Tagen`;

  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export const RecentlyReadPage = () => {
  const { currentTheme } = useTheme();
  const { mangaList } = useMangaList();
  const navigate = useNavigate();
  const [rangeDays, setRangeDays] = useState(30);
  const [mountTime] = useState(() => Date.now());

  const dateGroups = useMemo(() => {
    const cutoff = mountTime - rangeDays * 24 * 60 * 60 * 1000;

    const recentManga = mangaList
      .filter((m) => m.lastReadAt && new Date(m.lastReadAt).getTime() > cutoff)
      .sort(
        (a, b) => new Date(b.lastReadAt || '').getTime() - new Date(a.lastReadAt || '').getTime()
      );

    const groups: Map<string, DateGroup> = new Map();

    for (const manga of recentManga) {
      if (!manga.lastReadAt) continue;
      const date = new Date(manga.lastReadAt);
      const key = date.toISOString().split('T')[0];

      if (!groups.has(key)) {
        groups.set(key, {
          date: key,
          displayDate: formatGroupDate(date),
          manga: [],
        });
      }
      const group = groups.get(key);
      if (group) group.manga.push(manga);
    }

    return Array.from(groups.values());
  }, [mangaList, rangeDays, mountTime]);

  const totalRead = dateGroups.reduce((sum, g) => sum + g.manga.length, 0);

  return (
    <PageLayout>
      <PageHeader
        title="Lese-Verlauf"
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        subtitle={totalRead > 0 ? `${totalRead} Manga gelesen` : undefined}
        icon={<History />}
      />

      <div style={{ padding: '0 16px' }}>
        {/* Time Range */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {TIME_RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                border: `1px solid ${rangeDays === r.days ? currentTheme.primary : 'rgba(255,255,255,0.08)'}`,
                background:
                  rangeDays === r.days ? `${currentTheme.primary}20` : 'rgba(255,255,255,0.04)',
                color: rangeDays === r.days ? currentTheme.primary : currentTheme.text.secondary,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Date Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 100 }}>
          {dateGroups.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: currentTheme.text.secondary,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{group.displayDate}</span>
                <span style={{ opacity: 0.4, fontSize: 11 }}>({group.manga.length})</span>
              </div>

              {/* Manga Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.manga.map((manga) => (
                  <motion.div
                    key={manga.anilistId}
                    onClick={() => navigate(`/manga/${manga.anilistId}`)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 12,
                      borderRadius: 12,
                      background: `${currentTheme.text.primary}06`,
                      cursor: 'pointer',
                      alignItems: 'center',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img
                      src={manga.poster}
                      alt={manga.title}
                      style={{
                        width: 42,
                        height: 60,
                        borderRadius: 8,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                      loading="lazy"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: currentTheme.text.primary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {manga.title}
                      </div>
                      <div
                        style={{ fontSize: 11, color: currentTheme.text.secondary, marginTop: 2 }}
                      >
                        Kap. {manga.currentChapter}
                        {manga.chapters ? ` / ${manga.chapters}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: currentTheme.text.secondary, opacity: 0.5 }}>
                      {manga.lastReadAt &&
                        new Date(manga.lastReadAt).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {dateGroups.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: currentTheme.text.primary }}>
              Kein Lese-Verlauf
            </div>
            <div
              style={{
                fontSize: 14,
                color: currentTheme.text.secondary,
                opacity: 0.6,
                marginTop: 4,
              }}
            >
              Hier siehst du deine zuletzt gelesenen Manga.
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
