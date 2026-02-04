import {
  AccessTime,
  CalendarMonth,
  Nightlight,
  Speed,
  WbSunny,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { DAY_NAMES, WatchJourneyData } from '../../services/watchJourneyService';

interface HeatmapTabProps {
  data: WatchJourneyData;
  width: number;
}

export const HeatmapTab: React.FC<HeatmapTabProps> = ({ data, width }) => {
  const { currentTheme } = useTheme();
  const primaryColor = currentTheme.primary;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;

  // Responsive Gap-Größe basierend auf Bildschirmbreite
  const dayLabelWidth = 40; // Breite für Tages-Labels (Mo, Di, etc.)
  // Berechne ungefähre Zellgröße für Gap-Berechnung
  const approxCellSize = (width - dayLabelWidth - 40) / 25; // 24 Zellen + padding
  const cellGap = Math.max(2, Math.min(4, approxCellSize * 0.1));
  const maxCount = Math.max(...data.heatmap.map((h) => h.count), 1);

  // Hover state für Tooltip
  const [hoveredCell, setHoveredCell] = useState<{
    hour: number;
    day: number;
    count: number;
    minutes: number;
  } | null>(null);

  // Calculate insights
  const peakHourLabel = `${data.peakHour}:00`;
  const isNightOwl = data.peakHour >= 22 || data.peakHour <= 4;
  const isEarlyBird = data.peakHour >= 5 && data.peakHour <= 9;
  const lateNightCount = data.heatmap
    .filter((h) => h.hour >= 23 || h.hour <= 3)
    .reduce((a, b) => a + b.count, 0);
  const totalCount = data.heatmap.reduce((a, b) => a + b.count, 0);
  const lateNightPercent = totalCount > 0 ? Math.round((lateNightCount / totalCount) * 100) : 0;

  const weekendCount = data.heatmap
    .filter((h) => h.dayOfWeek === 0 || h.dayOfWeek === 6)
    .reduce((a, b) => a + b.count, 0);
  const weekdayCount = data.heatmap
    .filter((h) => h.dayOfWeek >= 1 && h.dayOfWeek <= 5)
    .reduce((a, b) => a + b.count, 0);

  // Prepare bar data for hourly distribution
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      count: data.heatmap.filter((h) => h.hour === i).reduce((a, b) => a + b.count, 0),
    }));
    return hours;
  }, [data]);

  return (
    <div>
      {/* Hero - Peak Time */}
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
            DEINE PRIME TIME
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}aa)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isNightOwl ? (
                <Nightlight style={{ color: 'white', fontSize: 28 }} />
              ) : isEarlyBird ? (
                <WbSunny style={{ color: 'white', fontSize: 28 }} />
              ) : (
                <AccessTime style={{ color: 'white', fontSize: 28 }} />
              )}
            </div>
            <div>
              <h2 style={{ color: textPrimary, fontSize: 32, fontWeight: 800, margin: 0 }}>
                {peakHourLabel}
              </h2>
              <p style={{ color: textSecondary, fontSize: 14, margin: 0 }}>
                {DAY_NAMES[data.peakDay]} ist dein aktivster Tag
              </p>
            </div>
          </div>

          {isNightOwl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: `${primaryColor}20`,
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Nightlight style={{ fontSize: 16, color: primaryColor }} />
              <span style={{ color: textPrimary, fontSize: 13 }}>
                Nachteule - {lateNightPercent}% nach 23 Uhr
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Hourly Distribution Bar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          margin: '0 20px 24px',
          padding: '20px',
          borderRadius: '20px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Uhrzeitverteilung
        </h3>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${textSecondary}15`} />
              <XAxis
                dataKey="hour"
                tick={{ fill: textSecondary, fontSize: 10 }}
                axisLine={{ stroke: `${textSecondary}30` }}
                interval={5}
              />
              <YAxis
                tick={{ fill: textSecondary, fontSize: 11 }}
                axisLine={{ stroke: `${textSecondary}30` }}
              />
              <Tooltip
                cursor={{ fill: `${primaryColor}10` }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        style={{
                          background: bgSurface,
                          border: `1px solid ${primaryColor}50`,
                          borderRadius: 12,
                          padding: '12px 16px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        <p
                          style={{ color: primaryColor, fontWeight: 700, margin: 0, fontSize: 15 }}
                        >
                          {payload[0].payload.hour}
                        </p>
                        <p style={{ color: textSecondary, margin: '4px 0 0', fontSize: 13 }}>
                          {payload[0].value} Sessions
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <defs>
                <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <Bar
                dataKey="count"
                fill="url(#hourlyGradient)"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                style={{ outline: 'none' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Heatmap Grid */}
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
          position: 'relative',
          overflowX: 'auto',
        }}
      >
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>
          Wochentag x Uhrzeit
        </h3>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                top: 60,
                left: '50%',
                transform: 'translateX(-50%)',
                background: bgSurface,
                border: `1px solid ${primaryColor}50`,
                borderRadius: 12,
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                zIndex: 10,
                textAlign: 'center',
              }}
            >
              <p style={{ color: primaryColor, fontWeight: 700, margin: 0, fontSize: 14 }}>
                {DAY_NAMES[hoveredCell.day]} {hoveredCell.hour}:00
              </p>
              <p style={{ color: textPrimary, margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>
                {hoveredCell.count} Sessions
              </p>
              {hoveredCell.minutes > 0 && (
                <p style={{ color: textSecondary, margin: '4px 0 0', fontSize: 12 }}>
                  {Math.round(hoveredCell.minutes / 60)}h {hoveredCell.minutes % 60}min
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-width Heatmap Container */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Hour labels - positioned to align with grid cells */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, height: 24 }}>
            <div style={{ width: dayLabelWidth, flexShrink: 0 }} /> {/* Spacer for day labels */}
            <div style={{ display: 'flex', position: 'relative', flex: 1 }}>
              {[0, 6, 12, 18, 23].map((hour) => (
                <div
                  key={hour}
                  style={{
                    position: 'absolute',
                    left: `${(hour / 23) * 100}%`,
                    transform: 'translateX(-50%)',
                    fontSize: 11,
                    color: textPrimary,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                  }}
                >
                  {hour}:00
                </div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div onMouseLeave={() => setHoveredCell(null)}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div
                key={day}
                style={{ display: 'flex', alignItems: 'center', marginBottom: cellGap + 2 }}
              >
                <div
                  style={{
                    width: dayLabelWidth,
                    flexShrink: 0,
                    fontSize: 14,
                    color: textPrimary,
                    fontWeight: 600,
                  }}
                >
                  {DAY_NAMES[day]}
                </div>
                <div style={{ display: 'flex', gap: cellGap, flex: 1 }}>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = data.heatmap.find((h) => h.hour === hour && h.dayOfWeek === day);
                    const intensity = cell ? cell.count / maxCount : 0;
                    const isPeak = hour === data.peakHour && day === data.peakDay;
                    const isHovered = hoveredCell?.hour === hour && hoveredCell?.day === day;
                    return (
                      <div
                        key={hour}
                        onMouseEnter={() =>
                          setHoveredCell({
                            hour,
                            day,
                            count: cell?.count || 0,
                            minutes: cell?.minutes || 0,
                          })
                        }
                        style={{
                          flex: 1,
                          aspectRatio: '1 / 1',
                          borderRadius: 4,
                          background:
                            intensity > 0
                              ? `color-mix(in srgb, ${primaryColor} ${20 + intensity * 80}%, transparent)`
                              : `${textSecondary}10`,
                          border: `2px solid ${isPeak ? textPrimary : isHovered ? primaryColor : 'transparent'}`,
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          boxShadow: isHovered ? `0 0 8px ${primaryColor}40` : 'none',
                          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 24,
          }}
        >
          <span style={{ fontSize: 13, color: textSecondary }}>Weniger</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: `color-mix(in srgb, ${primaryColor} ${opacity * 100}%, transparent)`,
              }}
            />
          ))}
          <span style={{ fontSize: 13, color: textSecondary }}>Mehr</span>
        </div>
      </motion.div>

      {/* Insights */}
      <div style={{ padding: '0 20px' }}>
        <h3 style={{ color: textPrimary, fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: '#00cec915',
              border: '1px solid #00cec940',
              textAlign: 'center',
            }}
          >
            <CalendarMonth style={{ color: '#00cec9', fontSize: 28, marginBottom: 8 }} />
            <div style={{ color: '#00cec9', fontSize: 24, fontWeight: 700 }}>{weekendCount}</div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Wochenend-Sessions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: '#fdcb6e15',
              border: '1px solid #fdcb6e40',
              textAlign: 'center',
            }}
          >
            <Speed style={{ color: '#fdcb6e', fontSize: 28, marginBottom: 8 }} />
            <div style={{ color: '#fdcb6e', fontSize: 24, fontWeight: 700 }}>{weekdayCount}</div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Wochentag-Sessions</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
