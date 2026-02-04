import { ExpandMore, MovieFilter, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { WatchJourneyData } from '../../services/watchJourneyService';

interface SerienTabProps {
  data: WatchJourneyData;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';
const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

export const SerienTab: React.FC<SerienTabProps> = ({ data }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;
  const primaryColor = currentTheme.primary;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [monthRangeStart, setMonthRangeStart] = useState(1); // 1-12
  const [monthRangeEnd, setMonthRangeEnd] = useState(12); // 1-12

  const monthNames = [
    'Jan',
    'Feb',
    'Mär',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dez',
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use series stats from the selected year
  const seriesStats = useMemo(() => {
    return [...data.seriesStats].sort((a, b) => b.episodes - a.episodes);
  }, [data.seriesStats]);

  const [posters, setPosters] = useState<Record<number, string>>({});

  // Fetch posters for series
  useEffect(() => {
    const fetchPosters = async () => {
      if (!TMDB_API_KEY || seriesStats.length === 0) return;

      const newPosters: Record<number, string> = {};
      const seriesIds = seriesStats.map((s) => s.seriesId);

      // Fetch in batches of 10 to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < seriesIds.length; i += batchSize) {
        const batch = seriesIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (id) => {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}&language=de-DE`
              );
              if (response.ok) {
                const tmdbData = await response.json();
                if (tmdbData.poster_path) {
                  newPosters[id] = tmdbData.poster_path;
                }
              }
            } catch {
              // Silent fail
            }
          })
        );
        // Update state after each batch so posters appear progressively
        setPosters({ ...newPosters });
      }
    };

    fetchPosters();
  }, [seriesStats]);

  // Timeline series with calculated positions for Gantt chart (filtered by month range)
  const timelineSeries = useMemo(() => {
    // Use selected month range
    const rangeStart = new Date(data.year, monthRangeStart - 1, 1).getTime();
    const rangeEnd = new Date(data.year, monthRangeEnd, 0, 23, 59, 59).getTime(); // Last day of end month
    const rangeDuration = rangeEnd - rangeStart;

    return seriesStats
      .filter((series) => {
        // Include series that overlap with the selected month range
        const first = new Date(series.firstWatched).getTime();
        const last = new Date(series.lastWatched).getTime();
        return first <= rangeEnd && last >= rangeStart;
      })
      .map((series) => {
        const firstDate = new Date(series.firstWatched);
        const lastDate = new Date(series.lastWatched);

        // Clamp dates to the selected range
        const effectiveStart = Math.max(firstDate.getTime(), rangeStart);
        const effectiveEnd = Math.min(lastDate.getTime(), rangeEnd);

        // Calculate position and width as percentages of the selected range
        const startPercent = ((effectiveStart - rangeStart) / rangeDuration) * 100;
        const endPercent = ((effectiveEnd - rangeStart) / rangeDuration) * 100;
        const widthPercent = Math.max(endPercent - startPercent, 2); // Min 2% width

        // Calculate total watch time in hours
        const totalMinutes = series.episodes * (series.avgRuntime || 45);
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

        return {
          ...series,
          effectiveStart: new Date(effectiveStart),
          effectiveEnd: new Date(effectiveEnd),
          startPercent,
          widthPercent,
          totalHours,
        };
      })
      .sort((a, b) => a.effectiveStart.getTime() - b.effectiveStart.getTime());
  }, [seriesStats, data.year, monthRangeStart, monthRangeEnd]);

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  };

  // Total stats
  const totalEpisodes = seriesStats.reduce((sum, s) => sum + s.episodes, 0);
  const uniqueSeriesCount = seriesStats.length;
  const avgEpisodesPerSeries =
    uniqueSeriesCount > 0 ? Math.round((totalEpisodes / uniqueSeriesCount) * 10) / 10 : 0;

  if (seriesStats.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <MovieFilter style={{ fontSize: 64, color: `${textSecondary}30`, marginBottom: 16 }} />
        <h3 style={{ color: textPrimary, fontSize: 18, marginBottom: 8 }}>Keine Serien-Daten</h3>
        <p style={{ color: textSecondary, fontSize: 14 }}>
          Schau Serien, um deine Serie-Reise zu sehen!
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Hero Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)`,
          border: `1px solid ${primaryColor}50`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: primaryColor,
            opacity: 0.15,
            filter: 'blur(40px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p
            style={{
              color: textSecondary,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            DEINE SERIEN-REISE
          </p>
          <h2 style={{ color: textPrimary, fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>
            {uniqueSeriesCount} Serien
          </h2>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: primaryColor }}>
                {totalEpisodes}
              </span>
              <span style={{ fontSize: 14, color: textSecondary, marginLeft: 4 }}>Episoden</span>
            </div>
            <div style={{ width: 1, background: `${textSecondary}40` }} />
            <div>
              <span style={{ fontSize: 28, fontWeight: 700, color: primaryColor }}>
                Ø {avgEpisodesPerSeries}
              </span>
              <span style={{ fontSize: 14, color: textSecondary, marginLeft: 4 }}>pro Serie</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gantt Chart Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          margin: '0 20px 24px',
          padding: '20px',
          borderRadius: '20px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>
            Serien-Timeline {data.year}
          </h3>

          {/* Month range selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <select
                value={monthRangeStart}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMonthRangeStart(val);
                  if (val > monthRangeEnd) setMonthRangeEnd(val);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: `${primaryColor}15`,
                  border: `1px solid ${primaryColor}30`,
                  borderRadius: 8,
                  padding: isMobile ? '6px 28px 6px 10px' : '8px 32px 8px 12px',
                  color: textPrimary,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {monthNames.map((name, i) => (
                  <option
                    key={i}
                    value={i + 1}
                    style={{ background: bgSurface, color: textPrimary }}
                  >
                    {name}
                  </option>
                ))}
              </select>
              <ExpandMore
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: primaryColor,
                  pointerEvents: 'none',
                }}
              />
            </div>
            <span style={{ color: textSecondary, fontSize: 13 }}>–</span>
            <div style={{ position: 'relative' }}>
              <select
                value={monthRangeEnd}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMonthRangeEnd(val);
                  if (val < monthRangeStart) setMonthRangeStart(val);
                }}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: `${primaryColor}15`,
                  border: `1px solid ${primaryColor}30`,
                  borderRadius: 8,
                  padding: isMobile ? '6px 28px 6px 10px' : '8px 32px 8px 12px',
                  color: textPrimary,
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {monthNames.map((name, i) => (
                  <option
                    key={i}
                    value={i + 1}
                    style={{ background: bgSurface, color: textPrimary }}
                  >
                    {name}
                  </option>
                ))}
              </select>
              <ExpandMore
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: primaryColor,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Month headers - only show selected range */}
        <div
          style={{
            display: 'flex',
            marginBottom: 8,
            paddingLeft: isMobile ? 95 : 253,
          }}
        >
          {monthNames.slice(monthRangeStart - 1, monthRangeEnd).map((month, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                fontSize: isMobile ? 9 : 12,
                color: textSecondary,
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              {isMobile ? month.charAt(0) : month}
            </div>
          ))}
        </div>

        {/* Series rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 18 }}>
          {(showAllTimeline ? timelineSeries : timelineSeries.slice(0, 10)).map((series, index) => (
            <motion.div
              key={series.seriesId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ opacity: 0.7 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              onClick={() => navigate(`/series/${series.seriesId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 18,
                cursor: 'pointer',
                padding: isMobile ? '2px 0' : '4px 0',
              }}
            >
              {/* Poster thumbnail */}
              <div
                style={{
                  width: isMobile ? 32 : 65,
                  height: isMobile ? 48 : 97,
                  borderRadius: isMobile ? 4 : 6,
                  background: posters[series.seriesId]
                    ? `url(${TMDB_IMAGE_BASE}${posters[series.seriesId]}) center/cover`
                    : `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!posters[series.seriesId] && (
                  <Tv style={{ color: textSecondary, fontSize: isMobile ? 14 : 26 }} />
                )}
              </div>

              {/* Title & Stats */}
              <div
                style={{
                  width: isMobile ? 55 : 170,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    color: textPrimary,
                    fontSize: isMobile ? 11 : 16,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {series.title}
                </div>
                <div
                  style={{
                    color: textSecondary,
                    fontSize: isMobile ? 9 : 13,
                    marginTop: isMobile ? 2 : 4,
                  }}
                >
                  {series.episodes} Ep{!isMobile && ` · ${series.totalHours}h`}
                </div>
                <div
                  style={{
                    color: primaryColor,
                    fontSize: isMobile ? 8 : 12,
                    marginTop: isMobile ? 2 : 4,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isMobile
                    ? `${series.effectiveStart.getDate()}.${series.effectiveStart.getMonth() + 1}. – ${series.effectiveEnd.getDate()}.${series.effectiveEnd.getMonth() + 1}.`
                    : `${formatDateShort(series.effectiveStart)} – ${formatDateShort(series.effectiveEnd)}`}
                </div>
              </div>

              {/* Gantt bar area */}
              <div
                style={{
                  flex: 1,
                  height: isMobile ? 24 : 44,
                  position: 'relative',
                  background: `${textSecondary}10`,
                  borderRadius: 6,
                }}
              >
                {/* Month grid lines - based on selected range */}
                {[...Array(Math.max(monthRangeEnd - monthRangeStart, 0))].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${((i + 1) / (monthRangeEnd - monthRangeStart + 1)) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: `${textSecondary}20`,
                    }}
                  />
                ))}

                {/* The actual bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${series.startPercent}%`,
                    width: `${Math.max(series.widthPercent, 1)}%`,
                    top: 5,
                    bottom: 5,
                    background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)`,
                    borderRadius: 4,
                    minWidth: 10,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show more / Show less button */}
        {timelineSeries.length > 10 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowAllTimeline(!showAllTimeline);
            }}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '12px',
              background: `${primaryColor}15`,
              border: `1px solid ${primaryColor}30`,
              borderRadius: 10,
              color: primaryColor,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <ExpandMore
              style={{
                fontSize: 18,
                transform: showAllTimeline ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
            {showAllTimeline
              ? 'Weniger anzeigen'
              : `${timelineSeries.length - 10} weitere Serien anzeigen`}
          </motion.button>
        )}

        {timelineSeries.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: textSecondary, fontSize: 14 }}>
              Keine Serien im ausgewählten Zeitraum geschaut
            </p>
          </div>
        )}
      </motion.div>

      {/* Top Series Ranking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 20px',
          padding: '20px',
          borderRadius: '20px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Top 10 Serien
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {seriesStats.slice(0, 10).map((series, index) => (
            <motion.div
              key={series.seriesId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ opacity: 0.7 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              onClick={() => navigate(`/series/${series.seriesId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                borderRadius: 12,
                background: index === 0 ? `${primaryColor}15` : 'transparent',
                border: index === 0 ? `1px solid ${primaryColor}30` : 'none',
                cursor: 'pointer',
              }}
            >
              {/* Poster thumbnail */}
              <div
                style={{
                  width: 50,
                  height: 75,
                  borderRadius: 8,
                  background: posters[series.seriesId]
                    ? `url(${TMDB_IMAGE_BASE}${posters[series.seriesId]}) center/cover`
                    : `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!posters[series.seriesId] && <Tv style={{ color: textSecondary, fontSize: 20 }} />}
              </div>

              {/* Rank */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background:
                    index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : `${textSecondary}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: index < 3 ? '#1a1a2e' : textSecondary,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: textPrimary,
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {series.title}
                </div>
                <div style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
                  {formatDate(series.firstWatched)} – {formatDate(series.lastWatched)}
                  {series.rewatchEpisodes > 0 && (
                    <span style={{ color: '#a29bfe' }}> · {series.rewatchEpisodes}× Rewatch</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: primaryColor, fontSize: 16, fontWeight: 700 }}>
                  {series.episodes}
                </div>
                <div style={{ color: textSecondary, fontSize: 11 }}>
                  {Math.round(series.minutes / 60)}h
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
