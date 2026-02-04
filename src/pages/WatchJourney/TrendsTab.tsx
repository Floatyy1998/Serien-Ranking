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
import { ACCENT_COLORS } from './ActivityTab';
import { ActivityTooltip } from './ActivityTooltip';
import { CustomTooltip } from './CustomTooltip';

interface TrendsTabProps {
  data: MultiYearTrendsData;
}

export const TrendsTab: React.FC<TrendsTabProps> = ({ data }) => {
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;
  const primaryColor = currentTheme.primary;

  // Chart data for yearly comparison
  const yearlyChartData = useMemo(() => {
    return data.yearlyData.map((yd) => ({
      name: yd.year.toString(),
      Episoden: yd.episodes,
      Filme: yd.movies,
      Stunden: yd.totalHours,
    }));
  }, [data]);

  // Genre evolution per year
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

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <ArrowUpward style={{ color: '#00b894', fontSize: 20 }} />;
    if (trend === 'down') return <ArrowDownward style={{ color: '#e17055', fontSize: 20 }} />;
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

  return (
    <div>
      {/* Hero Stats - All Time */}
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
            GESAMT ÜBER {data.years.length} JAHR{data.years.length > 1 ? 'E' : ''}
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

      {/* Yearly Comparison Bar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          margin: '0 20px 24px',
          padding: '20px',
          borderRadius: '20px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>
          Aktivität pro Jahr
        </h3>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={yearlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              />
              <Tooltip
                content={<ActivityTooltip />}
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
                radius={[0, 0, 0, 0]}
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

      {/* Watch Hours Line Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 20px 24px',
          padding: '20px',
          borderRadius: '20px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>
            Watch-Zeit Trend
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendIcon trend={data.hoursTrend} />
            <span
              style={{
                color:
                  data.hoursTrend === 'up'
                    ? '#00b894'
                    : data.hoursTrend === 'down'
                      ? '#e17055'
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
            <AreaChart data={yearlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          background: bgSurface,
                          border: `1px solid ${ACCENT_COLORS.time}50`,
                          borderRadius: 12,
                          padding: '12px 16px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        <p
                          style={{
                            color: ACCENT_COLORS.time,
                            fontWeight: 700,
                            margin: 0,
                            fontSize: 15,
                          }}
                        >
                          {payload[0].payload.name}
                        </p>
                        <p style={{ color: textSecondary, margin: '4px 0 0', fontSize: 13 }}>
                          {payload[0].value} Stunden
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
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

      {/* Genre Evolution */}
      {data.allTimeTopGenres.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            margin: '0 20px 24px',
            padding: '20px',
            borderRadius: '20px',
            background: bgSurface,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>
            Genre-Entwicklung
          </h3>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart
                data={genreEvolutionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                      <stop offset="5%" stopColor={g.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={g.color} stopOpacity={0.2} />
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
                />
                <Tooltip content={<CustomTooltip />} />
                {data.allTimeTopGenres.slice(0, 5).map((g) => (
                  <Area
                    key={g.genre}
                    type="monotone"
                    dataKey={g.genre}
                    stackId="1"
                    stroke={g.color}
                    fill={`url(#trend-gradient-${g.genre.replace(/\s+/g, '-')})`}
                    strokeWidth={2}
                    style={{ outline: 'none' }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
              marginTop: 16,
            }}
          >
            {data.allTimeTopGenres.slice(0, 5).map((g) => (
              <div key={g.genre} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color }} />
                <span style={{ color: textSecondary, fontSize: 12 }}>{g.genre}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Year-by-Year Cards */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Jahr für Jahr
        </h3>

        {data.yearlyData
          .slice()
          .reverse()
          .map((yd, i) => (
            <motion.div
              key={yd.year}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              style={{
                padding: '20px',
                marginBottom: 12,
                borderRadius: '16px',
                background: bgSurface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>
                      {yd.year.toString().slice(-2)}
                    </span>
                  </div>
                  <div>
                    <div style={{ color: textPrimary, fontSize: 20, fontWeight: 700 }}>
                      {yd.year}
                    </div>
                    <div style={{ color: textSecondary, fontSize: 13 }}>
                      {yd.totalHours}h Watchtime
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: `${ACCENT_COLORS.episodes}15`,
                  }}
                >
                  <div style={{ color: ACCENT_COLORS.episodes, fontSize: 20, fontWeight: 700 }}>
                    {yd.episodes}
                  </div>
                  <div style={{ color: textSecondary, fontSize: 12 }}>Episoden</div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: `${ACCENT_COLORS.movies}15`,
                  }}
                >
                  <div style={{ color: ACCENT_COLORS.movies, fontSize: 20, fontWeight: 700 }}>
                    {yd.movies}
                  </div>
                  <div style={{ color: textSecondary, fontSize: 12 }}>Filme</div>
                </div>
              </div>

              {(yd.topGenre !== '-' || yd.topProvider !== '-') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {yd.topGenre !== '-' && (
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: `${topGenreColors[yd.topGenre] || ACCENT_COLORS.trending}20`,
                        border: `1px solid ${topGenreColors[yd.topGenre] || ACCENT_COLORS.trending}40`,
                      }}
                    >
                      <span
                        style={{
                          color: topGenreColors[yd.topGenre] || ACCENT_COLORS.trending,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Top: {yd.topGenre}
                      </span>
                    </div>
                  )}
                  {yd.topProvider !== '-' && (
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: `${textSecondary}15`,
                        border: `1px solid ${textSecondary}30`,
                      }}
                    >
                      <span style={{ color: textSecondary, fontSize: 12, fontWeight: 600 }}>
                        via {yd.topProvider}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
      </div>
    </div>
  );
};
