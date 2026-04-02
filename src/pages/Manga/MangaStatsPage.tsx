import {
  AutoStories,
  Category,
  CheckCircle,
  CollectionsBookmark,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { GradientText, PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getDisplayFormat } from './mangaUtils';

export const MangaStatsPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList } = useMangaList();
  const [mountTime] = useState(() => Date.now());

  const stats = useMemo(() => {
    const total = mangaList.length;
    const reading = mangaList.filter((m) => m.readStatus === 'reading').length;
    const completed = mangaList.filter((m) => m.readStatus === 'completed').length;
    const planned = mangaList.filter((m) => m.readStatus === 'planned').length;
    const dropped = mangaList.filter((m) => m.readStatus === 'dropped').length;
    const paused = mangaList.filter((m) => m.readStatus === 'paused').length;
    const totalChapters = mangaList.reduce((sum, m) => sum + m.currentChapter, 0);
    const totalVolumes = mangaList.reduce((sum, m) => sum + (m.currentVolume || 0), 0);

    // Ratings
    const rated = user
      ? mangaList.filter((m) => m.rating?.[user.uid] && m.rating[user.uid] > 0)
      : [];
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, m) => sum + (m.rating[user!.uid] || 0), 0) / rated.length
        : 0;

    // Progress
    const withChapters = mangaList.filter((m) => m.chapters && m.chapters > 0);
    const readInKnown = withChapters.reduce((sum, m) => sum + m.currentChapter, 0);
    const totalKnown = withChapters.reduce((sum, m) => sum + (m.chapters || 0), 0);
    const progressPct = totalKnown > 0 ? Math.round((readInKnown / totalKnown) * 100) : 0;

    // Format distribution
    const formats: Record<string, number> = {};
    mangaList.forEach((m) => {
      const f = getDisplayFormat(m.countryOfOrigin, m.format);
      formats[f] = (formats[f] || 0) + 1;
    });

    // Genre distribution
    const genres: Record<string, number> = {};
    mangaList.forEach((m) => {
      m.genres?.forEach((g) => {
        if (g && g.trim()) genres[g] = (genres[g] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const maxGenreCount = topGenres[0]?.[1] || 1;

    // Platform distribution
    const platforms: Record<string, number> = {};
    mangaList.forEach((m) => {
      if (m.readingPlatform) {
        platforms[m.readingPlatform] = (platforms[m.readingPlatform] || 0) + 1;
      }
    });
    const topPlatforms = Object.entries(platforms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Recently active (last 7 days)
    const weekAgo = mountTime - 7 * 24 * 60 * 60 * 1000;
    const activeThisWeek = mangaList.filter(
      (m) => m.lastReadAt && new Date(m.lastReadAt).getTime() > weekAgo
    ).length;

    return {
      total,
      reading,
      completed,
      planned,
      dropped,
      paused,
      totalChapters,
      totalVolumes,
      avgRating,
      ratedCount: rated.length,
      progressPct,
      readInKnown,
      totalKnown,
      formats: Object.entries(formats).sort((a, b) => b[1] - a[1]),
      topGenres,
      maxGenreCount,
      topPlatforms,
      activeThisWeek,
    };
  }, [mangaList, user, mountTime]);

  if (mangaList.length === 0) {
    return (
      <PageLayout>
        <PageHeader title="Manga Statistiken" icon={<TrendingUp />} />
        <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
          Noch keine Manga in deiner Sammlung.
        </div>
      </PageLayout>
    );
  }

  // Progress ring
  const ringSize = 90;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringOffset = circumference * (1 - stats.progressPct / 100);

  return (
    <PageLayout>
      <PageHeader
        title="Manga Statistiken"
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        subtitle="Dein Lese-Universum in Zahlen"
        icon={<TrendingUp />}
      />

      <div style={{ padding: '0 20px', paddingBottom: 100 }}>
        {/* ─── Hero Section ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            marginBottom: 24,
            padding: 20,
            borderRadius: 20,
            background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)`,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Left: Main stat */}
          <div style={{ flex: 1 }}>
            <GradientText
              from={currentTheme.primary}
              to={currentTheme.accent}
              style={{
                fontSize: 36,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {stats.totalChapters.toLocaleString()}
            </GradientText>
            <div style={{ fontSize: 14, color: currentTheme.text.secondary, marginTop: 4 }}>
              Kapitel gelesen
            </div>
            {stats.totalVolumes > 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: currentTheme.text.secondary,
                  opacity: 0.6,
                  marginTop: 2,
                }}
              >
                {stats.totalVolumes} Bände
              </div>
            )}
          </div>

          {/* Right: Progress ring */}
          <div style={{ textAlign: 'center' }}>
            <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={`${currentTheme.text.primary}10`}
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="url(#statsGrad)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              />
              <defs>
                <linearGradient id="statsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={currentTheme.primary} />
                  <stop offset="50%" stopColor={currentTheme.accent} />
                  <stop offset="100%" stopColor={currentTheme.status?.success || '#22c55e'} />
                </linearGradient>
              </defs>
            </svg>
            <div
              style={{
                marginTop: -ringSize / 2 - 12,
                fontSize: 18,
                fontWeight: 800,
                color: currentTheme.text.primary,
              }}
            >
              {stats.progressPct}%
            </div>
            <div
              style={{
                fontSize: 10,
                color: currentTheme.text.secondary,
                opacity: 0.5,
                marginTop: ringSize / 2 - 18,
              }}
            >
              {stats.readInKnown}/{stats.totalKnown}
            </div>
          </div>
        </motion.div>

        {/* ─── Quick Stats Grid ──────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 24,
          }}
        >
          <QuickStat
            icon={<AutoStories style={{ fontSize: 16 }} />}
            label="Manga"
            value={stats.total}
            color={currentTheme.primary}
            theme={currentTheme}
          />
          <QuickStat
            icon={<CheckCircle style={{ fontSize: 16 }} />}
            label="Fertig"
            value={stats.completed}
            color="#22c55e"
            theme={currentTheme}
          />
          <QuickStat
            icon={<Star style={{ fontSize: 16 }} />}
            label="Ø Rating"
            value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
            color="#f59e0b"
            theme={currentTheme}
          />
        </div>

        {/* ─── Status Breakdown ──────────────────────── */}
        <StatSection
          title="Status-Verteilung"
          icon={<CollectionsBookmark />}
          theme={currentTheme}
          delay={0.1}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Lese ich', value: stats.reading, color: '#3b82f6' },
              { label: 'Abgeschlossen', value: stats.completed, color: '#22c55e' },
              { label: 'Geplant', value: stats.planned, color: '#8b5cf6' },
              { label: 'Pausiert', value: stats.paused, color: '#f59e0b' },
              { label: 'Abgebrochen', value: stats.dropped, color: '#ef4444' },
            ]
              .filter((s) => s.value > 0)
              .map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 13, color: currentTheme.text.primary }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: currentTheme.text.primary }}>
                    {s.value}
                  </span>
                  <div style={{ width: 60 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.value / stats.total) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      style={{ height: 4, borderRadius: 2, background: s.color }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </StatSection>

        {/* ─── Format Distribution ───────────────────── */}
        {stats.formats.length > 1 && (
          <StatSection title="Formate" icon={<AutoStories />} theme={currentTheme} delay={0.15}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {stats.formats.map(([name, count]) => (
                <div
                  key={name}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)`,
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 13,
                    color: currentTheme.text.primary,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{count}</span> {name}
                </div>
              ))}
            </div>
          </StatSection>
        )}

        {/* ─── Top Genres ────────────────────────────── */}
        {stats.topGenres.length > 0 && (
          <StatSection title="Top Genres" icon={<Category />} theme={currentTheme} delay={0.2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.topGenres.map(([name, count], i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: i < 3 ? currentTheme.primary : currentTheme.text.secondary,
                      width: 20,
                      textAlign: 'right',
                      opacity: i < 3 ? 1 : 0.5,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: currentTheme.text.primary }}>
                    {name}
                  </span>
                  <span
                    style={{ fontSize: 12, color: currentTheme.text.secondary, fontWeight: 600 }}
                  >
                    {count}
                  </span>
                  <div style={{ width: 80 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / stats.maxGenreCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1 * i }}
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </StatSection>
        )}

        {/* ─── Platforms ─────────────────────────────── */}
        {stats.topPlatforms.length > 0 && (
          <StatSection
            title="Lese-Plattformen"
            icon={<AutoStories />}
            theme={currentTheme}
            delay={0.25}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {stats.topPlatforms.map(([name, count]) => (
                <div
                  key={name}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)`,
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 13,
                    color: currentTheme.text.primary,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{count}</span> × {name}
                </div>
              ))}
            </div>
          </StatSection>
        )}

        {/* ─── This Week ─────────────────────────────── */}
        <StatSection title="Diese Woche" icon={<TrendingUp />} theme={currentTheme} delay={0.3}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: currentTheme.primary,
                fontFamily: 'var(--font-display)',
              }}
            >
              {stats.activeThisWeek}
            </div>
            <div style={{ fontSize: 13, color: currentTheme.text.secondary }}>Manga gelesen</div>
          </div>
        </StatSection>
      </div>
    </PageLayout>
  );
};

// ─── Helper Components ──────────────────────────────

const QuickStat = ({
  icon,
  label,
  value,
  color,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  theme: ReturnType<typeof import('../../contexts/ThemeContextDef').useTheme>['currentTheme'];
}) => (
  <div
    style={{
      padding: 14,
      borderRadius: 14,
      background:
        'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 70,
        height: 70,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        filter: 'blur(20px)',
      }}
    />
    <div style={{ color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{icon}</div>
    <div
      style={{
        fontSize: 20,
        fontWeight: 800,
        color: theme.text.primary,
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: theme.text.secondary,
        opacity: 0.6,
        marginTop: 2,
      }}
    >
      {label}
    </div>
  </div>
);

const StatSection = ({
  title,
  icon,
  theme,
  delay = 0,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  theme: ReturnType<typeof import('../../contexts/ThemeContextDef').useTheme>['currentTheme'];
  delay?: number;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    style={{
      padding: 16,
      borderRadius: 16,
      background: `${theme.text.primary}06`,
      marginBottom: 14,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: theme.primary, display: 'flex' }}>{icon}</span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: theme.text.primary,
        }}
      >
        {title}
      </span>
    </div>
    {children}
  </motion.div>
);
