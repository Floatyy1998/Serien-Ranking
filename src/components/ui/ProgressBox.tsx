import { Box, Typography, Tooltip } from '@mui/material';
import React from 'react';

interface ProgressBoxProps {
  progress: number; // 0-100
}

export const ProgressBox: React.FC<ProgressBoxProps> = ({ progress }) => {
  // Farbverlauf von Rot nach Grün basierend auf Fortschritt
  const getProgressColor = () => {
    if (progress === 0) return 'rgba(128, 128, 128, 0.5)';
    
    if (progress < 33) {
      return '#ff4444';
    } else if (progress < 66) {
      return '#ffaa00';
    } else if (progress < 100) {
      return '#88dd00';
    } else {
      return '#00ff00';
    }
  };

  const displayValue = progress === 100 ? 100 : progress > 99 ? 99 : Math.round(progress);
  
  // Tooltip Text basierend auf Fortschritt
  const getTooltipText = () => {
    if (progress === 0) return "Noch keine Episode gesehen";
    if (progress === 100) return "Serie komplett geschaut!";
    if (progress < 100) return `${displayValue}% der ausgestrahlten Episoden gesehen`;
    return `${displayValue}% geschaut`;
  };

  return (
    <Tooltip 
      title={getTooltipText()} 
      placement="right"
      arrow
    >
    <Box
      sx={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        p: 0.25,  // Gleicher Padding wie Provider
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        },
        // SVG Border für Progress
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          borderRadius: '12px',
          border: `3px solid ${getProgressColor()}`,
          borderRightColor: progress < 25 ? 'transparent' : getProgressColor(),
          borderTopColor: progress < 50 ? 'transparent' : getProgressColor(),
          borderLeftColor: progress < 75 ? 'transparent' : getProgressColor(),
          transition: 'all 0.3s ease',
        },
        // Grauer Hintergrund-Border
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          borderRadius: '12px',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          zIndex: -1,
        },
      }}
    >
      {/* Prozent-Text */}
      <Typography
        sx={{
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.7rem',
          textShadow: '0 0 3px rgba(0, 0, 0, 0.9), 0 0 6px rgba(0, 0, 0, 0.7)',
          lineHeight: 1,
        }}
      >
        {displayValue}
      </Typography>
    </Box>
    </Tooltip>
  );
};