/**
 * WatchJourneyPage - Premium Watch Journey Experience
 *
 * Zeigt deine Watch-Trends mit professionellen Recharts-Visualisierungen
 */

import {
  AccessTime,
  ArrowDownward,
  ArrowUpward,
  AutoGraph,
  CalendarMonth,
  Category,
  ExpandMore,
  LocalFireDepartment,
  LocalMovies,
  MovieFilter,
  Nightlight,
  Remove,
  Replay,
  Schedule,
  Speed,
  Subscriptions,
  Timeline,
  Timer,
  TrendingUp,
  Tv,
  WbSunny,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../App';
import { BackButton } from '../components/BackButton';
import { useTheme } from '../contexts/ThemeContext';
import {
  calculateMultiYearTrends,
  calculateWatchJourney,
  DAY_NAMES,
  MultiYearTrendsData,
  normalizeMonthlyData,
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
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="transparent"
                    style={{ outline: 'none' }}
                  />
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
                tickFormatter={(v) => `${v}%`}
              />
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
                <div
                  style={{ width: 10, height: 10, borderRadius: '50%', background: stat.color }}
                />
                <span style={{ color: 'white', fontSize: 14, fontWeight: 600, flex: 1 }}>
                  {stat.genre}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: stat.color, fontSize: 20, fontWeight: 700 }}>
                  {stat.hours}h
                </span>
                <span
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, alignSelf: 'flex-end' }}
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
          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            DEIN TOP STREAMING-DIENST
          </p>
          <h2 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
            {topProvider?.provider}
          </h2>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: topProvider?.color }}>
                {topProvider?.hours}
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                Stunden
              </span>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: topProvider?.color }}>
                {topProvider?.percentage}%
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                deiner Zeit
              </span>
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
          Stunden pro Streaming-Dienst
        </h3>
        <div style={{ width: '100%', height: barData.length * 50 + 20 }}>
          <ResponsiveContainer>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                width={100}
              />
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
                        <p
                          style={{
                            color: 'rgba(255,255,255,0.7)',
                            margin: '4px 0 0',
                            fontSize: 13,
                          }}
                        >
                          {data.hours} Stunden
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="hours"
                radius={[0, 8, 8, 0]}
                animationDuration={800}
                style={{ outline: 'none' }}
              >
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
                  <linearGradient
                    key={provider}
                    id={`gradient-provider-${provider.replace(/\s+/g, '-')}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={data.providerColors[provider]} stopOpacity={0.8} />
                    <stop
                      offset="95%"
                      stopColor={data.providerColors[provider]}
                      stopOpacity={0.2}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(v) => `${v}%`}
              />
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
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            marginTop: 16,
          }}
        >
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
  const [hoveredCell, setHoveredCell] = useState<{
    hour: number;
    day: number;
    count: number;
    minutes: number;
  } | null>(null);

  // Calculate insights
  const peakHourLabel = `${data.peakHour}:00`;
  const isNightOwl = data.peakHour >= 22 || data.peakHour <= 4;
  const isEarlyBird = data.peakHour >= 5 && data.peakHour <= 9;
  const lateNightCount = data.heatmap
    .filter((h) => h.hour >= 23 || h.hour <= 3)
    .reduce((a, b) => a + b.count, 0);
  const totalCount = data.heatmap.reduce((a, b) => a + b.count, 0);
  const lateNightPercent = totalCount > 0 ? Math.round((lateNightCount / totalCount) * 100) : 0;

  const weekendCount = data.heatmap
    .filter((h) => h.dayOfWeek === 0 || h.dayOfWeek === 6)
    .reduce((a, b) => a + b.count, 0);
  const weekdayCount = data.heatmap
    .filter((h) => h.dayOfWeek >= 1 && h.dayOfWeek <= 5)
    .reduce((a, b) => a + b.count, 0);

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
          <p
            style={{
              color: textSecondary,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
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
              <h2 style={{ color: textPrimary, fontSize: 32, fontWeight: 800, margin: 0 }}>
                {peakHourLabel}
              </h2>
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
              <span style={{ color: textPrimary, fontSize: 13 }}>
                Nachteule - {lateNightPercent}% nach 23 Uhr
              </span>
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
              <YAxis
                tick={{ fill: textSecondary, fontSize: 11 }}
                axisLine={{ stroke: `${textSecondary}30` }}
              />
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
                        <p
                          style={{ color: primaryColor, fontWeight: 700, margin: 0, fontSize: 15 }}
                        >
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
              <Bar
                dataKey="count"
                fill="url(#hourlyGradient)"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                style={{ outline: 'none' }}
              />
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
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>
          Wochentag x Uhrzeit
        </h3>

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
              <div
                key={day}
                style={{ display: 'flex', alignItems: 'center', marginBottom: cellGap + 2 }}
              >
                <div
                  style={{
                    width: dayLabelWidth,
                    flexShrink: 0,
                    fontSize: 14,
                    color: textPrimary,
                    fontWeight: 600,
                  }}
                >
                  {DAY_NAMES[day]}
                </div>
                <div style={{ display: 'flex', gap: cellGap, flex: 1 }}>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = data.heatmap.find((h) => h.hour === hour && h.dayOfWeek === day);
                    const intensity = cell ? cell.count / maxCount : 0;
                    const isPeak = hour === data.peakHour && day === data.peakDay;
                    const isHovered = hoveredCell?.hour === hour && hoveredCell?.day === day;
                    return (
                      <div
                        key={hour}
                        onMouseEnter={() =>
                          setHoveredCell({
                            hour,
                            day,
                            count: cell?.count || 0,
                            minutes: cell?.minutes || 0,
                          })
                        }
                        style={{
                          flex: 1,
                          aspectRatio: '1 / 1',
                          borderRadius: 4,
                          background:
                            intensity > 0
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 24,
          }}
        >
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
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Insights
        </h3>
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
  episodes: '#667eea', // Lila für Episoden
  movies: '#f093fb', // Pink für Filme
  time: '#00cec9', // Cyan für Zeit
  fire: '#fdcb6e', // Gold für Highlights
  trending: '#00b894', // Grün für Trends
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

  // Calculate average based on months passed in the year
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const avgPerMonth = Math.round((data.totalEpisodes + data.totalMovies) / currentMonth);
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
          <p
            style={{
              color: textSecondary,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              marginBottom: 16,
            }}
          >
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
              <div style={{ color: ACCENT_COLORS.episodes, fontSize: 28, fontWeight: 800 }}>
                {data.totalEpisodes}
              </div>
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
              <div style={{ color: ACCENT_COLORS.movies, fontSize: 28, fontWeight: 800 }}>
                {data.totalMovies}
              </div>
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
              <div style={{ color: ACCENT_COLORS.time, fontSize: 28, fontWeight: 800 }}>
                {totalHours}h
              </div>
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
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>
          Monatliche Aktivität
        </h3>

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
              <XAxis
                dataKey="name"
                tick={{ fill: textSecondary, fontSize: 11 }}
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
                stackId="a"
                fill="url(#episodenGradient)"
                radius={[0, 0, 0, 0]}
                animationDuration={800}
                style={{ outline: 'none' }}
              />
              <Bar
                dataKey="Filme"
                stackId="a"
                fill="url(#filmeGradient)"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                style={{ outline: 'none' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Insights */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Fun Facts
        </h3>

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
            <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>
              Bester Monat: {bestMonth.monthName}
            </div>
            <div style={{ color: textSecondary, fontSize: 13 }}>
              {bestMonth.episodes + bestMonth.movies} Episoden & Filme
            </div>
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
            <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>
              {avgPerMonth} pro Monat
            </div>
            <div style={{ color: textSecondary, fontSize: 13 }}>
              Ø über {currentMonth} {currentMonth === 1 ? 'Monat' : 'Monate'}
            </div>
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
            <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>
              {daysWatched} Tage Watchtime
            </div>
            <div style={{ color: textSecondary, fontSize: 13 }}>
              Das entspricht {totalHours} Stunden
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// SERIEN TAB - Visuelle Serie-Übersicht mit Timeline (Ausgewähltes Jahr)
// ============================================================================

interface SerienTabProps {
  data: WatchJourneyData;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';
const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

const SerienTab: React.FC<SerienTabProps> = ({ data }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;
  const primaryColor = currentTheme.primary;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [monthRangeStart, setMonthRangeStart] = useState(1); // 1-12
  const [monthRangeEnd, setMonthRangeEnd] = useState(12); // 1-12

  const monthNames = [
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use series stats from the selected year
  const seriesStats = useMemo(() => {
    return [...data.seriesStats].sort((a, b) => b.episodes - a.episodes);
  }, [data.seriesStats]);

  const [posters, setPosters] = useState<Record<number, string>>({});

  // Fetch posters for series
  useEffect(() => {
    const fetchPosters = async () => {
      if (!TMDB_API_KEY || seriesStats.length === 0) return;

      const newPosters: Record<number, string> = {};
      const seriesIds = seriesStats.map((s) => s.seriesId);

      // Fetch in batches of 10 to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < seriesIds.length; i += batchSize) {
        const batch = seriesIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (id) => {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}&language=de-DE`
              );
              if (response.ok) {
                const tmdbData = await response.json();
                if (tmdbData.poster_path) {
                  newPosters[id] = tmdbData.poster_path;
                }
              }
            } catch {
              // Silent fail
            }
          })
        );
        // Update state after each batch so posters appear progressively
        setPosters({ ...newPosters });
      }
    };

    fetchPosters();
  }, [seriesStats]);

  // Timeline series with calculated positions for Gantt chart (filtered by month range)
  const timelineSeries = useMemo(() => {
    // Use selected month range
    const rangeStart = new Date(data.year, monthRangeStart - 1, 1).getTime();
    const rangeEnd = new Date(data.year, monthRangeEnd, 0, 23, 59, 59).getTime(); // Last day of end month
    const rangeDuration = rangeEnd - rangeStart;

    return seriesStats
      .filter((series) => {
        // Include series that overlap with the selected month range
        const first = new Date(series.firstWatched).getTime();
        const last = new Date(series.lastWatched).getTime();
        return first <= rangeEnd && last >= rangeStart;
      })
      .map((series) => {
        const firstDate = new Date(series.firstWatched);
        const lastDate = new Date(series.lastWatched);

        // Clamp dates to the selected range
        const effectiveStart = Math.max(firstDate.getTime(), rangeStart);
        const effectiveEnd = Math.min(lastDate.getTime(), rangeEnd);

        // Calculate position and width as percentages of the selected range
        const startPercent = ((effectiveStart - rangeStart) / rangeDuration) * 100;
        const endPercent = ((effectiveEnd - rangeStart) / rangeDuration) * 100;
        const widthPercent = Math.max(endPercent - startPercent, 2); // Min 2% width

        // Calculate total watch time in hours
        const totalMinutes = series.episodes * (series.avgRuntime || 45);
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

        return {
          ...series,
          effectiveStart: new Date(effectiveStart),
          effectiveEnd: new Date(effectiveEnd),
          startPercent,
          widthPercent,
          totalHours,
        };
      })
      .sort((a, b) => a.effectiveStart.getTime() - b.effectiveStart.getTime());
  }, [seriesStats, data.year, monthRangeStart, monthRangeEnd]);

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  };

  // Total stats
  const totalEpisodes = seriesStats.reduce((sum, s) => sum + s.episodes, 0);
  const uniqueSeriesCount = seriesStats.length;
  const avgEpisodesPerSeries =
    uniqueSeriesCount > 0 ? Math.round((totalEpisodes / uniqueSeriesCount) * 10) / 10 : 0;

  if (seriesStats.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <MovieFilter style={{ fontSize: 64, color: `${textSecondary}30`, marginBottom: 16 }} />
        <h3 style={{ color: textPrimary, fontSize: 18, marginBottom: 8 }}>Keine Serien-Daten</h3>
        <p style={{ color: textSecondary, fontSize: 14 }}>
          Schau Serien, um deine Serie-Reise zu sehen!
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 40 }}>
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
          <p
            style={{
              color: textSecondary,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            DEINE SERIEN-REISE
          </p>
          <h2 style={{ color: textPrimary, fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>
            {uniqueSeriesCount} Serien
          </h2>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: primaryColor }}>
                {totalEpisodes}
              </span>
              <span style={{ fontSize: 14, color: textSecondary, marginLeft: 4 }}>Episoden</span>
            </div>
            <div style={{ width: 1, background: `${textSecondary}40` }} />
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: primaryColor }}>
                Ø {avgEpisodesPerSeries}
              </span>
              <span style={{ fontSize: 14, color: textSecondary, marginLeft: 4 }}>pro Serie</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gantt Chart Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>
            Serien-Timeline {data.year}
          </h3>

          {/* Month range selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <select
                value={monthRangeStart}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMonthRangeStart(val);
                  if (val > monthRangeEnd) setMonthRangeEnd(val);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: `${primaryColor}15`,
                  border: `1px solid ${primaryColor}30`,
                  borderRadius: 8,
                  padding: isMobile ? '6px 28px 6px 10px' : '8px 32px 8px 12px',
                  color: textPrimary,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {monthNames.map((name, i) => (
                  <option
                    key={i}
                    value={i + 1}
                    style={{ background: bgSurface, color: textPrimary }}
                  >
                    {name}
                  </option>
                ))}
              </select>
              <ExpandMore
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: primaryColor,
                  pointerEvents: 'none',
                }}
              />
            </div>
            <span style={{ color: textSecondary, fontSize: 13 }}>–</span>
            <div style={{ position: 'relative' }}>
              <select
                value={monthRangeEnd}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMonthRangeEnd(val);
                  if (val < monthRangeStart) setMonthRangeStart(val);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: `${primaryColor}15`,
                  border: `1px solid ${primaryColor}30`,
                  borderRadius: 8,
                  padding: isMobile ? '6px 28px 6px 10px' : '8px 32px 8px 12px',
                  color: textPrimary,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {monthNames.map((name, i) => (
                  <option
                    key={i}
                    value={i + 1}
                    style={{ background: bgSurface, color: textPrimary }}
                  >
                    {name}
                  </option>
                ))}
              </select>
              <ExpandMore
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: primaryColor,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Month headers - only show selected range */}
        <div
          style={{
            display: 'flex',
            marginBottom: 8,
            paddingLeft: isMobile ? 95 : 253,
          }}
        >
          {monthNames.slice(monthRangeStart - 1, monthRangeEnd).map((month, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                fontSize: isMobile ? 9 : 12,
                color: textSecondary,
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              {isMobile ? month.charAt(0) : month}
            </div>
          ))}
        </div>

        {/* Series rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 18 }}>
          {(showAllTimeline ? timelineSeries : timelineSeries.slice(0, 10)).map((series, index) => (
            <motion.div
              key={series.seriesId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ opacity: 0.7 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              onClick={() => navigate(`/series/${series.seriesId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 18,
                cursor: 'pointer',
                padding: isMobile ? '2px 0' : '4px 0',
              }}
            >
              {/* Poster thumbnail */}
              <div
                style={{
                  width: isMobile ? 32 : 65,
                  height: isMobile ? 48 : 97,
                  borderRadius: isMobile ? 4 : 6,
                  background: posters[series.seriesId]
                    ? `url(${TMDB_IMAGE_BASE}${posters[series.seriesId]}) center/cover`
                    : `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!posters[series.seriesId] && (
                  <Tv style={{ color: textSecondary, fontSize: isMobile ? 14 : 26 }} />
                )}
              </div>

              {/* Title & Stats */}
              <div
                style={{
                  width: isMobile ? 55 : 170,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    color: textPrimary,
                    fontSize: isMobile ? 11 : 16,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {series.title}
                </div>
                <div
                  style={{
                    color: textSecondary,
                    fontSize: isMobile ? 9 : 13,
                    marginTop: isMobile ? 2 : 4,
                  }}
                >
                  {series.episodes} Ep{!isMobile && ` · ${series.totalHours}h`}
                </div>
                <div
                  style={{
                    color: primaryColor,
                    fontSize: isMobile ? 8 : 12,
                    marginTop: isMobile ? 2 : 4,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isMobile
                    ? `${series.effectiveStart.getDate()}.${series.effectiveStart.getMonth() + 1}. – ${series.effectiveEnd.getDate()}.${series.effectiveEnd.getMonth() + 1}.`
                    : `${formatDateShort(series.effectiveStart)} – ${formatDateShort(series.effectiveEnd)}`}
                </div>
              </div>

              {/* Gantt bar area */}
              <div
                style={{
                  flex: 1,
                  height: isMobile ? 24 : 44,
                  position: 'relative',
                  background: `${textSecondary}10`,
                  borderRadius: 6,
                }}
              >
                {/* Month grid lines - based on selected range */}
                {[...Array(Math.max(monthRangeEnd - monthRangeStart, 0))].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${((i + 1) / (monthRangeEnd - monthRangeStart + 1)) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: `${textSecondary}20`,
                    }}
                  />
                ))}

                {/* The actual bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${series.startPercent}%`,
                    width: `${Math.max(series.widthPercent, 1)}%`,
                    top: 5,
                    bottom: 5,
                    background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)`,
                    borderRadius: 4,
                    minWidth: 10,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show more / Show less button */}
        {timelineSeries.length > 10 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowAllTimeline(!showAllTimeline);
            }}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '12px',
              background: `${primaryColor}15`,
              border: `1px solid ${primaryColor}30`,
              borderRadius: 10,
              color: primaryColor,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <ExpandMore
              style={{
                fontSize: 18,
                transform: showAllTimeline ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
            {showAllTimeline
              ? 'Weniger anzeigen'
              : `${timelineSeries.length - 10} weitere Serien anzeigen`}
          </motion.button>
        )}

        {timelineSeries.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: textSecondary, fontSize: 14 }}>
              Keine Serien im ausgewählten Zeitraum geschaut
            </p>
          </div>
        )}
      </motion.div>

      {/* Top Series Ranking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 20px',
          padding: '20px',
          borderRadius: '20px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Top 10 Serien
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {seriesStats.slice(0, 10).map((series, index) => (
            <motion.div
              key={series.seriesId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ opacity: 0.7 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => navigate(`/series/${series.seriesId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                borderRadius: 12,
                background: index === 0 ? `${primaryColor}15` : 'transparent',
                border: index === 0 ? `1px solid ${primaryColor}30` : 'none',
                cursor: 'pointer',
              }}
            >
              {/* Poster thumbnail */}
              <div
                style={{
                  width: 50,
                  height: 75,
                  borderRadius: 8,
                  background: posters[series.seriesId]
                    ? `url(${TMDB_IMAGE_BASE}${posters[series.seriesId]}) center/cover`
                    : `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!posters[series.seriesId] && <Tv style={{ color: textSecondary, fontSize: 20 }} />}
              </div>

              {/* Rank */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background:
                    index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : `${textSecondary}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: index < 3 ? '#1a1a2e' : textSecondary,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: textPrimary,
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {series.title}
                </div>
                <div style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
                  {formatDate(series.firstWatched)} – {formatDate(series.lastWatched)}
                  {series.rewatchEpisodes > 0 && (
                    <span style={{ color: '#a29bfe' }}> · {series.rewatchEpisodes}× Rewatch</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: primaryColor, fontSize: 16, fontWeight: 700 }}>
                  {series.episodes}
                </div>
                <div style={{ color: textSecondary, fontSize: 11 }}>
                  {Math.round(series.minutes / 60)}h
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ============================================================================
// INSIGHTS TAB - Binge, Rewatch, Runtime Statistiken
// ============================================================================

interface InsightsTabProps {
  data: WatchJourneyData;
}

const InsightsTab: React.FC<InsightsTabProps> = ({ data }) => {
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;

  // Runtime distribution for histogram
  const runtimeDistribution = useMemo(() => {
    const buckets = [
      { label: '< 30', min: 0, max: 30, count: 0 },
      { label: '30-45', min: 30, max: 45, count: 0 },
      { label: '45-60', min: 45, max: 60, count: 0 },
      { label: '60-90', min: 60, max: 90, count: 0 },
      { label: '> 90', min: 90, max: Infinity, count: 0 },
    ];

    data.seriesStats.forEach((series) => {
      const bucket = buckets.find((b) => series.avgRuntime >= b.min && series.avgRuntime < b.max);
      if (bucket) bucket.count += series.episodes;
    });

    const maxCount = Math.max(...buckets.map((b) => b.count));
    return buckets.map((b) => ({
      ...b,
      percentage: maxCount > 0 ? (b.count / maxCount) * 100 : 0,
    }));
  }, [data.seriesStats]);

  // Top rewatched series
  const topRewatched = useMemo(() => {
    return [...data.seriesStats]
      .filter((s) => s.rewatchEpisodes > 0)
      .sort((a, b) => b.rewatchEpisodes - a.rewatchEpisodes)
      .slice(0, 5);
  }, [data.seriesStats]);

  // Top binged series
  const topBinged = useMemo(() => {
    return [...data.seriesStats]
      .filter((s) => s.bingeEpisodes > 0)
      .sort((a, b) => b.bingeEpisodes - a.bingeEpisodes)
      .slice(0, 5);
  }, [data.seriesStats]);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Binge Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #e9456030, #e9456010)',
          border: '1px solid #e9456050',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: '#e94560',
            opacity: 0.15,
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <LocalFireDepartment style={{ color: '#e94560', fontSize: 32 }} />
            <div>
              <p
                style={{
                  color: textSecondary,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1,
                  margin: 0,
                }}
              >
                BINGE-STATISTIKEN
              </p>
              <h2 style={{ color: textPrimary, fontSize: 24, fontWeight: 800, margin: 0 }}>
                {data.bingeSessionCount} Sessions
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 12,
              }}
            >
              <div style={{ color: '#e94560', fontSize: 24, fontWeight: 700 }}>
                {data.bingeEpisodeCount}
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>Episoden gebinged</div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 12,
              }}
            >
              <div style={{ color: '#e94560', fontSize: 24, fontWeight: 700 }}>
                {data.avgBingeLength}
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>Ø pro Session</div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 12,
              }}
            >
              <div style={{ color: '#e94560', fontSize: 24, fontWeight: 700 }}>
                {data.longestBinge}
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>Längste Session</div>
            </div>
          </div>

          {/* Top Binged Series */}
          {topBinged.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                MEIST GEBINGED
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topBinged.map((series, index) => (
                  <div
                    key={series.seriesId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ color: '#e94560', fontWeight: 700, width: 20 }}>
                      {index + 1}
                    </span>
                    <span style={{ color: textPrimary, flex: 1, fontSize: 13 }}>
                      {series.title}
                    </span>
                    <span style={{ color: '#e94560', fontWeight: 600, fontSize: 13 }}>
                      {series.bingeEpisodes} Ep.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Rewatch Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #a29bfe30, #a29bfe10)',
          border: '1px solid #a29bfe50',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: '#a29bfe',
            opacity: 0.15,
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Replay style={{ color: '#a29bfe', fontSize: 32 }} />
            <div>
              <p
                style={{
                  color: textSecondary,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1,
                  margin: 0,
                }}
              >
                REWATCH-STATISTIKEN
              </p>
              <h2 style={{ color: textPrimary, fontSize: 24, fontWeight: 800, margin: 0 }}>
                {data.rewatchCount} Rewatches
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 12,
              }}
            >
              <div style={{ color: '#a29bfe', fontSize: 24, fontWeight: 700 }}>
                {Math.round(data.rewatchMinutes / 60)}h
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>Rewatch-Zeit</div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 12,
              }}
            >
              <div style={{ color: '#a29bfe', fontSize: 24, fontWeight: 700 }}>
                {data.rewatchPercentage}%
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>deiner Zeit</div>
            </div>
          </div>

          {/* Top Rewatched Series */}
          {topRewatched.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                COMFORT-SERIEN
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topRewatched.map((series, index) => (
                  <div
                    key={series.seriesId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ color: '#a29bfe', fontWeight: 700, width: 20 }}>
                      {index + 1}
                    </span>
                    <span style={{ color: textPrimary, flex: 1, fontSize: 13 }}>
                      {series.title}
                    </span>
                    <span style={{ color: '#a29bfe', fontWeight: 600, fontSize: 13 }}>
                      {series.rewatchEpisodes}× rewatch
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Runtime Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Timer style={{ color: '#00cec9', fontSize: 28 }} />
          <div>
            <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>
              Episodenlängen-Verteilung
            </h3>
            <p style={{ color: textSecondary, fontSize: 12, margin: 0 }}>
              Ø {data.avgEpisodeRuntime} Min · {data.shortestEpisode}–{data.longestEpisode} Min
            </p>
          </div>
        </div>

        {/* Histogram */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {runtimeDistribution.map((bucket, index) => (
            <div key={bucket.label} style={{ flex: 1, textAlign: 'center' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${bucket.percentage}%` }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                style={{
                  background: `linear-gradient(180deg, #00cec9, #00cec960)`,
                  borderRadius: '8px 8px 0 0',
                  minHeight: bucket.count > 0 ? 20 : 4,
                  marginBottom: 8,
                }}
              />
              <div style={{ color: textSecondary, fontSize: 11 }}>{bucket.label}</div>
              <div style={{ color: '#00cec9', fontSize: 12, fontWeight: 600 }}>{bucket.count}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', color: textSecondary, fontSize: 11, marginTop: 8 }}>
          Minuten pro Episode
        </div>
      </motion.div>

      {/* Personal Records */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          margin: '0 20px',
          padding: '20px',
          borderRadius: '20px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Deine Rekorde
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#fdcb6e15',
              border: '1px solid #fdcb6e30',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#fdcb6e', fontSize: 28, fontWeight: 700 }}>
              {data.totalEpisodes}
            </div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Episoden insgesamt</div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#00b89415',
              border: '1px solid #00b89430',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#00b894', fontSize: 28, fontWeight: 700 }}>
              {Math.round(data.totalMinutes / 60)}h
            </div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Watchtime</div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#667eea15',
              border: '1px solid #667eea30',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#667eea', fontSize: 28, fontWeight: 700 }}>
              {data.uniqueSeriesCount}
            </div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Verschiedene Serien</div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#e9456015',
              border: '1px solid #e9456030',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#e94560', fontSize: 28, fontWeight: 700 }}>
              {data.longestBinge}
            </div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Längste Binge-Session</div>
          </div>
        </div>
      </motion.div>
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

// ============================================================================
// MAIN PAGE
// ============================================================================

type TabType = 'genre' | 'provider' | 'heatmap' | 'activity' | 'trends' | 'serien' | 'insights';

// Available years (from 2025 to current year)
const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2026; y--) {
    years.push(y);
  }
  return years;
};

export const WatchJourneyPage: React.FC = () => {
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WatchJourneyData | null>(null);
  const [trendsData, setTrendsData] = useState<MultiYearTrendsData | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab') as TabType;
    const validTabs: TabType[] = [
      'genre',
      'provider',
      'heatmap',
      'activity',
      'trends',
      'serien',
      'insights',
    ];
    return tabParam && validTabs.includes(tabParam) ? tabParam : 'trends';
  });

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

  // Sync activeTab with URL parameters
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

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
            style={{
              color: textPrimary,
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              marginBottom: '8px',
            }}
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
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: textPrimary }}>
              Watch Journey
            </h1>
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
            <motion.div
              animate={{ rotate: showYearPicker ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
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
                      border:
                        selectedYear === year ? 'none' : `1px solid ${currentTheme.border.default}`,
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
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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
    {
      id: 'activity' as TabType,
      label: 'Aktivität',
      icon: <TrendingUp style={{ fontSize: 18 }} />,
    },
    { id: 'serien' as TabType, label: 'Serien', icon: <MovieFilter style={{ fontSize: 18 }} /> },
    { id: 'insights' as TabType, label: 'Insights', icon: <AutoGraph style={{ fontSize: 18 }} /> },
    { id: 'genre' as TabType, label: 'Genres', icon: <Category style={{ fontSize: 18 }} /> },
    {
      id: 'provider' as TabType,
      label: 'Streaming',
      icon: <Subscriptions style={{ fontSize: 18 }} />,
    },
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
            <p style={{ margin: 0, fontSize: 12, color: textSecondary, marginTop: '2px' }}>
              Deine Trends & Insights
            </p>
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
            <motion.div
              animate={{ rotate: showYearPicker ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
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
                      border:
                        selectedYear === year ? 'none' : `1px solid ${currentTheme.border.default}`,
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

        {/* Premium Tabs - Full width desktop, scrollable mobile */}
        <div
          style={{
            padding: '0 16px 24px',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 0,
              padding: 0,
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              width: '100%',
              overflow: 'hidden',
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
                    flex: '1 1 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '12px 8px',
                    borderRadius: 0,
                    border: 'none',
                    background: isActive
                      ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`
                      : 'transparent',
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? `0 2px 8px ${primaryColor}40` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.icon}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Active Tab Title */}
        <div style={{ padding: '0 16px 16px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'trends' && trendsData && (
            <motion.div
              key="trends"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TrendsTab data={trendsData} />
            </motion.div>
          )}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ActivityTab data={data} />
            </motion.div>
          )}
          {activeTab === 'serien' && (
            <motion.div
              key="serien"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SerienTab data={data} />
            </motion.div>
          )}
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InsightsTab data={data} />
            </motion.div>
          )}
          {activeTab === 'genre' && (
            <motion.div
              key="genre"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GenreTab data={data} />
            </motion.div>
          )}
          {activeTab === 'provider' && (
            <motion.div
              key="provider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProviderTab data={data} />
            </motion.div>
          )}
          {activeTab === 'heatmap' && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HeatmapTab data={data} width={chartWidth + 40} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WatchJourneyPage;
