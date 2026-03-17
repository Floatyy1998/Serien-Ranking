import { Devices, PlayArrow, StopCircle, Timer, TrendingUp, Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import type { useTheme } from '../../../contexts/ThemeContext';
import { KpiScorecard } from '../components/KpiScorecard';
import type { useAdminDashboardData } from '../useAdminDashboardData';

interface ExtensionTabProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

interface RawEvent {
  e: string;
  p?: Record<string, unknown>;
  t: number;
  uid: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  netflix: '#e50914',
  disneyplus: '#113ccf',
  disney: '#113ccf',
  prime: '#00a8e1',
  joyn: '#1eff00',
  paramount: '#0064ff',
  appletv: '#000000',
  crunchyroll: '#f47521',
  wow: '#6b2fa0',
  hbomax: '#b53dd1',
  adn: '#005599',
  unknown: '#666',
};

function platformColor(name: string): string {
  const lower = name.toLowerCase();
  return PLATFORM_COLORS[lower] || PLATFORM_COLORS.unknown;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ExtensionTab = React.memo<ExtensionTabProps>(({ data, theme }) => {
  const cardBg = `${theme.background.surface}cc`;
  const borderColor = theme.border.default;
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const events = await data.loadAllRawEvents();
    setRawEvents(events);
    setLoading(false);
  }, [data]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Parse extension events from raw events
  const extData = useMemo(() => {
    const extEvents = rawEvents.filter((ev) => ev.e.startsWith('ext_'));

    // Sessions: group by uid + session start
    const sessions: Array<{
      uid: string;
      platform: string;
      seriesName: string;
      season: number;
      episode: number;
      startTime: number;
      endTime: number;
      durationSec: number;
      progressPercent: number;
      abandoned: boolean;
      milestones: number[];
    }> = [];

    // Group events by uid
    const byUser: Record<string, RawEvent[]> = {};
    extEvents.forEach((ev) => {
      if (!byUser[ev.uid]) byUser[ev.uid] = [];
      byUser[ev.uid].push(ev);
    });

    // Platform visits
    const platformVisits: Record<string, number> = {};
    // Series watched via extension
    const seriesWatched: Record<string, number> = {};
    // Users using extension
    const extUserIds = new Set<string>();

    let totalWatchDuration = 0;
    let abandonedCount = 0;
    let sessionStartCount = 0;

    for (const [uid, events] of Object.entries(byUser)) {
      extUserIds.add(uid);

      // Find session_started events and match with progress/abandoned
      const sessionStarts = events.filter((e) => e.e === 'ext_watch_session_started');
      const progresses = events.filter((e) => e.e === 'ext_watch_progress');
      const abandons = events.filter((e) => e.e === 'ext_watch_abandoned');
      const visits = events.filter((e) => e.e === 'ext_platform_visited');

      visits.forEach((v) => {
        const p = String(v.p?.platform || 'unknown');
        platformVisits[p] = (platformVisits[p] || 0) + 1;
      });

      sessionStarts.forEach((ss) => {
        sessionStartCount++;
        const platform = String(ss.p?.platform || 'unknown');
        const seriesName = String(ss.p?.series_name || 'Unbekannt');
        const season = Number(ss.p?.season || 0);
        const episode = Number(ss.p?.episode || 0);

        if (seriesName !== 'Unbekannt') {
          seriesWatched[seriesName] = (seriesWatched[seriesName] || 0) + 1;
        }

        // Find matching abandon event (same series, same episode, after start)
        const matchingAbandon = abandons.find(
          (a) =>
            String(a.p?.series_name) === seriesName &&
            Number(a.p?.episode) === episode &&
            a.t >= ss.t
        );

        // Find matching progress events
        const matchingProgress = progresses
          .filter(
            (p) =>
              String(p.p?.series_name) === seriesName &&
              Number(p.p?.episode) === episode &&
              p.t >= ss.t
          )
          .map((p) => Number(p.p?.milestone || 0));

        const durationSec = matchingAbandon
          ? Number(matchingAbandon.p?.watch_duration_sec || 0)
          : 0;
        totalWatchDuration += durationSec;

        if (matchingAbandon) abandonedCount++;

        sessions.push({
          uid,
          platform,
          seriesName,
          season,
          episode,
          startTime: ss.t,
          endTime: matchingAbandon?.t || ss.t,
          durationSec,
          progressPercent: matchingAbandon
            ? Number(matchingAbandon.p?.progress_percent || 0)
            : matchingProgress.length > 0
              ? Math.max(...matchingProgress)
              : 0,
          abandoned: !!matchingAbandon,
          milestones: matchingProgress.sort((a, b) => a - b),
        });
      });
    }

    // Platform distribution (from sessions + visits)
    const platformFromSessions: Record<string, number> = {};
    sessions.forEach((s) => {
      platformFromSessions[s.platform] = (platformFromSessions[s.platform] || 0) + 1;
    });

    // Merge platform data
    const allPlatforms = new Set([
      ...Object.keys(platformVisits),
      ...Object.keys(platformFromSessions),
    ]);
    const platformPieData = Array.from(allPlatforms)
      .map((name) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: (platformFromSessions[name] || 0) + (platformVisits[name] || 0),
        color: platformColor(name),
      }))
      .sort((a, b) => b.value - a.value);

    // Series bar chart
    const seriesBarData = Object.entries(seriesWatched)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly distribution
    const hourly = Array(24).fill(0) as number[];
    extEvents.forEach((ev) => {
      const hour = new Date(ev.t).getHours();
      hourly[hour]++;
    });
    const hourlyData = hourly.map((count, hour) => ({ hour: `${hour}h`, count }));

    const avgWatchDuration =
      sessions.length > 0 ? Math.round(totalWatchDuration / sessions.length) : 0;
    const completionRate =
      sessions.length > 0
        ? Math.round(((sessions.length - abandonedCount) / sessions.length) * 100)
        : 0;

    return {
      extUserCount: extUserIds.size,
      totalSessions: sessionStartCount,
      totalExtEvents: extEvents.length,
      abandonedCount,
      completionRate,
      avgWatchDuration,
      totalWatchDuration,
      platformPieData,
      seriesBarData,
      hourlyData,
      sessions: sessions.sort((a, b) => b.startTime - a.startTime),
    };
  }, [rawEvents]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: theme.text.muted }}>
        Lade Extension-Daten...
      </div>
    );
  }

  if (extData.totalExtEvents === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: theme.text.muted, fontSize: 14 }}>
        Keine Extension-Events heute
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI Scorecards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        <KpiScorecard
          title="Extension User"
          value={extData.extUserCount}
          icon={<Devices style={{ fontSize: 18 }} />}
          color="#f093fb"
          theme={theme}
          delay={0}
        />
        <KpiScorecard
          title="Sessions"
          value={extData.totalSessions}
          icon={<PlayArrow style={{ fontSize: 18 }} />}
          color="#00cec9"
          theme={theme}
          delay={1}
        />
        <KpiScorecard
          title="Abgebrochen"
          value={extData.abandonedCount}
          icon={<StopCircle style={{ fontSize: 18 }} />}
          color="#ff6b6b"
          theme={theme}
          delay={2}
        />
        <KpiScorecard
          title="Avg. Dauer"
          value={Math.round(extData.avgWatchDuration / 60)}
          suffix=" min"
          icon={<Timer style={{ fontSize: 18 }} />}
          color="#fdcb6e"
          theme={theme}
          delay={3}
        />
        <KpiScorecard
          title="Ext Events"
          value={extData.totalExtEvents}
          icon={<TrendingUp style={{ fontSize: 18 }} />}
          color="#7c6ef0"
          theme={theme}
          delay={4}
        />
        <KpiScorecard
          title="Gesamt-Watch"
          value={Math.round(extData.totalWatchDuration / 60)}
          suffix=" min"
          icon={<Visibility style={{ fontSize: 18 }} />}
          color="#00b894"
          theme={theme}
          delay={5}
        />
      </div>

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
          {extData.platformPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={extData.platformPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {extData.platformPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
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
            <p style={{ color: theme.text.muted, textAlign: 'center', padding: 40 }}>Keine Daten</p>
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
          {extData.seriesBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={extData.seriesBarData} layout="vertical">
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
            <p style={{ color: theme.text.muted, textAlign: 'center', padding: 40 }}>Keine Daten</p>
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
          <BarChart data={extData.hourlyData}>
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

      {/* Sessions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
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
          Sessions ({extData.sessions.length})
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {extData.sessions.map((s, i) => {
            const userName =
              data.userProfiles[s.uid]?.displayName ||
              data.userProfiles[s.uid]?.username ||
              (s.uid === 'undefined' ? 'Unbekannt' : s.uid.slice(0, 8));
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: `${theme.background.default}50`,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    color: theme.text.muted,
                    fontSize: 10,
                    width: 40,
                    flexShrink: 0,
                  }}
                >
                  {formatTime(s.startTime)}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: `${platformColor(s.platform)}30`,
                    color: platformColor(s.platform),
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: 'capitalize',
                    flexShrink: 0,
                  }}
                >
                  {s.platform}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: theme.text.primary,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.seriesName}
                </span>
                <span style={{ color: theme.text.muted, flexShrink: 0 }}>
                  S{s.season}E{s.episode}
                </span>
                {s.durationSec > 0 && (
                  <span style={{ color: theme.text.muted, flexShrink: 0 }}>
                    {formatDuration(s.durationSec)}
                  </span>
                )}
                {s.progressPercent > 0 && (
                  <div
                    style={{
                      width: 50,
                      height: 6,
                      borderRadius: 3,
                      background: `${theme.text.muted}20`,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(s.progressPercent, 100)}%`,
                        height: '100%',
                        borderRadius: 3,
                        background:
                          s.progressPercent > 80
                            ? '#00b894'
                            : s.progressPercent > 40
                              ? '#fdcb6e'
                              : '#ff6b6b',
                      }}
                    />
                  </div>
                )}
                {s.abandoned && (
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: `${theme.status.error}20`,
                      color: theme.status.error,
                      fontSize: 9,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ABBRUCH
                  </span>
                )}
                <span
                  style={{
                    color: theme.text.muted,
                    fontSize: 10,
                    flexShrink: 0,
                  }}
                >
                  {userName}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
});

ExtensionTab.displayName = 'ExtensionTab';
