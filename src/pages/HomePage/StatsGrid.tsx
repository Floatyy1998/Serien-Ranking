import {
  Category,
  ExpandLess,
  ExpandMore,
  Movie,
  Star,
  Stream,
  Timer,
  TrendingUp,
  Tv,
} from '@mui/icons-material';
import { Box, Collapse, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { useTheme } from '../../contexts/ThemeContext';
import { colors } from '../../theme';
import { StatCard } from './StatCard';
import { useHomeStats } from './useHomeStats';

export const StatsGrid = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const stats = useHomeStats();

  // Navigation handlers
  const handleSeriesClick = () => {
    navigate('/ratings'); // Default to series tab
  };

  const handleMoviesClick = () => {
    navigate('/ratings?tab=movies'); // Only this one goes to movies tab
  };

  const handleSeriesRatingClick = () => {
    navigate('/ratings'); // Default to series tab
  };

  const handleMovieRatingClick = () => {
    navigate('/ratings'); // Also default to series tab
  };

  const handleWeeklyEpisodesClick = () => {
    navigate('/watchlist');
  };

  const progressPct =
    stats.totalEpisodes > 0 ? Math.round((stats.watchedEpisodes / stats.totalEpisodes) * 100) : 0;

  // Circular ring SVG params
  const ringSize = 80;
  const ringStroke = 5;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = ringRadius * 2 * Math.PI;
  const ringOffset = ringCircumference - (progressPct / 100) * ringCircumference;

  return (
    <Box>
      {/* Header with expand button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: currentTheme.text.secondary,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}
        >
          Deine Statistiken
        </Typography>

        <Tooltip title={expanded ? 'Weniger anzeigen' : 'Mehr anzeigen'} arrow>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{
              color: currentTheme.text.muted,
              padding: '4px',
            }}
          >
            {expanded ? <ExpandLess sx={{ fontSize: 20 }} /> : <ExpandMore sx={{ fontSize: 20 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bento Grid: Progress Ring (2 rows left) + Stat Tiles (right) */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: '12px',
          marginBottom: expanded ? '12px' : 0,
        }}
      >
        {/* Progress Ring - spans 2 rows on left */}
        <motion.div variants={staggerItem} style={{ gridRow: '1 / 3' }}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '10%',
                height: '1px',
                background:
                  'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                pointerEvents: 'none',
              },
            }}
          >
            {/* Circular Progress Ring */}
            <Box sx={{ position: 'relative', width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize}>
                <defs>
                  <linearGradient id="stats-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={currentTheme.primary || colors.primary} />
                    <stop offset="35%" stopColor={currentTheme.accent || colors.primary} />
                    <stop offset="65%" stopColor={currentTheme.status?.warning || '#f59e0b'} />
                    <stop
                      offset="100%"
                      stopColor={currentTheme.status?.success || colors.status.success}
                    />
                  </linearGradient>
                </defs>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth={ringStroke}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="url(#stats-ring-grad)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    background: `linear-gradient(135deg, ${currentTheme.primary || colors.primary}, ${currentTheme.accent || colors.primary}, ${currentTheme.status?.success || colors.status.success})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {progressPct}%
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: '0.65rem',
                color: currentTheme.text.muted,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {stats.watchedEpisodes.toLocaleString('de-DE')} /{' '}
              {stats.totalEpisodes.toLocaleString('de-DE')}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: currentTheme.text.muted,
                textAlign: 'center',
                opacity: 0.7,
              }}
            >
              Eps. (begonnen, nicht abgebr.)
            </Typography>
          </Paper>
        </motion.div>

        {/* Serien tile - top right */}
        <motion.div variants={staggerItem}>
          <StatCard
            icon={<Tv sx={{ fontSize: 20 }} />}
            label="Serien"
            value={stats.totalSeries}
            iconColor={currentTheme.primary}
            subValue={stats.completedSeries > 0 ? `${stats.completedSeries} komplett` : undefined}
            onClick={handleSeriesClick}
          />
        </motion.div>

        {/* Filme tile - bottom right */}
        <motion.div variants={staggerItem}>
          <StatCard
            icon={<Movie sx={{ fontSize: 20 }} />}
            label="Filme"
            value={stats.totalMovies}
            iconColor={currentTheme.primary}
            subValue={`${stats.watchedMovies} geschaut`}
            onClick={handleMoviesClick}
          />
        </motion.div>
      </motion.div>

      {/* Extended Stats (Collapsible) */}
      <Collapse in={expanded}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={expanded ? 'visible' : 'hidden'}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
        >
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Timer sx={{ fontSize: 20 }} />}
              label="Gesamte Watchzeit"
              value={stats.timeString}
              iconColor={currentTheme.primary}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<TrendingUp sx={{ fontSize: 20 }} />}
              label="Diese Woche"
              value={`${stats.lastWeekWatched} Ep.`}
              iconColor={currentTheme.primary}
              subValue="neu geschaut"
              onClick={handleWeeklyEpisodesClick}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Tv sx={{ fontSize: 20 }} />}
              label="Zeit mit Serien"
              value={stats.seriesTimeString}
              iconColor={currentTheme.primary}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Movie sx={{ fontSize: 20 }} />}
              label="Zeit mit Filmen"
              value={stats.movieTimeString}
              iconColor={currentTheme.primary}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Star sx={{ fontSize: 20 }} />}
              label="Ø Serien-Rating"
              value={stats.avgSeriesRating}
              iconColor={currentTheme.primary}
              onClick={handleSeriesRatingClick}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Star sx={{ fontSize: 20 }} />}
              label="Ø Film-Rating"
              value={stats.avgMovieRating}
              iconColor={currentTheme.primary}
              onClick={handleMovieRatingClick}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Category sx={{ fontSize: 20 }} />}
              label="Lieblingsgenre"
              value={stats.topGenre}
              iconColor={currentTheme.primary}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Stream sx={{ fontSize: 20 }} />}
              label="Hauptprovider"
              value={stats.topProvider}
              iconColor={currentTheme.primary}
            />
          </motion.div>
        </motion.div>
      </Collapse>
    </Box>
  );
};
