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
    <div className="adm-stack">
      {/* Event Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="adm-card"
      >
        <div className="adm-card__head">
          <h3 className="adm-card__title">
            <FilterList style={{ fontSize: 18 }} />
            Event Explorer
          </h3>
          <span className="adm-card__meta">{allEventNames.length} Events</span>
        </div>

        <div className="adm-search">
          <Search style={{ fontSize: 16 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Event suchen..."
          />
        </div>

        <div className="adm-chips adm-chips--scroll">
          {filteredEvents.map((name) => {
            const isSelected = selectedEvent === name;
            const todayCount = (data.dailyStats[0]?.events[name] as number) || 0;
            return (
              <button
                key={name}
                className={`adm-chip ${isSelected ? 'adm-chip--on' : ''}`}
                onClick={() => setSelectedEvent(isSelected ? null : name)}
              >
                {name}
                {todayCount > 0 && <span className="adm-chip__count">{todayCount}</span>}
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
          className="adm-card"
        >
          <div className="adm-card__head">
            <h3 className="adm-card__title">{selectedEvent}</h3>
            <span className="adm-card__meta">
              Gesamt (30d): <strong>{eventTotal}</strong>
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
