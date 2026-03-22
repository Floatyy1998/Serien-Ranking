import { motion } from 'framer-motion';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { useTheme } from '../../../contexts/ThemeContext';

interface PlatformPieItem {
  name: string;
  value: number;
  color: string;
  fill: string;
}

interface SeriesBarItem {
  name: string;
  count: number;
}

interface HourlyItem {
  hour: string;
  count: number;
}

interface ExtensionChartsProps {
  platformPieData: PlatformPieItem[];
  seriesBarData: SeriesBarItem[];
  hourlyData: HourlyItem[];
  cardBg: string;
  borderColor: string;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

export const ExtensionCharts = React.memo<ExtensionChartsProps>(
  ({ platformPieData, seriesBarData, hourlyData, cardBg, borderColor, theme }) => {
    return (
      <>
        {/* Charts Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 12,
          }}
        >
          {/* Platform Distribution */}
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
              Plattform-Verteilung
            </h3>
            {platformPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={platformPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    stroke="transparent"
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
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: theme.text.secondary, fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: theme.text.muted, textAlign: 'center', padding: 40 }}>
                Keine Daten
              </p>
            )}
          </motion.div>

          {/* Series watched */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
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
              Geschaute Serien (Extension)
            </h3>
            {seriesBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={seriesBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={`${theme.text.muted}15`} />
                  <XAxis
                    type="number"
                    tick={{ fill: theme.text.muted, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: theme.text.secondary, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
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
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Sessions" fill="#00cec9" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: theme.text.muted, textAlign: 'center', padding: 40 }}>
                Keine Daten
              </p>
            )}
          </motion.div>
        </div>

        {/* Hourly Distribution */}
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
            Extension-Aktivität nach Uhrzeit
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${theme.text.muted}15`} />
              <XAxis
                dataKey="hour"
                tick={{ fill: theme.text.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fill: theme.text.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={25}
                allowDecimals={false}
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
              <Bar
                dataKey="count"
                radius={[3, 3, 0, 0]}
                name="Events"
                fill="#f093fb"
                fillOpacity={0.7}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </>
    );
  }
);

ExtensionCharts.displayName = 'ExtensionCharts';
