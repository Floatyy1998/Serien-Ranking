import { Schedule } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { getEffectiveChapterCount, type AppTheme } from './mangaUtils';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Manga } from '../../types/Manga';

interface CatchUpManga {
  manga: Manga;
  remainingChapters: number;
  progress: number;
  lastReadDate?: string;
}

type SortKey = 'chapters' | 'progress' | 'recent';

export const MangaCatchUpPage = () => {
  const { currentTheme } = useTheme();
  const { mangaList } = useMangaList();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortKey>('chapters');

  const catchUpData = useMemo(() => {
    const data: CatchUpManga[] = [];

    for (const manga of mangaList) {
      const total = getEffectiveChapterCount(manga);
      if (manga.readStatus === 'reading' && total && total > 0 && manga.currentChapter < total) {
        data.push({
          manga,
          remainingChapters: total - manga.currentChapter,
          progress: (manga.currentChapter / total) * 100,
          lastReadDate: manga.lastReadAt,
        });
      }
    }

    return data;
  }, [mangaList]);

  const sorted = useMemo(() => {
    const copy = [...catchUpData];
    switch (sortBy) {
      case 'chapters':
        return copy.sort((a, b) => b.remainingChapters - a.remainingChapters);
      case 'progress':
        return copy.sort((a, b) => a.progress - b.progress);
      case 'recent':
        return copy.sort((a, b) => {
          if (!a.lastReadDate && !b.lastReadDate) return 0;
          if (!a.lastReadDate) return 1;
          if (!b.lastReadDate) return -1;
          return new Date(a.lastReadDate).getTime() - new Date(b.lastReadDate).getTime();
        });
      default:
        return copy;
    }
  }, [catchUpData, sortBy]);

  const totals = useMemo(() => {
    const totalChapters = catchUpData.reduce((s, i) => s + i.remainingChapters, 0);
    const avgProgress =
      catchUpData.length > 0
        ? catchUpData.reduce((s, i) => s + i.progress, 0) / catchUpData.length
        : 0;
    return { totalChapters, avgProgress };
  }, [catchUpData]);

  return (
    <PageLayout>
      <PageHeader
        title="Manga Aufholen"
        gradientFrom={currentTheme.accent}
        gradientTo={currentTheme.primary}
        subtitle={
          catchUpData.length > 0
            ? `${catchUpData.length} Manga · ${totals.totalChapters} Kapitel offen`
            : undefined
        }
        icon={<Schedule />}
      />

      <div style={{ padding: '0 16px' }}>
        {/* Hero Stats */}
        {catchUpData.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <HeroStat label="Manga" value={catchUpData.length} theme={currentTheme} />
            <HeroStat label="Kapitel offen" value={totals.totalChapters} theme={currentTheme} />
            <HeroStat
              label="Ø Fortschritt"
              value={`${Math.round(totals.avgProgress)}%`}
              theme={currentTheme}
            />
          </div>
        )}

        {/* Sort */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'chapters' as SortKey, label: 'Kapitel' },
            { key: 'progress' as SortKey, label: 'Fortschritt' },
            { key: 'recent' as SortKey, label: 'Zuletzt gelesen' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: sortBy === s.key ? `${currentTheme.primary}25` : 'transparent',
                color: sortBy === s.key ? currentTheme.primary : currentTheme.text.secondary,
                fontSize: 12,
                fontWeight: sortBy === s.key ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 100 }}>
          {sorted.map((item) => (
            <motion.div
              key={item.manga.anilistId}
              onClick={() => navigate(`/manga/${item.manga.anilistId}`)}
              style={{
                display: 'flex',
                gap: 14,
                padding: 14,
                borderRadius: 14,
                background: `${currentTheme.text.primary}06`,
                cursor: 'pointer',
                alignItems: 'center',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src={item.manga.poster}
                alt={item.manga.title}
                style={{
                  width: 50,
                  height: 70,
                  borderRadius: 8,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
                loading="lazy"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: currentTheme.text.primary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.manga.title}
                </div>
                <div style={{ fontSize: 12, color: currentTheme.text.secondary, marginTop: 2 }}>
                  Kap. {item.manga.currentChapter} / {getEffectiveChapterCount(item.manga)} ·{' '}
                  {item.remainingChapters} offen
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: `${currentTheme.text.primary}10`,
                    marginTop: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${item.progress}%`,
                      background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: currentTheme.accent,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {Math.round(item.progress)}%
              </div>
            </motion.div>
          ))}
        </div>

        {catchUpData.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: currentTheme.text.primary }}>
              Alles aufgeholt!
            </div>
            <div
              style={{
                fontSize: 14,
                color: currentTheme.text.secondary,
                opacity: 0.6,
                marginTop: 4,
              }}
            >
              Du bist bei allen Manga auf dem aktuellen Stand.
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

const HeroStat = ({
  label,
  value,
  theme,
}: {
  label: string;
  value: string | number;
  theme: AppTheme;
}) => (
  <div
    style={{
      background: `${theme.text.primary}06`,
      borderRadius: 14,
      padding: 14,
      textAlign: 'center',
    }}
  >
    <div
      style={{
        fontSize: 20,
        fontWeight: 800,
        color: theme.text.primary,
        fontFamily: 'var(--font-display)',
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 10,
        color: theme.text.secondary,
        opacity: 0.6,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: 2,
      }}
    >
      {label}
    </div>
  </div>
);
