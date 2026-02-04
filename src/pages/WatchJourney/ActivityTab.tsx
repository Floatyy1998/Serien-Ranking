import {
  AccessTime,
  LocalFireDepartment,
  LocalMovies,
  Schedule,
  TrendingUp,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { WatchJourneyData } from '../../services/watchJourneyService';
import { ActivityTooltip } from './ActivityTooltip';

interface ActivityTabProps {
  data: WatchJourneyData;
}

// Accent Farben für Abwechslung
export const ACCENT_COLORS = {
  episodes: '#667eea', // Lila für Episoden
  movies: '#f093fb', // Pink für Filme
  time: '#00cec9', // Cyan für Zeit
  fire: '#fdcb6e', // Gold für Highlights
  trending: '#00b894', // Grün für Trends
};

export const ActivityTab: React.FC<ActivityTabProps> = ({ data }) => {
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
