import { Extension, Groups, Insights, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { SafeResponsiveContainer } from '../../../components/ui/SafeResponsiveContainer';
import type { useTheme } from '../../../contexts/ThemeContext';
import { KpiScorecard } from '../components/KpiScorecard';
import { LivePulse } from '../components/LivePulse';
import type { useAdminDashboardData } from '../useAdminDashboardData';

interface OverviewTabProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

const CHART_COLORS = {
  dau: '#7c6ef0',
  events: '#00cec9',
  newUsers: '#fdcb6e',
};

export const OverviewTab = React.memo<OverviewTabProps>(({ data, theme }) => {
  const cardBg = `${theme.background.surface}cc`;
  const borderColor = theme.border.default;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Realtime Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <LivePulse
          count={data.realtimeUsers.length}
          color={theme.status.success}
          textColor={theme.text.primary}
        />
        {data.realtimeUsers.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.realtimeUsers.slice(0, 5).map((u) => (
              <span
                key={u.uid}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: `${theme.background.surface}80`,
                  color: theme.text.secondary,
                }}
              >
                {u.page}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* KPI Scorecards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        <KpiScorecard
          title="DAU"
          value={data.dauToday}
          delta={data.dauDelta}
          sparklineData={data.dauSparkline}
          icon={<Groups style={{ fontSize: 18 }} />}
          color={CHART_COLORS.dau}
          theme={theme}
          delay={0}
        />
        <KpiScorecard
          title="Nutzer gesamt"
          value={data.totalUsers}
          icon={<TrendingUp style={{ fontSize: 18 }} />}
          color={CHART_COLORS.newUsers}
          theme={theme}
          delay={1}
        />
        <KpiScorecard
          title="Events heute"
          value={data.eventsToday}
          delta={data.eventsDelta}
          sparklineData={data.eventsSparkline}
          icon={<Insights style={{ fontSize: 18 }} />}
          color={CHART_COLORS.events}
          theme={theme}
          delay={2}
        />
        <KpiScorecard
          title="Extension"
          value={data.extensionUserCount}
          icon={<Extension style={{ fontSize: 18 }} />}
          color="#f093fb"
          theme={theme}
          delay={3}
        />
      </div>

      {/* DAU + Events Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: cardBg,
          backdropFilter: 'blur(28px)',
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 15,
            fontWeight: 700,
            color: theme.text.primary,
          }}
        >
          Aktivitaet (letzte 30 Tage)
        </h3>
        <SafeResponsiveContainer minWidth={0} minHeight={0} width="100%" height={260}>
          <AreaChart data={data.activityChartData}>
            <defs>
              <linearGradient id="gradDau" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.dau} stopOpacity={0.4} />
                <stop offset="100%" stopColor={CHART_COLORS.dau} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.events} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_COLORS.events} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={`${theme.text.muted}20`} />
            <XAxis
              dataKey="date"
              tick={{ fill: theme.text.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: theme.text.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: theme.text.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                background: theme.background.surface,
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                color: theme.text.primary,
                fontSize: 12,
              }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="events"
              stroke={CHART_COLORS.events}
              strokeWidth={2}
              fill="url(#gradEvents)"
              name="Events"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="dau"
              stroke={CHART_COLORS.dau}
              strokeWidth={2}
              fill="url(#gradDau)"
              name="DAU"
            />
          </AreaChart>
        </SafeResponsiveContainer>
      </motion.div>

      {/* Top Events + Top Pages */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 12,
        }}
      >
        {/* Top Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: cardBg,
            backdropFilter: 'blur(28px)',
            border: `1px solid ${borderColor}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: 15,
              fontWeight: 700,
              color: theme.text.primary,
            }}
          >
            Top Events heute
          </h3>
          <SafeResponsiveContainer
            minWidth={0}
            minHeight={0}
            width="100%"
            height={Math.max(200, data.topEvents.length * 28)}
          >
            <BarChart data={data.topEvents} layout="vertical" margin={{ left: 80 }}>
              <defs>
                <linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={theme.primary} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={CHART_COLORS.dau} stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${theme.text.muted}15`} />
              <XAxis
                type="number"
                tick={{ fill: theme.text.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: theme.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: theme.background.surface,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                  color: theme.text.primary,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="url(#gradBar)" radius={[0, 6, 6, 0]} name="Anzahl" />
            </BarChart>
          </SafeResponsiveContainer>
        </motion.div>

        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: cardBg,
            backdropFilter: 'blur(28px)',
            border: `1px solid ${borderColor}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: 15,
              fontWeight: 700,
              color: theme.text.primary,
            }}
          >
            Top Seiten heute
          </h3>
          {data.topPages.length > 0 ? (
            <SafeResponsiveContainer
              minWidth={0}
              minHeight={0}
              width="100%"
              height={Math.max(200, data.topPages.length * 32)}
            >
              <BarChart data={data.topPages} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={`${theme.text.muted}15`} />
                <XAxis
                  type="number"
                  tick={{ fill: theme.text.muted, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: theme.text.secondary, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    background: theme.background.surface,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 10,
                    color: theme.text.primary,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#00cec9" radius={[0, 6, 6, 0]} name="Aufrufe" />
              </BarChart>
            </SafeResponsiveContainer>
          ) : (
            <p style={{ color: theme.text.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>
              Keine Daten
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';
