import { FiberManualRecord, Person } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { Pie, PieChart, Tooltip } from 'recharts';
import { SafeResponsiveContainer } from '../../../components/ui/SafeResponsiveContainer';
import type { useTheme } from '../../../contexts/ThemeContext';
import type { useAdminDashboardData } from '../useAdminDashboardData';

interface RealtimeTabProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `seit ${mins}m`;
  return `seit ${Math.floor(mins / 60)}h`;
}

const PAGE_COLORS: Record<string, string> = {
  home: '#7c6ef0',
  series_detail: '#00cec9',
  watch_next: '#f093fb',
  ratings: '#fdcb6e',
  discover: '#00b894',
  profile: '#ff6b6b',
  stats: '#6c5ce7',
  settings: '#a29bfe',
};

export const RealtimeTab = React.memo<RealtimeTabProps>(({ data, theme }) => {
  const borderColor = theme.border.default;
  // Die "online seit"-Angaben rechnen gegen die aktuelle Uhrzeit und muessen
  // deshalb regelmaessig neu gerendert werden. Der Zaehlerwert selbst wird
  // nirgends gelesen — er dient nur als Ausloeser.
  const [, zeitangabenAktualisieren] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => zeitangabenAktualisieren((n) => n + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  // Page distribution
  const pageDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of data.realtimeUsers) {
      const page = u.page.replace(/^\//, '') || 'home';
      counts[page] = (counts[page] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        fill: PAGE_COLORS[name] || `hsl(${(name.length * 47) % 360}, 60%, 60%)`,
      }));
  }, [data.realtimeUsers]);

  return (
    <div className="adm-stack">
      {/* Big counter */}
      <motion.div
        className="adm-hero"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="adm-hero__ring">
          <motion.div
            className="adm-hero__value"
            key={data.realtimeUsers.length}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {data.realtimeUsers.length}
          </motion.div>
        </div>
        <p className="adm-hero__label">
          {data.realtimeUsers.length === 1 ? 'User' : 'Users'} jetzt aktiv
        </p>
      </motion.div>

      <div className="adm-grid">
        {/* Active users list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="adm-card"
        >
          <h3 className="adm-card__title">Aktive User</h3>
          <AnimatePresence mode="popLayout">
            {data.realtimeUsers.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: theme.text.muted, fontSize: 13 }}
              >
                Niemand online
              </motion.p>
            ) : (
              data.realtimeUsers.map((u) => (
                <motion.div
                  key={u.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 10,
                    marginBottom: 6,
                    background: `${theme.background.default}40`,
                  }}
                >
                  <FiberManualRecord style={{ fontSize: 8, color: theme.status.success }} />
                  {data.userProfiles[u.uid]?.photoURL ? (
                    <img
                      src={data.userProfiles[u.uid].photoURL}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Person style={{ fontSize: 20, color: theme.text.muted }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.text.primary }}>
                      {data.userProfiles[u.uid]?.displayName || u.uid.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: 11, color: theme.text.muted }}>
                      /{u.page} &middot; {timeAgo(u.since)}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Page distribution donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="adm-card"
        >
          <h3 className="adm-card__title">Seiten-Verteilung</h3>
          {pageDistribution.length > 0 ? (
            <SafeResponsiveContainer minWidth={0} minHeight={0} width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
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
              </PieChart>
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

RealtimeTab.displayName = 'RealtimeTab';
