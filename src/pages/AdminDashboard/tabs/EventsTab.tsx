import { FilterList, Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { SafeResponsiveContainer } from '../../../components/ui/SafeResponsiveContainer';
import type { useTheme } from '../../../contexts/ThemeContext';
import type { useAdminDashboardData } from '../useAdminDashboardData';

interface EventsTabProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

export const EventsTab = React.memo<EventsTabProps>(({ data, theme }) => {
  const cardBg = `${theme.background.surface}cc`;
  const borderColor = theme.border.default;
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // All unique event names across all days
  const allEventNames = useMemo(() => {
    const names = new Set<string>();
    for (const day of data.dailyStats) {
      for (const name of Object.keys(day.events)) {
        names.add(name);
      }
    }
    return Array.from(names).sort();
  }, [data.dailyStats]);

  const filteredEvents = useMemo(() => {
    if (!search) return allEventNames;
    return allEventNames.filter((n) => n.toLowerCase().includes(search.toLowerCase()));
  }, [allEventNames, search]);

  // Chart data for selected event
  const eventChartData = useMemo(() => {
    if (!selectedEvent) return [];
    return data.dailyStats
      .slice(0, 30)
      .map((d) => ({
        date: d.date.slice(5),
        count: (d.events[selectedEvent] as number) || 0,
      }))
      .reverse();
  }, [selectedEvent, data.dailyStats]);

  // Total for selected event
  const eventTotal = useMemo(() => {
    if (!selectedEvent) return 0;
    return data.dailyStats.reduce((sum, d) => sum + ((d.events[selectedEvent] as number) || 0), 0);
  }, [selectedEvent, data.dailyStats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Event Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: cardBg,
          backdropFilter: 'blur(28px)',
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <FilterList style={{ fontSize: 18, color: theme.primary }} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.text.primary }}>
            Event Explorer
          </h3>
          <span style={{ fontSize: 12, color: theme.text.muted, marginLeft: 'auto' }}>
            {allEventNames.length} Events
          </span>
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 10,
            background: `${theme.background.default}80`,
            border: `1px solid ${borderColor}`,
            marginBottom: 12,
          }}
        >
          <Search style={{ fontSize: 16, color: theme.text.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Event suchen..."
            style={{
              border: 'none',
              background: 'transparent',
              color: theme.text.primary,
              fontSize: 13,
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        {/* Event pills */}
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 200, overflowY: 'auto' }}
        >
          {filteredEvents.map((name) => {
            const isSelected = selectedEvent === name;
            const todayCount = (data.dailyStats[0]?.events[name] as number) || 0;
            return (
              <button
                key={name}
                onClick={() => setSelectedEvent(isSelected ? null : name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: `1px solid ${isSelected ? theme.primary : borderColor}`,
                  background: isSelected ? `${theme.primary}20` : 'transparent',
                  color: isSelected ? theme.primary : theme.text.secondary,
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {name}
                {todayCount > 0 && (
                  <span
                    style={{
                      padding: '0 5px',
                      borderRadius: 4,
                      background: `${theme.primary}20`,
                      color: theme.primary,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {todayCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Event chart */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: cardBg,
            backdropFilter: 'blur(28px)',
            border: `1px solid ${borderColor}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.text.primary }}>
              {selectedEvent}
            </h3>
            <span style={{ fontSize: 13, color: theme.text.muted }}>
              Gesamt (30d): <strong style={{ color: theme.primary }}>{eventTotal}</strong>
            </span>
          </div>

          <SafeResponsiveContainer minWidth={0} minHeight={0} width="100%" height={220}>
            <AreaChart data={eventChartData}>
              <defs>
                <linearGradient id="gradEvent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.primary} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${theme.text.muted}15`} />
              <XAxis
                dataKey="date"
                tick={{ fill: theme.text.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: theme.text.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={30}
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
              <Area
                type="monotone"
                dataKey="count"
                stroke={theme.primary}
                strokeWidth={2}
                fill="url(#gradEvent)"
                name="Anzahl"
              />
            </AreaChart>
          </SafeResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
});

EventsTab.displayName = 'EventsTab';
