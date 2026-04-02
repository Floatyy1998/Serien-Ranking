import { AutoGraph, Category, Schedule, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getDisplayFormat, type AppTheme } from './mangaUtils';

type TabType = 'activity' | 'genres' | 'insights';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'activity', label: 'Aktivität', icon: <TrendingUp style={{ fontSize: 16 }} /> },
  { id: 'genres', label: 'Genres', icon: <Category style={{ fontSize: 16 }} /> },
  { id: 'insights', label: 'Insights', icon: <AutoGraph style={{ fontSize: 16 }} /> },
];

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
];

export const MangaReadJourneyPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList } = useMangaList();
  const [activeTab, setActiveTab] = useState<TabType>('activity');

  // Compute journey data from manga list
  const journeyData = useMemo(() => {
    // Monthly activity (based on lastReadAt)
    const monthlyActivity = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      name: MONTH_NAMES[i],
      manga: 0,
      chapters: 0,
    }));

    const now = new Date();
    const thisYear = now.getFullYear();

    mangaList.forEach((m) => {
      if (m.lastReadAt) {
        const d = new Date(m.lastReadAt);
        if (d.getFullYear() === thisYear) {
          const month = d.getMonth();
          monthlyActivity[month].manga++;
          monthlyActivity[month].chapters += m.currentChapter;
        }
      }
    });

    const maxMonthChapters = Math.max(...monthlyActivity.map((m) => m.chapters), 1);

    // Genre distribution
    const genres: Record<string, number> = {};
    mangaList.forEach((m) => {
      m.genres?.forEach((g) => {
        if (g && g.trim()) genres[g] = (genres[g] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const maxGenre = topGenres[0]?.[1] || 1;

    // Insights
    const totalChapters = mangaList.reduce((sum, m) => sum + m.currentChapter, 0);
    const avgChaptersPerManga = mangaList.length > 0 ? totalChapters / mangaList.length : 0;

    const uid = user?.uid;
    const rated = uid ? mangaList.filter((m) => m.rating?.[uid] > 0) : [];
    const avgRating =
      rated.length > 0 && uid
        ? rated.reduce((sum, m) => sum + (m.rating[uid] || 0), 0) / rated.length
        : 0;

    // Format breakdown
    const formats: Record<string, number> = {};
    mangaList.forEach((m) => {
      const f = getDisplayFormat(m.countryOfOrigin, m.format);
      formats[f] = (formats[f] || 0) + 1;
    });

    // Most read manga
    const topManga = [...mangaList].sort((a, b) => b.currentChapter - a.currentChapter).slice(0, 5);

    // Reading streak (consecutive days)
    const readDates = new Set(
      mangaList
        .filter((m) => m.lastReadAt)
        .map((m) => new Date(m.lastReadAt!).toISOString().split('T')[0])
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (readDates.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      monthlyActivity,
      maxMonthChapters,
      topGenres,
      maxGenre,
      totalChapters,
      avgChaptersPerManga,
      avgRating,
      formats: Object.entries(formats),
      topManga,
      streak,
      ratedCount: rated.length,
    };
  }, [mangaList, user]);

  return (
    <PageLayout>
      <PageHeader
        title="Read Journey"
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        subtitle="Deine Lese-Trends & Insights"
        icon={<TrendingUp />}
      />

      <div style={{ padding: '0 20px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: active
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                    : `${currentTheme.text.primary}08`,
                  color: active ? '#fff' : currentTheme.text.secondary,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? `0 4px 16px ${currentTheme.primary}40` : 'none',
                }}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ paddingBottom: 100 }}>
          {activeTab === 'activity' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Monthly Bar Chart */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: `${currentTheme.text.primary}06`,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: currentTheme.text.primary,
                    marginBottom: 16,
                  }}
                >
                  Kapitel pro Monat
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
                  {journeyData.monthlyActivity.map((m, i) => {
                    const height =
                      journeyData.maxMonthChapters > 0
                        ? (m.chapters / journeyData.maxMonthChapters) * 100
                        : 0;
                    const isCurrentMonth = i === new Date().getMonth();
                    return (
                      <div
                        key={m.name}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{ fontSize: 9, color: currentTheme.text.secondary, opacity: 0.5 }}
                        >
                          {m.chapters > 0 ? m.chapters : ''}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, m.chapters > 0 ? 4 : 0)}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                          style={{
                            width: '100%',
                            borderRadius: 4,
                            background: isCurrentMonth
                              ? `linear-gradient(180deg, ${currentTheme.primary}, ${currentTheme.accent})`
                              : m.chapters > 0
                                ? `${currentTheme.primary}60`
                                : `${currentTheme.text.primary}10`,
                            minHeight: 2,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 9,
                            color: isCurrentMonth
                              ? currentTheme.primary
                              : currentTheme.text.secondary,
                            fontWeight: isCurrentMonth ? 700 : 400,
                            opacity: isCurrentMonth ? 1 : 0.5,
                          }}
                        >
                          {m.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Read Manga */}
              {journeyData.topManga.length > 0 && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: `${currentTheme.text.primary}06`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      color: currentTheme.text.primary,
                      marginBottom: 12,
                    }}
                  >
                    Meistgelesene Manga
                  </div>
                  {journeyData.topManga.map((m, i) => (
                    <div
                      key={m.anilistId}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: i < 3 ? currentTheme.primary : currentTheme.text.secondary,
                          width: 20,
                          textAlign: 'right',
                        }}
                      >
                        #{i + 1}
                      </span>
                      <img
                        src={m.poster}
                        alt={m.title}
                        style={{ width: 32, height: 44, borderRadius: 6, objectFit: 'cover' }}
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
                          {m.title}
                        </div>
                        <div
                          style={{ fontSize: 11, color: currentTheme.text.secondary, opacity: 0.6 }}
                        >
                          {m.currentChapter} Kapitel
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'genres' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: `${currentTheme.text.primary}06`,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: currentTheme.text.primary,
                    marginBottom: 16,
                  }}
                >
                  Genre-Verteilung
                </div>
                {journeyData.topGenres.map(([name, count], i) => (
                  <div
                    key={name}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: i < 3 ? currentTheme.primary : currentTheme.text.secondary,
                        width: 20,
                        textAlign: 'right',
                      }}
                    >
                      #{i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: currentTheme.text.primary }}>
                      {name}
                    </span>
                    <span
                      style={{ fontSize: 12, fontWeight: 600, color: currentTheme.text.secondary }}
                    >
                      {count}
                    </span>
                    <div style={{ width: 100 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / journeyData.maxGenre) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.05 * i }}
                        style={{
                          height: 8,
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Format breakdown */}
              {journeyData.formats.length > 0 && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: `${currentTheme.text.primary}06`,
                    marginTop: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      color: currentTheme.text.primary,
                      marginBottom: 12,
                    }}
                  >
                    Formate
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {journeyData.formats.map(([name, count]) => (
                      <div
                        key={name}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 12,
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: currentTheme.text.primary,
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {count}
                        </div>
                        <div
                          style={{ fontSize: 11, color: currentTheme.text.secondary, opacity: 0.6 }}
                        >
                          {name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <InsightCard
                label="Lese-Streak"
                value={`${journeyData.streak} Tage`}
                icon={<Schedule style={{ fontSize: 20 }} />}
                color={currentTheme.status?.success || '#22c55e'}
                theme={currentTheme}
              />
              <InsightCard
                label="Ø Kapitel pro Manga"
                value={journeyData.avgChaptersPerManga.toFixed(0)}
                icon={<AutoGraph style={{ fontSize: 20 }} />}
                color={currentTheme.primary}
                theme={currentTheme}
              />
              <InsightCard
                label="Ø Bewertung"
                value={journeyData.avgRating > 0 ? journeyData.avgRating.toFixed(1) : '—'}
                icon={<TrendingUp style={{ fontSize: 20 }} />}
                color="#f59e0b"
                theme={currentTheme}
                sub={journeyData.ratedCount > 0 ? `${journeyData.ratedCount} bewertet` : undefined}
              />
              <InsightCard
                label="Gesamt Kapitel"
                value={journeyData.totalChapters.toLocaleString()}
                icon={<Category style={{ fontSize: 20 }} />}
                color={currentTheme.accent}
                theme={currentTheme}
              />
            </motion.div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

const InsightCard = ({
  label,
  value,
  icon,
  color,
  theme,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  theme: AppTheme;
  sub?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: 16,
      borderRadius: 16,
      background:
        'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        filter: 'blur(20px)',
      }}
    />
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${color}1a 0%, ${color}0a 100%)`,
        border: `1px solid ${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: theme.text.secondary,
          opacity: 0.6,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: theme.text.primary,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: theme.text.secondary, opacity: 0.5, marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  </motion.div>
);
