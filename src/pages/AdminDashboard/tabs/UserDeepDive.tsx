import { Close, LiveTv, Star } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { SafeResponsiveContainer } from '../../../components/ui/SafeResponsiveContainer';
import type { useTheme } from '../../../contexts/ThemeContext';
import { MetricCard } from '../components/MetricCard';
import type { useAdminDashboardData } from '../useAdminDashboardData';

interface RawEvent {
  e: string;
  p?: Record<string, unknown>;
  t: number;
}

interface UserDeepDiveProps {
  selectedUser: string;
  userEvents: RawEvent[];
  loadingUser: boolean;
  userProfiles: ReturnType<typeof useAdminDashboardData>['userProfiles'];
  theme: ReturnType<typeof useTheme>['currentTheme'];
  onClose: () => void;
}

const GENRE_COLORS = [
  '#7c6ef0',
  '#00cec9',
  '#f093fb',
  '#fdcb6e',
  '#00b894',
  '#ff6b6b',
  '#a29bfe',
  '#6c5ce7',
];

export const UserDeepDive = React.memo<UserDeepDiveProps>(
  ({ selectedUser, userEvents, loadingUser, userProfiles, theme, onClose }) => {
    const userAnalysis = useMemo(() => {
      if (userEvents.length === 0) return null;

      const seriesWatched: Record<
        string,
        { count: number; rewatches: number; seasons: Set<string> }
      > = {};
      const ratings: Array<{ rating: number; type: string; time: number }> = [];
      const genres: Record<string, number> = {};
      const seriesAdded: string[] = [];
      const seriesDeleted: string[] = [];
      let totalEpisodes = 0;
      let rewatchEpisodes = 0;

      userEvents.forEach((ev) => {
        if (ev.e === 'episode_watched' && ev.p?.series_name) {
          const name = String(ev.p.series_name);
          if (!seriesWatched[name]) {
            seriesWatched[name] = { count: 0, rewatches: 0, seasons: new Set() };
          }
          seriesWatched[name].count++;
          seriesWatched[name].seasons.add(String(ev.p.season || '?'));
          totalEpisodes++;
          if (String(ev.p.is_rewatch) === 'true') {
            seriesWatched[name].rewatches++;
            rewatchEpisodes++;
          }
          if (ev.p.genres) {
            String(ev.p.genres)
              .split(',')
              .forEach((g) => {
                const genre = g.trim();
                if (genre) genres[genre] = (genres[genre] || 0) + 1;
              });
          }
        }
        if (ev.e === 'rating_saved' && ev.p?.rating) {
          ratings.push({
            rating: Number(ev.p.rating),
            type: String(ev.p.item_type || ''),
            time: ev.t,
          });
        }
        if (ev.e === 'series_added' && ev.p?.series_name) {
          seriesAdded.push(String(ev.p.series_name));
        }
        if (ev.e === 'series_deleted' && ev.p?.series_name) {
          seriesDeleted.push(String(ev.p.series_name));
        }
      });

      const topSeries = Object.entries(seriesWatched)
        .map(([name, info]) => ({
          name,
          count: info.count,
          rewatches: info.rewatches,
          seasons: info.seasons.size,
        }))
        .sort((a, b) => b.count - a.count);

      const genreData = Object.entries(genres)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
        .map((item, i) => ({ ...item, fill: GENRE_COLORS[i % GENRE_COLORS.length] }));

      // Activity by hour
      const hourActivity = Array(24).fill(0) as number[];
      userEvents.forEach((ev) => {
        const hour = new Date(ev.t).getHours();
        hourActivity[hour]++;
      });
      const peakHour = hourActivity.indexOf(Math.max(...hourActivity));

      return {
        totalEvents: userEvents.length,
        totalEpisodes,
        rewatchEpisodes,
        topSeries,
        ratings,
        genreData,
        seriesAdded,
        seriesDeleted,
        hourActivity: hourActivity.map((count, hour) => ({
          hour: `${hour}h`,
          count,
          fill: hour === peakHour ? '#ff6b6b' : undefined,
          fillOpacity: hour === peakHour ? 1 : 0.6,
        })),
        peakHour,
      };
    }, [userEvents]);

    const formatTime = (ts: number) =>
      new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    return (
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 12,
                background: theme.background.surface,
                border: `1px solid ${theme.border.default}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {userProfiles[selectedUser]?.photoURL ? (
                  <img
                    src={userProfiles[selectedUser].photoURL}
                    alt=""
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : null}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: theme.text.primary }}>
                    {userProfiles[selectedUser]?.displayName ||
                      userProfiles[selectedUser]?.username ||
                      (selectedUser === 'undefined'
                        ? 'Unbekannt (Extension)'
                        : selectedUser.slice(0, 8))}
                  </div>
                  <div style={{ fontSize: 11, color: theme.text.muted }}>Deep-Dive — heute</div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.text.muted,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <Close style={{ fontSize: 20 }} />
              </button>
            </div>

            {loadingUser ? (
              <div style={{ textAlign: 'center', padding: 30, color: theme.text.muted }}>
                Lade User-Daten...
              </div>
            ) : !userAnalysis ? (
              <div style={{ textAlign: 'center', padding: 30, color: theme.text.muted }}>
                Keine Events heute
              </div>
            ) : (
              <>
                {/* Quick Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: 8,
                  }}
                >
                  {[
                    { label: 'Events', value: userAnalysis.totalEvents, color: theme.primary },
                    { label: 'Episoden', value: userAnalysis.totalEpisodes, color: '#00cec9' },
                    { label: 'Ratings', value: userAnalysis.ratings.length, color: '#fdcb6e' },
                    {
                      label: 'Hinzugefuegt',
                      value: userAnalysis.seriesAdded.length,
                      color: '#00b894',
                    },
                    {
                      label: 'Geloescht',
                      value: userAnalysis.seriesDeleted.length,
                      color: '#ff6b6b',
                    },
                    {
                      label: 'Peak',
                      value: `${userAnalysis.peakHour}h`,
                      color: '#7c6ef0',
                      isString: true,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        textAlign: 'center',
                        padding: '10px 8px',
                        borderRadius: 10,
                        background: `${s.color}10`,
                        border: `1px solid ${s.color}20`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: s.color,
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {'isString' in s ? s.value : s.value}
                      </div>
                      <div style={{ fontSize: 10, color: theme.text.muted, fontWeight: 600 }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Series watched + Genres */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 12,
                  }}
                >
                  {/* What they watched */}
                  {userAnalysis.topSeries.length > 0 && (
                    <MetricCard
                      title="Geschaute Serien"
                      theme={theme}
                      icon={<LiveTv style={{ fontSize: 14, color: '#00cec9' }} />}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          maxHeight: 250,
                          overflowY: 'auto',
                        }}
                      >
                        {userAnalysis.topSeries.map((s) => (
                          <div
                            key={s.name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '5px 10px',
                              borderRadius: 8,
                              background: `${theme.background.default}40`,
                              fontSize: 12,
                            }}
                          >
                            <span
                              style={{
                                flex: 1,
                                fontWeight: 600,
                                color: theme.text.primary,
                              }}
                            >
                              {s.name}
                            </span>
                            <span style={{ color: theme.text.muted }}>
                              {s.count} Ep. · {s.seasons} St.
                            </span>
                            {s.rewatches > 0 && (
                              <span
                                style={{
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  background: '#f093fb20',
                                  color: '#f093fb',
                                  fontSize: 9,
                                  fontWeight: 700,
                                }}
                              >
                                {s.rewatches} RW
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </MetricCard>
                  )}

                  {/* Genre preferences */}
                  {userAnalysis.genreData.length > 0 && (
                    <MetricCard
                      title="Genre-Vorlieben"
                      theme={theme}
                      icon={<Star style={{ fontSize: 14, color: '#fdcb6e' }} />}
                    >
                      <SafeResponsiveContainer minWidth={0} minHeight={0} width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={userAnalysis.genreData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                            stroke="transparent"
                          />
                          <Tooltip
                            contentStyle={{
                              background: theme.background.surface,
                              border: `1px solid ${theme.border.default}`,
                              borderRadius: 10,
                              color: theme.text.primary,
                              fontSize: 12,
                            }}
                          />
                        </PieChart>
                      </SafeResponsiveContainer>
                    </MetricCard>
                  )}
                </div>

                {/* Activity by hour */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 12,
                  }}
                >
                  <MetricCard title="Aktivität nach Uhrzeit" theme={theme}>
                    <SafeResponsiveContainer minWidth={0} minHeight={0} width="100%" height={150}>
                      <BarChart data={userAnalysis.hourActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke={`${theme.text.muted}15`} />
                        <XAxis
                          dataKey="hour"
                          tick={{ fill: theme.text.muted, fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          interval={3}
                        />
                        <YAxis
                          tick={{ fill: theme.text.muted, fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          width={20}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: theme.background.surface,
                            border: `1px solid ${theme.border.default}`,
                            borderRadius: 10,
                            color: theme.text.primary,
                            fontSize: 12,
                          }}
                        />
                        <Bar
                          dataKey="count"
                          radius={[3, 3, 0, 0]}
                          name="Events"
                          fill={theme.primary}
                        />
                      </BarChart>
                    </SafeResponsiveContainer>
                  </MetricCard>
                </div>

                {/* Raw event log */}
                <MetricCard
                  title={`Event-Log (${userEvents.length})`}
                  theme={theme}
                  headerRight={
                    <span style={{ fontSize: 11, color: theme.text.muted }}>Mit Parametern</span>
                  }
                >
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {userEvents.slice(0, 100).map((ev, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 8,
                          padding: '5px 0',
                          borderBottom: `1px solid ${theme.border.default}20`,
                          fontSize: 11,
                          alignItems: 'flex-start',
                        }}
                      >
                        <span
                          style={{
                            color: theme.text.muted,
                            fontSize: 10,
                            width: 50,
                            flexShrink: 0,
                          }}
                        >
                          {formatTime(ev.t)}
                        </span>
                        <span
                          style={{
                            color: theme.primary,
                            fontWeight: 600,
                            width: 130,
                            flexShrink: 0,
                          }}
                        >
                          {ev.e}
                        </span>
                        <span
                          style={{
                            color: theme.text.muted,
                            fontSize: 10,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ev.p
                            ? Object.entries(ev.p)
                                .filter(([, v]) => v)
                                .map(([k, v]) => `${k}=${v}`)
                                .join(' · ')
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </MetricCard>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

UserDeepDive.displayName = 'UserDeepDive';
