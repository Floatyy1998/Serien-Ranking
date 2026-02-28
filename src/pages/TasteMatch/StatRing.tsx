import { motion } from 'framer-motion';
import React from 'react';

// Stat Ring - Premium Version
export const StatRing: React.FC<{
  icon: React.ReactNode;
  label: string;
  score: number;
  color: string;
  delay: number;
  bgColor: string;
}> = ({ icon, label, score, color, delay, bgColor }) => {
  const size = 78;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 8px',
        borderRadius: '16px',
        background: bgColor,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${color}25`,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: '50%',
            background: color,
            filter: 'blur(20px)',
            opacity: 0.3,
          }}
        />
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ delay: delay + 0.3, duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            zIndex: 2,
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: 'white',
            textShadow: `0 0 20px ${color}50`,
          }}
        >
          {score}%
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 500,
            letterSpacing: '0.3px',
          }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
};
