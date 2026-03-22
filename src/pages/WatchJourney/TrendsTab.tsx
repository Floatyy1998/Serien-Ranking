import { ArrowDownward, ArrowUpward, Remove, Timeline } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { MultiYearTrendsData } from '../../services/watchJourneyService';
import { GENRE_COLORS, getColor } from '../../services/watchJourneyTypes';
import { ACCENT_COLORS } from './ActivityTab';
import { ActivityTooltip } from './ActivityTooltip';
import { CustomTooltip } from './CustomTooltip';
import { TrendsYearCards } from './TrendsYearCards';

interface TrendsTabProps {
  data: MultiYearTrendsData;
}

export const TrendsTab: React.FC<TrendsTabProps> = ({ data }) => {
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;
  const primaryColor = currentTheme.primary;

  const isSingleYear = data.yearlyData.length === 1;
  const currentMonth = new Date().getMonth() + 1;

  const yearlyChartData = useMemo(() => {
    return data.yearlyData.map((yd) => ({
      name: yd.year.toString(),
      Episoden: yd.episodes,
      Filme: yd.movies,
      Stunden: yd.totalHours,
    }));
  }, [data]);

  const genreEvolutionData = useMemo(() => {
    const topGenres = data.allTimeTopGenres.slice(0, 5).map((g) => g.genre);
    return data.yearlyData.map((yd) => {
      const entry: Record<string, number | string> = { name: yd.year.toString() };
      topGenres.forEach((genre) => {
        entry[genre] = Math.round(yd.genreDistribution[genre] || 0);
      });
      return entry;
    });
  }, [data]);

  const topGenreColors = useMemo(() => {
    const colors: Record<string, string> = {};
    data.allTimeTopGenres.slice(0, 5).forEach((g) => {
      colors[g.genre] = g.color;
    });
    return colors;
  }, [data]);

  // Single year: genre ranking from distribution
  const singleYearGenreRanking = useMemo(() => {
    if (!isSingleYear) return [];
    const yd = data.yearlyData[0];
    return Object.entries(yd.genreDistribution)
      .map(([genre, hours], i) => ({
        genre,
        hours: Math.round(hours),
        color: getColor(genre, GENRE_COLORS, i),
      }))
      .filter((g) => g.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [data, isSingleYear]);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up')
      return (
        <ArrowUpward style={{ color: currentTheme.status?.success || '#00b894', fontSize: 20 }} />
      );
    if (trend === 'down')
      return (
        <ArrowDownward style={{ color: currentTheme.status?.error || '#e17055', fontSize: 20 }} />
      );
    return <Remove style={{ color: textSecondary, fontSize: 20 }} />;
  };

  if (data.yearlyData.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Timeline style={{ fontSize: 64, color: `${textSecondary}30`, marginBottom: 16 }} />
        <h3 style={{ color: textPrimary, fontSize: 18, marginBottom: 8 }}>Keine Trend-Daten</h3>
        <p style={{ color: textSecondary, fontSize: 14 }}>
          Schau mehr Content um Trends über die Jahre zu sehen
        </p>
      </div>
    );
  }

  const cardStyle = {
    margin: '0 20px 24px',
    padding: '20px',
    borderRadius: '20px',
    background: bgSurface,
    border: `1px solid ${currentTheme.border.default}`,
  };

  const headingStyle = {
    color: textPrimary,
    fontSize: 16,
    fontFamily: 'var(--font-display)',
    fontWeight: 700 as const,
    margin: '0 0 20px',
  };

  return (
    <div>
      {/* Hero Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)`,
          border: `1px solid ${primaryColor}50`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: primaryColor,
            opacity: 0.1,
            filter: 'blur(60px)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p
            style={{
              color: textSecondary,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              marginBottom: 16,
            }}
          >
            {isSingleYear
              ? `JAHRESÜBERSICHT ${data.years[0]}`
              : `GESAMT ÜBER ${data.years.length} JAHRE`}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: ACCENT_COLORS.episodes, fontSize: 32, fontWeight: 800 }}>
                {data.totalEpisodes.toLocaleString()}
              </div>
              <div style={{ color: textSecondary, fontSize: 12 }}>Episoden</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: ACCENT_COLORS.movies, fontSize: 32, fontWeight: 800 }}>
                {data.totalMovies.toLocaleString()}
              </div>
              <div style={{ color: textSecondary, fontSize: 12 }}>Filme</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: ACCENT_COLORS.time, fontSize: 32, fontWeight: 800 }}>
                {data.totalHours.toLocaleString()}h
              </div>
              <div style={{ color: textSecondary, fontSize: 12 }}>Watchtime</div>
            </div>
          </div>
        </div>
      </motion.div>

      {isSingleYear ? (
        <>
          {/* Single Year: Durchschnitte */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={cardStyle}
          >
            <h3 style={headingStyle}>Dein Jahr in Zahlen</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                {
                  label: 'Ø pro Monat',
                  value: `${Math.round(data.totalHours / Math.max(currentMonth, 1))}h`,
                  color: ACCENT_COLORS.time,
                },
                {
                  label: 'Ø pro Woche',
                  value: `${Math.round(((data.totalHours / Math.max(currentMonth, 1)) * 12) / 52)}h`,
                  color: ACCENT_COLORS.episodes,
                },
                {
                  label: 'Ø Episoden/Monat',
                  value: Math.round(data.totalEpisodes / Math.max(currentMonth, 1)).toString(),
                  color: ACCENT_COLORS.movies,
                },
                {
                  label: 'Ø Filme/Monat',
                  value: (data.totalMovies / Math.max(currentMonth, 1)).toFixed(1),
                  color: ACCENT_COLORS.fire,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: `${stat.color}10`,
                    border: `1px solid ${stat.color}25`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: stat.color, fontSize: 28, fontWeight: 800 }}>
                    {stat.value}
                  </div>
                  <div style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Single Year: Genre-Ranking */}
          {singleYearGenreRanking.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              style={cardStyle}
            >
              <h3 style={headingStyle}>Genre-Ranking</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {singleYearGenreRanking.map((g, i) => {
                  const maxHours = singleYearGenreRanking[0].hours;
                  const pct = maxHours > 0 ? (g.hours / maxHours) * 100 : 0;
                  return (
                    <div key={g.genre}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>
                          {i + 1}. {g.genre}
                        </span>
                        <span style={{ color: g.color, fontSize: 13, fontWeight: 700 }}>
                          {g.hours}h
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 4,
                          background: `${textSecondary}15`,
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          style={{ height: '100%', borderRadius: 4, background: g.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <>
          {/* Multi-Year: Yearly Comparison */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={cardStyle}
          >
            <h3 style={headingStyle}>Aktivität pro Jahr</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart
                  data={yearlyChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="trendsEpisodenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT_COLORS.episodes} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={ACCENT_COLORS.episodes} stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="trendsFilmeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT_COLORS.movies} stopOpacity={0.9} />
                      <stop offset="95%" stopColor={ACCENT_COLORS.movies} stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: textSecondary, fontSize: 13, fontWeight: 600 }}
                    axisLine={{ stroke: `${textSecondary}30` }}
                  />
                  <YAxis
                    tick={{ fill: textSecondary, fontSize: 11 }}
                    axisLine={{ stroke: `${textSecondary}30` }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ActivityTooltip />}
                    shared={false}
                    cursor={{ fill: `${ACCENT_COLORS.episodes}10` }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => (
                      <span style={{ color: textSecondary, fontSize: 13 }}>{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="Episoden"
                    fill="url(#trendsEpisodenGradient)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                    style={{ outline: 'none' }}
                  />
                  <Bar
                    dataKey="Filme"
                    fill="url(#trendsFilmeGradient)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                    style={{ outline: 'none' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Multi-Year: Watch-Zeit Trend */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={cardStyle}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h3 style={{ ...headingStyle, margin: 0 }}>Watch-Zeit Trend</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendIcon trend={data.hoursTrend} />
                <span
                  style={{
                    color:
                      data.hoursTrend === 'up'
                        ? currentTheme.status?.success || '#00b894'
                        : data.hoursTrend === 'down'
                          ? currentTheme.status?.error || '#e17055'
                          : textSecondary,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {data.hoursTrend === 'up'
                    ? 'Steigend'
                    : data.hoursTrend === 'down'
                      ? 'Fallend'
                      : 'Stabil'}
                </span>
              </div>
            </div>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={yearlyChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT_COLORS.time} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={ACCENT_COLORS.time} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: textSecondary, fontSize: 13, fontWeight: 600 }}
                    axisLine={{ stroke: `${textSecondary}30` }}
                  />
                  <YAxis
                    tick={{ fill: textSecondary, fontSize: 11 }}
                    axisLine={{ stroke: `${textSecondary}30` }}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip content={<CustomTooltip unit="hours" />} />
                  <Area
                    type="monotone"
                    dataKey="Stunden"
                    stroke={ACCENT_COLORS.time}
                    strokeWidth={3}
                    fill="url(#hoursGradient)"
                    style={{ outline: 'none' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Multi-Year: Genre Evolution */}
          {data.allTimeTopGenres.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={cardStyle}
            >
              <h3 style={headingStyle}>Genre-Entwicklung</h3>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={genreEvolutionData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      {data.allTimeTopGenres.slice(0, 5).map((g) => (
                        <linearGradient
                          key={g.genre}
                          id={`trend-gradient-${g.genre.replace(/\s+/g, '-')}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={g.color} stopOpacity={0.9} />
                          <stop offset="95%" stopColor={g.color} stopOpacity={0.5} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: textSecondary, fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: `${textSecondary}30` }}
                    />
                    <YAxis
                      tick={{ fill: textSecondary, fontSize: 11 }}
                      axisLine={{ stroke: `${textSecondary}30` }}
                      tickFormatter={(v) => `${v}h`}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip unit="hours" />} shared={false} />
                    <Legend
                      wrapperStyle={{ paddingTop: 16 }}
                      formatter={(value) => (
                        <span style={{ color: textSecondary, fontSize: 12 }}>{value}</span>
                      )}
                    />
                    {data.allTimeTopGenres.slice(0, 5).map((g) => (
                      <Bar
                        key={g.genre}
                        dataKey={g.genre}
                        fill={`url(#trend-gradient-${g.genre.replace(/\s+/g, '-')})`}
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Year-by-Year Cards */}
      <TrendsYearCards yearlyData={data.yearlyData} topGenreColors={topGenreColors} />
    </div>
  );
};
