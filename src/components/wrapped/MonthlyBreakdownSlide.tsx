/**
 * MonthlyBreakdownSlide - Zeigt monatliche Watchtime
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MonthStats } from '../../types/Wrapped';

interface MonthlyBreakdownSlideProps {
  monthlyBreakdown: MonthStats[];
  mostActiveMonth: MonthStats;
}

export const MonthlyBreakdownSlide: React.FC<MonthlyBreakdownSlideProps> = ({
  monthlyBreakdown,
  mostActiveMonth,
}) => {
  // Finde den maximalen Wert für die Skalierung
  const maxMinutes = Math.max(...monthlyBreakdown.map(m => m.minutesWatched), 1);

  // Kurze Monatsnamen
  const shortMonths = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #141e30 0%, #243b55 50%, #2c5364 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Grid Pattern Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          color: 'white',
          fontSize: '1rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '20px',
          zIndex: 1,
        }}
      >
        Dein Jahr im Überblick
      </motion.p>

      {/* Calendar Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
        style={{
          marginBottom: '15px',
          zIndex: 1,
        }}
      >
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="M7 16l4-8 4 5 5-9"/>
        </svg>
      </motion.div>

      {/* Most Active Month */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '20px 35px',
          marginBottom: '35px',
          zIndex: 1,
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(102,126,234,0.3)',
        }}
      >
        <p style={{ color: 'white', opacity: 0.8, fontSize: '0.9rem', marginBottom: '8px' }}>
          Dein aktivster Monat
        </p>
        <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
          {mostActiveMonth.monthName}
        </h3>
        <p style={{ color: 'white', opacity: 0.9 }}>
          {mostActiveMonth.episodesWatched} Episoden • {mostActiveMonth.moviesWatched} Filme
        </p>
      </motion.div>

      {/* Animated Bar Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          width: '100%',
          maxWidth: '500px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            height: '180px',
            gap: '6px',
            padding: '0 5px',
          }}
        >
          {monthlyBreakdown.map((month, index) => {
            const height = (month.minutesWatched / maxMinutes) * 100;
            const isTopMonth = month.month === mostActiveMonth.month;

            return (
              <motion.div
                key={month.month}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.8 + index * 0.05, duration: 0.5, ease: 'easeOut' }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  transformOrigin: 'bottom',
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  style={{
                    width: '100%',
                    height: `${Math.max(height, 8)}%`,
                    background: isTopMonth
                      ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '8px',
                    boxShadow: isTopMonth ? '0 0 20px rgba(102,126,234,0.5)' : 'none',
                    position: 'relative',
                  }}
                >
                </motion.div>
                <span
                  style={{
                    fontSize: '0.6rem',
                    marginTop: '8px',
                    color: 'white',
                    opacity: isTopMonth ? 1 : 0.6,
                    fontWeight: isTopMonth ? 'bold' : 'normal',
                  }}
                >
                  {shortMonths[index]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Legend */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.3 }}
        style={{
          color: 'white',
          fontSize: '0.85rem',
          marginTop: '25px',
          zIndex: 1,
        }}
      >
        Watchtime pro Monat
      </motion.p>
    </div>
  );
};

export default MonthlyBreakdownSlide;
