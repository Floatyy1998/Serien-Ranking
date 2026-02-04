import { Subscriptions } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { normalizeMonthlyData, WatchJourneyData } from '../../services/watchJourneyService';
import { CustomTooltip } from './CustomTooltip';

interface ProviderTabProps {
  data: WatchJourneyData;
}

export const ProviderTab: React.FC<ProviderTabProps> = ({ data }) => {
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
