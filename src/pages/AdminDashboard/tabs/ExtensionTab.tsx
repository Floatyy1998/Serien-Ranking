import { Devices, PlayArrow, StopCircle, Timer, TrendingUp, Visibility } from '@mui/icons-material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { useTheme } from '../../../contexts/ThemeContext';
import { KpiScorecard } from '../components/KpiScorecard';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import { ExtensionCharts } from './ExtensionCharts';
import { ExtensionSessionsList } from './ExtensionSessionsList';

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
        fill: platformColor(name),
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

      <ExtensionCharts
        platformPieData={extData.platformPieData}
        seriesBarData={extData.seriesBarData}
        hourlyData={extData.hourlyData}
        cardBg={cardBg}
        borderColor={borderColor}
        theme={theme}
      />

      <ExtensionSessionsList
        sessions={extData.sessions}
        userProfiles={data.userProfiles}
        cardBg={cardBg}
        borderColor={borderColor}
        theme={theme}
      />
    </div>
  );
});

ExtensionTab.displayName = 'ExtensionTab';
