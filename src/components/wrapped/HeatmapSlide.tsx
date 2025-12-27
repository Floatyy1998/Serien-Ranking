/**
 * HeatmapSlide - Zeigt Watch-Zeiten als Heatmap (Wochentag x Stunde)
 */

import React from 'react';
import { motion } from 'framer-motion';

interface HeatmapSlideProps {
  heatmapData: number[][]; // [dayOfWeek][hour] = count
}

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const HOUR_LABELS = ['0', '3', '6', '9', '12', '15', '18', '21'];

export const HeatmapSlide: React.FC<HeatmapSlideProps> = ({ heatmapData }) => {
  // Find max value for color scaling
  const maxValue = Math.max(...heatmapData.flat(), 1);

  // Get color based on intensity
  const getColor = (value: number): string => {
    if (value === 0) return 'rgba(255,255,255,0.05)';
    const intensity = value / maxValue;
    if (intensity < 0.25) return 'rgba(102, 126, 234, 0.3)';
    if (intensity < 0.5) return 'rgba(102, 126, 234, 0.5)';
    if (intensity < 0.75) return 'rgba(118, 75, 162, 0.7)';
    return 'rgba(233, 69, 96, 0.9)';
  };

  // Find peak time
  let peakDay = 0;
  let peakHour = 0;
  let peakValue = 0;
  heatmapData.forEach((day, dayIndex) => {
    day.forEach((value, hourIndex) => {
      if (value > peakValue) {
        peakValue = value;
        peakDay = dayIndex;
        peakHour = hourIndex;
      }
    });
  });

  const peakTimeLabel = `${DAY_LABELS[peakDay]} ${peakHour}:00`;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 15px',
        boxSizing: 'border-box',
      }}
    >
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          color: 'white',
          fontSize: '1rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '15px',
          zIndex: 1,
        }}
      >
        Deine Watch-Zeiten
      </motion.p>

      {/* Grid Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        style={{ marginBottom: '20px', zIndex: 1 }}
      >
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 3v18" />
        </svg>
      </motion.div>

      {/* Heatmap Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '20px',
          zIndex: 1,
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Hour labels */}
        <div style={{ display: 'flex', marginBottom: '8px', paddingLeft: '30px' }}>
          {HOUR_LABELS.map((hour) => (
            <div
              key={hour}
              style={{
                flex: 3,
                textAlign: 'center',
                color: 'white',
                opacity: 0.5,
                fontSize: '0.65rem',
              }}
            >
              {hour}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {heatmapData.map((dayData, dayIndex) => (
          <motion.div
            key={dayIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + dayIndex * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}
          >
            {/* Day label */}
            <div
              style={{
                width: '25px',
                color: 'white',
                opacity: 0.6,
                fontSize: '0.7rem',
                fontWeight: dayIndex === peakDay ? 'bold' : 'normal',
              }}
            >
              {DAY_LABELS[dayIndex]}
            </div>

            {/* Hour cells */}
            <div style={{ display: 'flex', flex: 1, gap: '2px' }}>
              {dayData.map((value, hourIndex) => (
                <motion.div
                  key={hourIndex}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 + dayIndex * 0.03 + hourIndex * 0.01 }}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '3px',
                    background: getColor(value),
                    border:
                      dayIndex === peakDay && hourIndex === peakHour
                        ? '2px solid #ffd700'
                        : '1px solid rgba(255,255,255,0.05)',
                    minWidth: '10px',
                    maxWidth: '18px',
                  }}
                  title={`${DAY_LABELS[dayIndex]} ${hourIndex}:00 - ${value} Views`}
                />
              ))}
            </div>
          </motion.div>
        ))}

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '15px',
          }}
        >
          <span style={{ color: 'white', opacity: 0.5, fontSize: '0.7rem' }}>Wenig</span>
          {[0.1, 0.3, 0.5, 0.8].map((_, i) => (
            <div
              key={i}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '3px',
                background:
                  i === 0
                    ? 'rgba(102, 126, 234, 0.3)'
                    : i === 1
                    ? 'rgba(102, 126, 234, 0.5)'
                    : i === 2
                    ? 'rgba(118, 75, 162, 0.7)'
                    : 'rgba(233, 69, 96, 0.9)',
              }}
            />
          ))}
          <span style={{ color: 'white', opacity: 0.5, fontSize: '0.7rem' }}>Viel</span>
        </div>
      </motion.div>

      {/* Peak Time Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        style={{
          marginTop: '25px',
          background: 'linear-gradient(135deg, rgba(233,69,96,0.2) 0%, rgba(118,75,162,0.2) 100%)',
          borderRadius: '16px',
          padding: '15px 25px',
          zIndex: 1,
          textAlign: 'center',
          border: '1px solid rgba(233,69,96,0.3)',
        }}
      >
        <p style={{ color: 'white', opacity: 0.7, fontSize: '0.85rem', margin: '0 0 5px 0' }}>
          Deine Peak-Zeit
        </p>
        <p
          style={{
            color: '#e94560',
            fontSize: '1.4rem',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          {peakTimeLabel} Uhr
        </p>
        <p style={{ color: 'white', opacity: 0.6, fontSize: '0.8rem', margin: '5px 0 0 0' }}>
          {peakValue} Views zu dieser Zeit
        </p>
      </motion.div>
    </div>
  );
};

export default HeatmapSlide;
