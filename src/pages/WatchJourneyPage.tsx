/**
 * WatchJourneyPage - Premium Watch Journey Experience
 *
 * Zeigt deine Watch-Trends mit professionellen Recharts-Visualisierungen
 */

import {
  AccessTime,
  ArrowDownward,
  ArrowUpward,
  CalendarMonth,
  Category,
  ExpandMore,
  LocalFireDepartment,
  LocalMovies,
  Nightlight,
  Remove,
  Schedule,
  Speed,
  Subscriptions,
  Timeline,
  TrendingUp,
  Tv,
  WbSunny,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../App';
import { BackButton } from '../components/BackButton';
import { useTheme } from '../contexts/ThemeContext';
import {
  calculateWatchJourney,
  calculateMultiYearTrends,
  DAY_NAMES,
  normalizeMonthlyData,
  MultiYearTrendsData,
  WatchJourneyData,
} from '../services/watchJourneyService';

// ============================================================================
// CUSTOM TOOLTIP COMPONENTS
// ============================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 15, 35, 0.95)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <p style={{ color: 'white', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: entry.color,
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              {entry.name}: {Math.round(entry.value)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ActivityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 15, 35, 0.95)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          borderRadius: 12,
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <p style={{ color: 'white', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: entry.color,
              }}
            />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              {entry.name}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================================
// GENRE TAB - Mit Recharts
// ============================================================================

interface GenreTabProps {
  data: WatchJourneyData;
}

const GenreTab: React.FC<GenreTabProps> = ({ data }) => {
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;

  // Prepare data for stacked area chart
  const chartData = useMemo(() => {
    const normalized = normalizeMonthlyData(data.genreMonths, data.topGenres);
    return normalized.map((month) => ({
      name: month.monthName,
      ...month.values,
    }));
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
      color: data.genreColors[genre],
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
          <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
            DEIN TOP GENRE
          </p>
          <h2 style={{ color: textPrimary, fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>
            {topGenre?.genre}
          </h2>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: topGenre?.color }}>{topGenre?.hours}</span>
              <span style={{ fontSize: 14, color: textSecondary, marginLeft: 4 }}>Stunden</span>
            </div>
            <div style={{ width: 1, background: `${textSecondary}40` }} />
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: topGenre?.color }}>{topGenre?.percentage}%</span>
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
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Genre-Verteilung
        </h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
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
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" style={{ outline: 'none' }} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: bgSurface,
                          border: `1px solid ${item.color}50`,
                          borderRadius: 12,
                          padding: '12px 16px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        <p style={{ color: item.color, fontWeight: 700, margin: 0, fontSize: 15 }}>
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
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
          {pieData.slice(0, 6).map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
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
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Genre-Entwicklung
        </h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {data.topGenres.map((genre) => (
                  <linearGradient key={genre} id={`gradient-${genre.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={data.genreColors[genre]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={data.genreColors[genre]} stopOpacity={0.2} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
              <XAxis dataKey="name" tick={{ fill: textSecondary, fontSize: 11 }} axisLine={{ stroke: `${textSecondary}30` }} />
              <YAxis tick={{ fill: textSecondary, fontSize: 11 }} axisLine={{ stroke: `${textSecondary}30` }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              {data.topGenres.map((genre) => (
                <Area
                  key={genre}
                  type="monotone"
                  dataKey={genre}
                  stackId="1"
                  stroke={data.genreColors[genre]}
                  fill={`url(#gradient-${genre.replace(/\s+/g, '-')})`}
                  strokeWidth={2}
                  style={{ outline: 'none' }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Genre Stats Grid */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
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
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: stat.color }} />
                <span style={{ color: 'white', fontSize: 14, fontWeight: 600, flex: 1 }}>{stat.genre}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: stat.color, fontSize: 20, fontWeight: 700 }}>{stat.hours}h</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, alignSelf: 'flex-end' }}>{stat.percentage}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PROVIDER TAB - Mit Recharts
// ============================================================================

interface ProviderTabProps {
  data: WatchJourneyData;
}

const ProviderTab: React.FC<ProviderTabProps> = ({ data }) => {
  // Prepare data for stacked area chart
  const chartData = useMemo(() => {
    const normalized = normalizeMonthlyData(data.providerMonths, data.topProviders);
    return normalized.map((month) => ({
      name: month.monthName,
      ...month.values,
    }));
  }, [data]);

  // Prepare data for horizontal bar chart
  const barData = useMemo(() => {
    const totals: Record<string, number> = {};
    data.providerMonths.forEach((month) => {
      Object.entries(month.values).forEach(([provider, mins]) => {
        totals[provider] = (totals[provider] || 0) + mins;
      });
    });
    return data.topProviders.map((provider) => ({
      name: provider,
      hours: Math.round((totals[provider] || 0) / 60),
      color: data.providerColors[provider],
    }));
  }, [data]);

  const providerStats = useMemo(() => {
    const totals: Record<string, number> = {};
    data.providerMonths.forEach((month) => {
      Object.entries(month.values).forEach(([provider, mins]) => {
        totals[provider] = (totals[provider] || 0) + mins;
      });
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return data.topProviders.map((provider) => ({
      provider,
      minutes: totals[provider] || 0,
      hours: Math.round((totals[provider] || 0) / 60),
      percentage: total > 0 ? Math.round(((totals[provider] || 0) / total) * 100) : 0,
      color: data.providerColors[provider],
    }));
  }, [data]);

  const topProvider = providerStats[0];

  if (data.topProviders.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Subscriptions style={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', marginBottom: 16 }} />
        <h3 style={{ color: 'white', fontSize: 18, marginBottom: 8 }}>Keine Provider-Daten</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          Streaming-Dienste werden beim Markieren von Episoden erfasst
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Top Provider */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${topProvider?.color}30, ${topProvider?.color}10)`,
          border: `1px solid ${topProvider?.color}50`,
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
            background: topProvider?.color,
            opacity: 0.15,
            filter: 'blur(40px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
            DEIN TOP STREAMING-DIENST
          </p>
          <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
            {topProvider?.provider}
          </h2>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: topProvider?.color }}>{topProvider?.hours}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>Stunden</span>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: topProvider?.color }}>{topProvider?.percentage}%</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>deiner Zeit</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Horizontal Bar Chart - Provider Hours */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          margin: '0 20px 24px',
          padding: '20px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Stunden pro Dienst
        </h3>
        <div style={{ width: '100%', height: barData.length * 50 + 20 }}>
          <ResponsiveContainer>
            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={100} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: 'rgba(15, 15, 35, 0.95)',
                          border: `1px solid ${data.color}50`,
                          borderRadius: 12,
                          padding: '12px 16px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        <p style={{ color: data.color, fontWeight: 700, margin: 0, fontSize: 15 }}>
                          {data.name}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: 13 }}>
                          {data.hours} Stunden
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="hours" radius={[0, 8, 8, 0]} animationDuration={800} style={{ outline: 'none' }}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Stacked Area Chart - Provider over time */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 20px 24px',
          padding: '20px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Streaming-Verlauf
        </h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {data.topProviders.map((provider) => (
                  <linearGradient key={provider} id={`gradient-provider-${provider.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={data.providerColors[provider]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={data.providerColors[provider]} stopOpacity={0.2} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              {data.topProviders.map((provider) => (
                <Area
                  key={provider}
                  type="monotone"
                  dataKey={provider}
                  stackId="1"
                  stroke={data.providerColors[provider]}
                  fill={`url(#gradient-provider-${provider.replace(/\s+/g, '-')})`}
                  strokeWidth={2}
                  style={{ outline: 'none' }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16 }}>
          {providerStats.map((item) => (
            <div key={item.provider} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{item.provider}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// HEATMAP TAB - Premium Design
// ============================================================================

interface HeatmapTabProps {
  data: WatchJourneyData;
  width: number;
}

const HeatmapTab: React.FC<HeatmapTabProps> = ({ data, width }) => {
  const { currentTheme } = useTheme();
  const primaryColor = currentTheme.primary;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;

  // Responsive Gap-Größe basierend auf Bildschirmbreite
  const dayLabelWidth = 40; // Breite für Tages-Labels (Mo, Di, etc.)
  // Berechne ungefähre Zellgröße für Gap-Berechnung
  const approxCellSize = (width - dayLabelWidth - 40) / 25; // 24 Zellen + padding
  const cellGap = Math.max(2, Math.min(4, approxCellSize * 0.1));
  const maxCount = Math.max(...data.heatmap.map((h) => h.count), 1);

  // Hover state für Tooltip
  const [hoveredCell, setHoveredCell] = useState<{ hour: number; day: number; count: number; minutes: number } | null>(null);

  // Calculate insights
  const peakHourLabel = `${data.peakHour}:00`;
  const isNightOwl = data.peakHour >= 22 || data.peakHour <= 4;
  const isEarlyBird = data.peakHour >= 5 && data.peakHour <= 9;
  const lateNightCount = data.heatmap.filter((h) => h.hour >= 23 || h.hour <= 3).reduce((a, b) => a + b.count, 0);
  const totalCount = data.heatmap.reduce((a, b) => a + b.count, 0);
  const lateNightPercent = totalCount > 0 ? Math.round((lateNightCount / totalCount) * 100) : 0;

  const weekendCount = data.heatmap.filter((h) => h.dayOfWeek === 0 || h.dayOfWeek === 6).reduce((a, b) => a + b.count, 0);
  const weekdayCount = data.heatmap.filter((h) => h.dayOfWeek >= 1 && h.dayOfWeek <= 5).reduce((a, b) => a + b.count, 0);

  // Prepare bar data for hourly distribution
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: data.heatmap.filter((h) => h.hour === i).reduce((a, b) => a + b.count, 0),
    }));
    return hours;
  }, [data]);

  return (
    <div>
      {/* Hero - Peak Time */}
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
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: primaryColor,
            opacity: 0.15,
            filter: 'blur(40px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
            DEINE PRIME TIME
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isNightOwl ? (
                <Nightlight style={{ color: 'white', fontSize: 28 }} />
              ) : isEarlyBird ? (
                <WbSunny style={{ color: 'white', fontSize: 28 }} />
              ) : (
                <AccessTime style={{ color: 'white', fontSize: 28 }} />
              )}
            </div>
            <div>
              <h2 style={{ color: textPrimary, fontSize: 32, fontWeight: 800, margin: 0 }}>{peakHourLabel}</h2>
              <p style={{ color: textSecondary, fontSize: 14, margin: 0 }}>
                {DAY_NAMES[data.peakDay]} ist dein aktivster Tag
              </p>
            </div>
          </div>

          {isNightOwl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: `${primaryColor}20`,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Nightlight style={{ fontSize: 16, color: primaryColor }} />
              <span style={{ color: textPrimary, fontSize: 13 }}>Nachteule - {lateNightPercent}% nach 23 Uhr</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Hourly Distribution Bar Chart */}
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
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Uhrzeitverteilung
        </h3>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
              <XAxis
                dataKey="hour"
                tick={{ fill: textSecondary, fontSize: 10 }}
                axisLine={{ stroke: `${textSecondary}30` }}
                interval={5}
              />
              <YAxis tick={{ fill: textSecondary, fontSize: 11 }} axisLine={{ stroke: `${textSecondary}30` }} />
              <Tooltip
                cursor={{ fill: `${primaryColor}10` }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          background: bgSurface,
                          border: `1px solid ${primaryColor}50`,
                          borderRadius: 12,
                          padding: '12px 16px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        <p style={{ color: primaryColor, fontWeight: 700, margin: 0, fontSize: 15 }}>
                          {payload[0].payload.hour}
                        </p>
                        <p style={{ color: textSecondary, margin: '4px 0 0', fontSize: 13 }}>
                          {payload[0].value} Sessions
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <defs>
                <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <Bar dataKey="count" fill="url(#hourlyGradient)" radius={[4, 4, 0, 0]} animationDuration={800} style={{ outline: 'none' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Heatmap Grid */}
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
          position: 'relative',
          overflowX: 'auto',
        }}
      >
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Wochentag x Uhrzeit</h3>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                top: 60,
                left: '50%',
                transform: 'translateX(-50%)',
                background: bgSurface,
                border: `1px solid ${primaryColor}50`,
                borderRadius: 12,
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                zIndex: 10,
                textAlign: 'center',
              }}
            >
              <p style={{ color: primaryColor, fontWeight: 700, margin: 0, fontSize: 14 }}>
                {DAY_NAMES[hoveredCell.day]} {hoveredCell.hour}:00
              </p>
              <p style={{ color: textPrimary, margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>
                {hoveredCell.count} Sessions
              </p>
              {hoveredCell.minutes > 0 && (
                <p style={{ color: textSecondary, margin: '4px 0 0', fontSize: 12 }}>
                  {Math.round(hoveredCell.minutes / 60)}h {hoveredCell.minutes % 60}min
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-width Heatmap Container */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Hour labels - positioned to align with grid cells */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, height: 24 }}>
            <div style={{ width: dayLabelWidth, flexShrink: 0 }} /> {/* Spacer for day labels */}
            <div style={{ display: 'flex', position: 'relative', flex: 1 }}>
              {[0, 6, 12, 18, 23].map((hour) => (
                <div
                  key={hour}
                  style={{
                    position: 'absolute',
                    left: `${(hour / 23) * 100}%`,
                    transform: 'translateX(-50%)',
                    fontSize: 11,
                    color: textPrimary,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}
                >
                  {hour}:00
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div onMouseLeave={() => setHoveredCell(null)}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: cellGap + 2 }}>
                <div style={{ width: dayLabelWidth, flexShrink: 0, fontSize: 14, color: textPrimary, fontWeight: 600 }}>{DAY_NAMES[day]}</div>
                <div style={{ display: 'flex', gap: cellGap, flex: 1 }}>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = data.heatmap.find((h) => h.hour === hour && h.dayOfWeek === day);
                  const intensity = cell ? cell.count / maxCount : 0;
                  const isPeak = hour === data.peakHour && day === data.peakDay;
                  const isHovered = hoveredCell?.hour === hour && hoveredCell?.day === day;
                  return (
                    <div
                      key={hour}
                      onMouseEnter={() => setHoveredCell({
                        hour,
                        day,
                        count: cell?.count || 0,
                        minutes: cell?.minutes || 0
                      })}
                      style={{
                        flex: 1,
                        aspectRatio: '1 / 1',
                        borderRadius: 4,
                        background: intensity > 0
                          ? `color-mix(in srgb, ${primaryColor} ${20 + intensity * 80}%, transparent)`
                          : `${textSecondary}10`,
                        border: `2px solid ${isPeak ? textPrimary : isHovered ? primaryColor : 'transparent'}`,
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        boxShadow: isHovered ? `0 0 8px ${primaryColor}40` : 'none',
                        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24 }}>
          <span style={{ fontSize: 13, color: textSecondary }}>Weniger</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: `color-mix(in srgb, ${primaryColor} ${opacity * 100}%, transparent)`,
              }}
            />
          ))}
          <span style={{ fontSize: 13, color: textSecondary }}>Mehr</span>
        </div>
      </motion.div>

      {/* Insights */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Insights</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: '#00cec915',
              border: '1px solid #00cec940',
              textAlign: 'center',
            }}
          >
            <CalendarMonth style={{ color: '#00cec9', fontSize: 28, marginBottom: 8 }} />
            <div style={{ color: '#00cec9', fontSize: 24, fontWeight: 700 }}>{weekendCount}</div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Wochenend-Sessions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: '#fdcb6e15',
              border: '1px solid #fdcb6e40',
              textAlign: 'center',
            }}
          >
            <Speed style={{ color: '#fdcb6e', fontSize: 28, marginBottom: 8 }} />
            <div style={{ color: '#fdcb6e', fontSize: 24, fontWeight: 700 }}>{weekdayCount}</div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Wochentag-Sessions</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ACTIVITY TAB - Mit Recharts
// ============================================================================

interface ActivityTabProps {
  data: WatchJourneyData;
}

// Accent Farben für Abwechslung
const ACCENT_COLORS = {
  episodes: '#667eea',    // Lila für Episoden
  movies: '#f093fb',      // Pink für Filme
  time: '#00cec9',        // Cyan für Zeit
  fire: '#fdcb6e',        // Gold für Highlights
  trending: '#00b894',    // Grün für Trends
};

const ActivityTab: React.FC<ActivityTabProps> = ({ data }) => {
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;

  // Prepare data for bar chart
  const chartData = useMemo(() => {
    return data.activity.map((month) => ({
      name: month.monthName,
      Episoden: month.episodes,
      Filme: month.movies,
    }));
  }, [data]);

  // Find best month
  const bestMonth = data.activity.reduce((best, curr) =>
    curr.episodes + curr.movies > best.episodes + best.movies ? curr : best
  );

  const avgPerMonth = Math.round((data.totalEpisodes + data.totalMovies) / 12);
  const totalHours = Math.round(data.totalMinutes / 60);
  const daysWatched = Math.round(data.totalMinutes / 60 / 24);

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
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
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
            background: `linear-gradient(135deg, ${ACCENT_COLORS.episodes}, ${ACCENT_COLORS.movies})`,
            opacity: 0.1,
            filter: 'blur(60px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 16 }}>
            DEIN JAHR IN ZAHLEN
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${ACCENT_COLORS.episodes}, ${ACCENT_COLORS.episodes}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}
              >
                <Tv style={{ color: 'white', fontSize: 26 }} />
              </motion.div>
              <div style={{ color: ACCENT_COLORS.episodes, fontSize: 28, fontWeight: 800 }}>{data.totalEpisodes}</div>
              <div style={{ color: textSecondary, fontSize: 12 }}>Episoden</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.25, type: 'spring' }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${ACCENT_COLORS.movies}, ${ACCENT_COLORS.movies}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}
              >
                <LocalMovies style={{ color: 'white', fontSize: 26 }} />
              </motion.div>
              <div style={{ color: ACCENT_COLORS.movies, fontSize: 28, fontWeight: 800 }}>{data.totalMovies}</div>
              <div style={{ color: textSecondary, fontSize: 12 }}>Filme</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${ACCENT_COLORS.time}, ${ACCENT_COLORS.time}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}
              >
                <Schedule style={{ color: 'white', fontSize: 26 }} />
              </motion.div>
              <div style={{ color: ACCENT_COLORS.time, fontSize: 28, fontWeight: 800 }}>{totalHours}h</div>
              <div style={{ color: textSecondary, fontSize: 12 }}>Watch-Zeit</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bar Chart */}
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
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Monatliche Aktivität</h3>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="episodenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT_COLORS.episodes} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={ACCENT_COLORS.episodes} stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="filmeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT_COLORS.movies} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={ACCENT_COLORS.movies} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
              <XAxis dataKey="name" tick={{ fill: textSecondary, fontSize: 11 }} axisLine={{ stroke: `${textSecondary}30` }} />
              <YAxis tick={{ fill: textSecondary, fontSize: 11 }} axisLine={{ stroke: `${textSecondary}30` }} />
              <Tooltip content={<ActivityTooltip />} cursor={{ fill: `${ACCENT_COLORS.episodes}10` }} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => <span style={{ color: textSecondary, fontSize: 13 }}>{value}</span>}
              />
              <Bar dataKey="Episoden" stackId="a" fill="url(#episodenGradient)" radius={[0, 0, 0, 0]} animationDuration={800} style={{ outline: 'none' }} />
              <Bar dataKey="Filme" stackId="a" fill="url(#filmeGradient)" radius={[4, 4, 0, 0]} animationDuration={800} style={{ outline: 'none' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Insights */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Fun Facts</h3>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px',
            marginBottom: 12,
            borderRadius: '16px',
            background: `${ACCENT_COLORS.fire}15`,
            border: `1px solid ${ACCENT_COLORS.fire}40`,
          }}
        >
          <LocalFireDepartment style={{ color: ACCENT_COLORS.fire, fontSize: 32 }} />
          <div>
            <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>Bester Monat: {bestMonth.monthName}</div>
            <div style={{ color: textSecondary, fontSize: 13 }}>{bestMonth.episodes + bestMonth.movies} Episoden & Filme</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px',
            marginBottom: 12,
            borderRadius: '16px',
            background: `${ACCENT_COLORS.trending}15`,
            border: `1px solid ${ACCENT_COLORS.trending}40`,
          }}
        >
          <TrendingUp style={{ color: ACCENT_COLORS.trending, fontSize: 32 }} />
          <div>
            <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>{avgPerMonth} pro Monat</div>
            <div style={{ color: textSecondary, fontSize: 13 }}>Durchschnittliche Aktivität</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px',
            borderRadius: '16px',
            background: `${ACCENT_COLORS.time}15`,
            border: `1px solid ${ACCENT_COLORS.time}40`,
          }}
        >
          <AccessTime style={{ color: ACCENT_COLORS.time, fontSize: 32 }} />
          <div>
            <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>{daysWatched} Tage Watchtime</div>
            <div style={{ color: textSecondary, fontSize: 13 }}>Das entspricht {totalHours} Stunden</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// TRENDS TAB - Jahresvergleich
