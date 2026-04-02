import { AutoStories, CheckCircle, CollectionsBookmark, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { IconContainer, SectionHeader } from '../../../components/ui';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useAuth } from '../../../AuthContext';
import type { Manga } from '../../../types/Manga';

export const MangaStatsSection: React.FC = React.memo(() => {
  const { mangaList } = useMangaList();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    const total = mangaList.length;
    const reading = mangaList.filter((m) => m.readStatus === 'reading').length;
    const completed = mangaList.filter((m) => m.readStatus === 'completed').length;
    const totalChapters = mangaList.reduce((sum, m) => sum + m.currentChapter, 0);
    const totalVolumes = mangaList.reduce((sum, m) => sum + (m.currentVolume || 0), 0);

    const rated = user
      ? mangaList.filter((m) => m.rating?.[user.uid] && m.rating[user.uid] > 0)
      : [];
    const avgRating =
      rated.length > 0
        ? (
            rated.reduce((sum, m) => sum + (user ? m.rating[user.uid] || 0 : 0), 0) / rated.length
          ).toFixed(1)
        : '—';

    const manga = mangaList.filter((m) => m.format === 'MANGA').length;
    const manhwa = mangaList.filter((m) => m.format === 'MANHWA').length;
    const manhua = mangaList.filter((m) => m.format === 'MANHUA').length;

    // Progress ring: chapters read / total chapters
    // Use chapters (AniList) or latestChapterAvailable (MangaDex) as total
    const withChapters = mangaList.filter(
      (m) =>
        (m.chapters && m.chapters > 0) || (m.latestChapterAvailable && m.latestChapterAvailable > 0)
    );
    const getEffectiveTotal = (m: Manga) => m.chapters || m.latestChapterAvailable || 0;
    const readChaptersInKnown = withChapters.reduce((sum, m) => sum + m.currentChapter, 0);
    const totalChaptersKnown = withChapters.reduce((sum, m) => sum + getEffectiveTotal(m), 0);
    const hasChapterTotals = totalChaptersKnown > 0;
    const progressPct = hasChapterTotals
      ? Math.round((readChaptersInKnown / totalChaptersKnown) * 100)
      : total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    // Genre distribution
    const genreCounts: Record<string, number> = {};
    mangaList.forEach((m) => {
      m.genres?.forEach((g) => {
        if (g && g.trim()) genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return {
      total,
      reading,
      completed,
      totalChapters,
      totalVolumes,
      avgRating,
      manga,
      manhwa,
      manhua,
      progressPct,
      readChaptersInKnown,
      totalChaptersKnown,
      topGenre,
    };
  }, [mangaList, user]);

  if (mangaList.length === 0) return null;

  const ringSize = 120;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringOffset = circumference * (1 - stats.progressPct / 100);

  return (
    <section style={{ marginBottom: 28 }}>
      <SectionHeader
        icon={<CollectionsBookmark />}
        iconColor={currentTheme.primary}
        title="Statistiken"
        onSeeAll={() => setExpanded((p) => !p)}
        seeAllLabel={expanded ? 'Weniger' : 'Mehr'}
      />

      {/* Bento Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: stats.progressPct > 0 ? '1fr 1fr' : 'repeat(3, 1fr)',
          gridTemplateRows: stats.progressPct > 0 ? 'auto auto' : 'auto',
          gap: 10,
          padding: '0 20px',
        }}
      >
        {/* Progress Ring - only if we have meaningful progress */}
        {stats.progressPct > 0 && (
          <div
            style={{
              gridRow: '1 / 3',
              background: `${currentTheme.text.primary}06`,
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={`${currentTheme.text.primary}10`}
                strokeWidth={strokeWidth}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="url(#mangaGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="mangaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={currentTheme.primary} />
                  <stop offset="100%" stopColor={currentTheme.accent} />
                </linearGradient>
              </defs>
            </svg>
            <div
              style={{
                marginTop: -ringSize / 2 - 16,
                fontSize: 22,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: currentTheme.text.primary,
              }}
            >
              {stats.progressPct}%
            </div>
            <div
              style={{
                fontSize: 11,
                color: currentTheme.text.secondary,
                opacity: 0.6,
                textAlign: 'center',
                marginTop: ringSize / 2 - 24,
              }}
            >
              {stats.totalChaptersKnown > 0
                ? `${stats.readChaptersInKnown} / ${stats.totalChaptersKnown} Kap.`
                : `${stats.completed} / ${stats.total} fertig`}
            </div>
          </div>
        )}

        {/* Manga count */}
        <StatTile
          icon={<AutoStories style={{ fontSize: 18 }} />}
          iconColor={currentTheme.primary}
          label="Manga"
          value={stats.total}
          theme={currentTheme}
        />

        {/* Chapters read */}
        <StatTile
          icon={<CheckCircle style={{ fontSize: 18 }} />}
          iconColor={currentTheme.accent}
          label="Kapitel gelesen"
          value={stats.totalChapters}
          theme={currentTheme}
        />

        {/* Show reading count when no ring */}
        {stats.progressPct === 0 && (
          <StatTile
            icon={<Star style={{ fontSize: 18 }} />}
            iconColor="#f59e0b"
            label="Am Lesen"
            value={stats.reading}
            theme={currentTheme}
          />
        )}
      </div>

      {/* Expanded stats */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            padding: '10px 20px 0',
          }}
        >
          <StatTile
            icon={<Star style={{ fontSize: 18 }} />}
            iconColor="#f59e0b"
            label="Ø Bewertung"
            value={stats.avgRating}
            theme={currentTheme}
          />
          <StatTile
            icon={<CheckCircle style={{ fontSize: 18 }} />}
            iconColor="#22c55e"
            label="Abgeschlossen"
            value={stats.completed}
            theme={currentTheme}
          />
          {stats.manga > 0 && (
            <StatTile
              icon={<AutoStories style={{ fontSize: 18 }} />}
              iconColor="#e879f9"
              label="Manga (JP)"
              value={stats.manga}
              theme={currentTheme}
            />
          )}
          {stats.manhwa > 0 && (
            <StatTile
              icon={<AutoStories style={{ fontSize: 18 }} />}
              iconColor="#38bdf8"
              label="Manhwa (KR)"
              value={stats.manhwa}
              theme={currentTheme}
            />
          )}
          {stats.manhua > 0 && (
            <StatTile
              icon={<AutoStories style={{ fontSize: 18 }} />}
              iconColor="#fb923c"
              label="Manhua (CN)"
              value={stats.manhua}
              theme={currentTheme}
            />
          )}
          <StatTile
            icon={<CollectionsBookmark style={{ fontSize: 18 }} />}
            iconColor={currentTheme.primary}
            label="Lieblingsgenre"
            value={stats.topGenre}
            theme={currentTheme}
          />
        </motion.div>
      )}
    </section>
  );
});

const StatTile = ({
  icon,
  iconColor,
  label,
  value,
  theme,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string | number;
  theme: Record<string, unknown>;
}) => (
  <div
    style={{
      background: `${(theme as { text: { primary: string } }).text.primary}06`,
      borderRadius: 14,
      padding: '14px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <IconContainer color={iconColor} size={32} borderRadius={10}>
      {icon}
    </IconContainer>
    <div
      style={{
        fontSize: 20,
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        color: (theme as { text: { primary: string } }).text.primary,
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 10,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: (theme as { text: { secondary: string } }).text.secondary,
        opacity: 0.6,
      }}
    >
      {label}
    </div>
  </div>
);
