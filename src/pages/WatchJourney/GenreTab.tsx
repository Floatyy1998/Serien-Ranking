import { TheaterComedy } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { SafeResponsiveContainer } from '../../components/ui/SafeResponsiveContainer';
import { useTheme } from '../../contexts/ThemeContext';
import { WatchJourneyData } from '../../services/watchJourneyService';
import { CustomTooltip } from './CustomTooltip';

interface GenreTabProps {
  data: WatchJourneyData;
}

export const GenreTab: React.FC<GenreTabProps> = ({ data }) => {
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;

  // Prepare data for stacked area chart (absolute hours)
  const chartData = useMemo(() => {
    return data.genreMonths.map((month) => {
      const hoursValues: Record<string, number> = {};
      data.topGenres.forEach((genre) => {
        hoursValues[genre] = Math.round(((month.values[genre] || 0) / 60) * 10) / 10;
      });
      return {
        name: month.monthName,
        ...hoursValues,
      };
    });
  }, [data]);

  // Prepare data for pie chart
  const pieData = useMemo(() => {
    const totals: Record<string, number> = {};
    data.genreMonths.forEach((month) => {
      Object.entries(month.values).forEach(([genre, mins]) => {
        totals[genre] = (totals[genre] || 0) + mins;
      });
    });
    return data.topGenres.map((genre) => ({
      name: genre,
      value: Math.round((totals[genre] || 0) / 60),
      fill: data.genreColors[genre],
    }));
  }, [data]);

  // Calculate genre stats
  const genreStats = useMemo(() => {
    const totals: Record<string, number> = {};
    data.genreMonths.forEach((month) => {
      Object.entries(month.values).forEach(([genre, mins]) => {
        totals[genre] = (totals[genre] || 0) + mins;
      });
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return data.topGenres.map((genre) => ({
      genre,
      minutes: totals[genre] || 0,
      hours: Math.round((totals[genre] || 0) / 60),
      percentage: total > 0 ? Math.round(((totals[genre] || 0) / total) * 100) : 0,
      color: data.genreColors[genre],
    }));
  }, [data]);

  const topGenre = genreStats[0];

  if (data.topGenres.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <TheaterComedy style={{ fontSize: 64, color: `${textSecondary}30`, marginBottom: 16 }} />
        <h3 style={{ color: textPrimary, fontSize: 18, marginBottom: 8 }}>Keine Genre-Daten</h3>
        <p style={{ color: textSecondary, fontSize: 14 }}>
          Genres werden beim Markieren von Episoden erfasst
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Top Genre */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${topGenre?.color}30, ${topGenre?.color}10)`,
          border: `1px solid ${topGenre?.color}50`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: topGenre?.color,
            opacity: 0.15,
            filter: 'blur(40px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p
            style={{
              color: textSecondary,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            DEIN TOP GENRE
          </p>
          <h2 style={{ color: textPrimary, fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>
            {topGenre?.genre}
          </h2>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: topGenre?.color }}>
                {topGenre?.hours}
              </span>
              <span style={{ fontSize: 14, color: textSecondary, marginLeft: 4 }}>Stunden</span>
            </div>
            <div style={{ width: 1, background: `${textSecondary}40` }} />
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: topGenre?.color }}>
                {topGenre?.percentage}%
              </span>
              <span style={{ fontSize: 14, color: textSecondary, marginLeft: 4 }}>deiner Zeit</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pie Chart - Genre Distribution */}
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
        <h3
          style={{
            color: textPrimary,
            fontSize: 16,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          Genre-Verteilung
        </h3>
        <div style={{ width: '100%', height: 280 }}>
          <SafeResponsiveContainer minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                stroke="transparent"
                style={{ outline: 'none' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: bgSurface,
                          border: `1px solid ${item.fill}50`,
                          borderRadius: 12,
                          padding: '12px 16px',
                          boxShadow:
                            '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        <p style={{ color: item.fill, fontWeight: 700, margin: 0, fontSize: 15 }}>
                          {item.name}
                        </p>
                        <p style={{ color: textSecondary, margin: '4px 0 0', fontSize: 13 }}>
                          {item.value} Stunden
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </SafeResponsiveContainer>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          {pieData.slice(0, 6).map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.fill }} />
              <span style={{ color: textSecondary, fontSize: 12 }}>{item.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stacked Area Chart - Genre over time */}
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
        <h3
          style={{
            color: textPrimary,
            fontSize: 16,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          Genre-Entwicklung
        </h3>
        <div style={{ width: '100%', height: 280 }}>
          <SafeResponsiveContainer minWidth={0} minHeight={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {data.topGenres.map((genre) => (
                  <linearGradient
                    key={genre}
                    id={`gradient-${genre.replace(/\s+/g, '-')}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={data.genreColors[genre]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={data.genreColors[genre]} stopOpacity={0.2} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
              <XAxis
                dataKey="name"
                tick={{ fill: textSecondary, fontSize: 11 }}
                axisLine={{ stroke: `${textSecondary}30` }}
              />
              <YAxis
                tick={{ fill: textSecondary, fontSize: 11 }}
                axisLine={{ stroke: `${textSecondary}30` }}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip content={<CustomTooltip unit="hours" />} />
              {data.topGenres.map((genre) => (
                <Area
                  key={genre}
                  type="monotone"
                  dataKey={genre}
                  stroke={data.genreColors[genre]}
                  fill={`url(#gradient-${genre.replace(/\s+/g, '-')})`}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  style={{ outline: 'none' }}
                />
              ))}
            </AreaChart>
          </SafeResponsiveContainer>
        </div>
      </motion.div>

      {/* Genre Stats Grid */}
      <div style={{ padding: '0 20px' }}>
        <h3
          style={{
            color: textPrimary,
            fontSize: 16,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          Alle Genres
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {genreStats.map((stat, i) => (
            <motion.div
              key={stat.genre}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${stat.color}15, transparent)`,
                border: `1px solid ${stat.color}30`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{ width: 10, height: 10, borderRadius: '50%', background: stat.color }}
                />
                <span style={{ color: textPrimary, fontSize: 14, fontWeight: 600, flex: 1 }}>
                  {stat.genre}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: stat.color, fontSize: 20, fontWeight: 700 }}>
                  {stat.hours}h
                </span>
                <span
                  style={{ color: currentTheme.text.muted, fontSize: 14, alignSelf: 'flex-end' }}
                >
                  {stat.percentage}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