// ============================================================================

interface TrendsTabProps {
  data: MultiYearTrendsData;
}

const TrendsTab: React.FC<TrendsTabProps> = ({ data }) => {
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
          <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 16 }}>
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
              <XAxis dataKey="name" tick={{ fill: textSecondary, fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: `${textSecondary}30` }} />
              <YAxis tick={{ fill: textSecondary, fontSize: 11 }} axisLine={{ stroke: `${textSecondary}30` }} />
              <Tooltip content={<ActivityTooltip />} cursor={{ fill: `${ACCENT_COLORS.episodes}10` }} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => <span style={{ color: textSecondary, fontSize: 13 }}>{value}</span>}
              />
              <Bar dataKey="Episoden" fill="url(#trendsEpisodenGradient)" radius={[0, 0, 0, 0]} animationDuration={800} style={{ outline: 'none' }} />
              <Bar dataKey="Filme" fill="url(#trendsFilmeGradient)" radius={[4, 4, 0, 0]} animationDuration={800} style={{ outline: 'none' }} />
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>
            Watch-Zeit Trend
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendIcon trend={data.hoursTrend} />
            <span style={{
              color: data.hoursTrend === 'up' ? '#00b894' : data.hoursTrend === 'down' ? '#e17055' : textSecondary,
              fontSize: 13,
              fontWeight: 600,
            }}>
              {data.hoursTrend === 'up' ? 'Steigend' : data.hoursTrend === 'down' ? 'Fallend' : 'Stabil'}
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
              <XAxis dataKey="name" tick={{ fill: textSecondary, fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: `${textSecondary}30` }} />
              <YAxis tick={{ fill: textSecondary, fontSize: 11 }} axisLine={{ stroke: `${textSecondary}30` }} />
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
                        <p style={{ color: ACCENT_COLORS.time, fontWeight: 700, margin: 0, fontSize: 15 }}>
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
              <AreaChart data={genreEvolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {data.allTimeTopGenres.slice(0, 5).map((g) => (
                    <linearGradient key={g.genre} id={`trend-gradient-${g.genre.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={g.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={g.color} stopOpacity={0.2} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
                <XAxis dataKey="name" tick={{ fill: textSecondary, fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: `${textSecondary}30` }} />
                <YAxis tick={{ fill: textSecondary, fontSize: 11 }} axisLine={{ stroke: `${textSecondary}30` }} tickFormatter={(v) => `${v}h`} />
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16 }}>
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

        {data.yearlyData.slice().reverse().map((yd, i) => (
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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
                  <span style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>{yd.year.toString().slice(-2)}</span>
                </div>
                <div>
                  <div style={{ color: textPrimary, fontSize: 20, fontWeight: 700 }}>{yd.year}</div>
                  <div style={{ color: textSecondary, fontSize: 13 }}>{yd.totalHours}h Watchtime</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: `${ACCENT_COLORS.episodes}15` }}>
                <div style={{ color: ACCENT_COLORS.episodes, fontSize: 20, fontWeight: 700 }}>{yd.episodes}</div>
                <div style={{ color: textSecondary, fontSize: 12 }}>Episoden</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', background: `${ACCENT_COLORS.movies}15` }}>
                <div style={{ color: ACCENT_COLORS.movies, fontSize: 20, fontWeight: 700 }}>{yd.movies}</div>
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
                    <span style={{ color: topGenreColors[yd.topGenre] || ACCENT_COLORS.trending, fontSize: 12, fontWeight: 600 }}>
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

// ============================================================================
// MAIN PAGE
// ============================================================================

type TabType = 'genre' | 'provider' | 'heatmap' | 'activity' | 'trends';

// Available years (from 2024 to current year)
const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2024; y--) {
    years.push(y);
  }
  return years;
};

export const WatchJourneyPage: React.FC = () => {
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WatchJourneyData | null>(null);
  const [trendsData, setTrendsData] = useState<MultiYearTrendsData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('trends');
  const [chartWidth, setChartWidth] = useState(window.innerWidth - 40);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const availableYears = getAvailableYears();

  // Theme-basierte Farben
  const primaryColor = currentTheme.primary;
  const bgDefault = currentTheme.background.default;
  const bgSurface = currentTheme.background.surface;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Load single year data and multi-year trends in parallel
        const [journeyData, multiYearData] = await Promise.all([
          calculateWatchJourney(user.uid, selectedYear),
          calculateMultiYearTrends(user.uid, availableYears),
        ]);
        setData(journeyData);
        setTrendsData(multiYearData);
      } catch (error) {
        console.error('Error loading watch journey:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, selectedYear]);

  useEffect(() => {
    const updateWidth = () => setChartWidth(window.innerWidth - 40);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          background: bgDefault,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background for loading */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}20, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT_COLORS.movies}15, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />

        {/* Animated loading icon */}
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: `3px solid ${primaryColor}20`,
              borderTopColor: primaryColor,
              position: 'absolute',
              top: -10,
              left: -10,
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${primaryColor}30, ${ACCENT_COLORS.movies}20)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <TrendingUp style={{ fontSize: 36, color: primaryColor }} />
          </motion.div>
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ color: textPrimary, fontSize: 20, fontWeight: 700, margin: 0, marginBottom: '8px' }}
          >
            Analysiere Watch-History...
          </motion.p>
          <p style={{ color: textSecondary, fontSize: 14, margin: 0 }}>
            Berechne deine persönlichen Trends
          </p>
        </div>
      </div>
    );
  }

  if (!data || data.totalEpisodes + data.totalMovies === 0) {
    return (
      <div
        style={{
          height: '100vh',
          background: bgDefault,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
        }}
      >
        {/* Header mit Year Picker auch im Empty State */}
        <div
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <BackButton />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: textPrimary }}>Watch Journey</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowYearPicker(!showYearPicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: `1px solid ${primaryColor}40`,
              background: `${primaryColor}15`,
              color: textPrimary,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {selectedYear}
            <motion.div animate={{ rotate: showYearPicker ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ExpandMore style={{ fontSize: 20 }} />
            </motion.div>
          </motion.button>
        </div>

        {/* Year Picker Dropdown */}
        <AnimatePresence>
          {showYearPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 16, overflow: 'hidden' }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: bgSurface,
                  border: `1px solid ${currentTheme.border.default}`,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {availableYears.map((year) => (
                  <motion.button
                    key={year}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearPicker(false);
                    }}
                    style={{
                      padding: '14px 28px',
                      borderRadius: '12px',
                      border: selectedYear === year ? 'none' : `1px solid ${currentTheme.border.default}`,
                      background: selectedYear === year ? primaryColor : bgSurface,
                      color: selectedYear === year ? 'white' : textPrimary,
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {year}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp style={{ fontSize: 80, color: `${textSecondary}30`, marginBottom: 24 }} />
          <h2 style={{ color: textPrimary, fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Keine Daten für {selectedYear}
          </h2>
          <p style={{ color: textSecondary, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
            {selectedYear === new Date().getFullYear()
              ? 'Schau Serien und Filme, um deine persönliche Watch Journey zu sehen!'
              : 'Wähle ein anderes Jahr oder schau mehr Content!'}
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'trends' as TabType, label: 'Trends', icon: <Timeline style={{ fontSize: 18 }} /> },
    { id: 'activity' as TabType, label: 'Aktivität', icon: <TrendingUp style={{ fontSize: 18 }} /> },
    { id: 'genre' as TabType, label: 'Genres', icon: <Category style={{ fontSize: 18 }} /> },
    { id: 'provider' as TabType, label: 'Streaming', icon: <Subscriptions style={{ fontSize: 18 }} /> },
    { id: 'heatmap' as TabType, label: 'Zeiten', icon: <Schedule style={{ fontSize: 18 }} /> },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: bgDefault,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Decorative Background Gradients */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            left: '-20%',
            width: '60%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${primaryColor}12 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '-15%',
            width: '50%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${ACCENT_COLORS.movies}10 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '20%',
            width: '50%',
            height: '35%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${ACCENT_COLORS.time}08 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div style={{ paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
        {/* Premium Glassmorphism Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '16px 20px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: `${bgDefault}90`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <BackButton />
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                background: `linear-gradient(135deg, ${primaryColor}, ${ACCENT_COLORS.movies})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Watch Journey
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: textSecondary, marginTop: '2px' }}>Deine Trends & Insights</p>
          </div>

          {/* Premium Year Picker Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowYearPicker(!showYearPicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '14px',
              border: 'none',
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 15px ${primaryColor}40`,
            }}
          >
            {selectedYear}
            <motion.div animate={{ rotate: showYearPicker ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ExpandMore style={{ fontSize: 20 }} />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Year Picker Dropdown */}
        <AnimatePresence>
          {showYearPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                margin: '0 20px 16px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: bgSurface,
                  border: `1px solid ${currentTheme.border.default}`,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {availableYears.map((year) => (
                  <motion.button
                    key={year}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearPicker(false);
                    }}
                    style={{
                      padding: '14px 28px',
                      borderRadius: '12px',
                      border: selectedYear === year ? 'none' : `1px solid ${currentTheme.border.default}`,
                      background: selectedYear === year ? primaryColor : bgSurface,
                      color: selectedYear === year ? 'white' : textPrimary,
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: selectedYear === year ? `0 4px 15px ${primaryColor}40` : 'none',
                    }}
                  >
                    {year}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Tabs - Mobile Optimized */}
        <div style={{ padding: '0 16px 24px', overflow: 'visible' }}>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              overflow: 'visible',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: isActive ? 'none' : 1,
                    minWidth: isActive ? 'auto' : '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: isActive ? '10px 16px' : '10px 8px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive
                      ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`
                      : 'transparent',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? `0 4px 12px ${primaryColor}35` : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {tab.icon}
                  {isActive && <span>{tab.label}</span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'trends' && trendsData && (
            <motion.div key="trends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TrendsTab data={trendsData} />
            </motion.div>
          )}
          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ActivityTab data={data} />
            </motion.div>
          )}
          {activeTab === 'genre' && (
            <motion.div key="genre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GenreTab data={data} />
            </motion.div>
          )}
          {activeTab === 'provider' && (
            <motion.div key="provider" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProviderTab data={data} />
            </motion.div>
          )}
          {activeTab === 'heatmap' && (
            <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HeatmapTab data={data} width={chartWidth + 40} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WatchJourneyPage;
