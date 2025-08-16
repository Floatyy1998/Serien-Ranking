import { Box, Button, Typography } from '@mui/material';
import React from 'react';

interface QuickFilterChipsProps {
  activeFilter: string;
  onFilterChange: (value: string) => void;
  isMovieMode?: boolean;
}

const seriesFilters = [
  { value: 'Ohne Bewertung', label: 'Ohne Bewertung' },
  { value: 'Neue Episoden', label: 'Neue Episoden' },
  { value: 'Zuletzt Hinzugefügt', label: 'Zuletzt Hinzugefügt' },
];

const movieFilters = [
  { value: 'Ohne Bewertung', label: 'Ohne Bewertung' },
  { value: 'Noch nicht Veröffentlicht', label: 'Unveröffentlicht' },
  { value: 'Zuletzt Hinzugefügt', label: 'Zuletzt Hinzugefügt' },
];

export const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  isMovieMode = false,
}) => {
  const filters = isMovieMode ? movieFilters : seriesFilters;

  const handleFilterClick = (value: string) => {
    onFilterChange(activeFilter === value ? '' : value);
  };

  // Desktop Version - besser integriert mit Label
  const DesktopFilters = (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        gap: 1.5,
        alignItems: 'center',
        justifyContent: 'flex-start',
        mb: 0,
        px: 2,
        py: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Typography
        variant='caption'
        sx={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.75rem',
          fontWeight: 500,
          minWidth: 'fit-content',
          userSelect: 'none',
        }}
      >
        Filter:
      </Typography>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;
        return (
          <Button
            key={filter.value}
            variant={isActive ? 'contained' : 'text'}
            size='small'
            onClick={() => handleFilterClick(filter.value)}
            sx={{
              minWidth: 'fit-content',
              height: '28px',
              fontSize: '0.7rem',
              px: 1.5,
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive
                ? 'rgba(0, 254, 215, 0.2)'
                : 'rgba(255, 255, 255, 0.03)',
              color: isActive ? '#00fed7' : 'rgba(255, 255, 255, 0.8)',
              border: isActive
                ? '1px solid rgba(0, 254, 215, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: isActive
                  ? 'rgba(0, 254, 215, 0.3)'
                  : 'rgba(0, 254, 215, 0.08)',
                color: '#00fed7',
                borderColor: 'rgba(0, 254, 215, 0.4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {filter.label}
          </Button>
        );
      })}
    </Box>
  );

  // Mobile Version - flex wrap, small buttons side by side
  const MobileFilters = (
    <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-evenly',
          gap: 0.8,
          px: 0,
          py: 0.5,
          mx: 0,
        }}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <Button
              key={filter.value}
              variant={isActive ? 'contained' : 'outlined'}
              size='small'
              onClick={() => handleFilterClick(filter.value)}
              sx={{
                minWidth: 'fit-content',
                height: '30px',
                fontSize: '0.7rem',
                px: 1.5,
                borderRadius: '15px',
                textTransform: 'none',
                fontWeight: isActive ? 600 : 500,
                flex: '0 0 auto',
                backgroundColor: isActive
                  ? 'rgba(0, 254, 215, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderColor: isActive
                  ? 'rgba(0, 254, 215, 0.5)'
                  : 'rgba(255, 255, 255, 0.2)',
                color: isActive ? '#00fed7' : 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: isActive
                    ? 'rgba(0, 254, 215, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(0, 254, 215, 0.7)',
                  color: '#00fed7',
                },
              }}
            >
              {filter.label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <>
      {DesktopFilters}
      {MobileFilters}
    </>
  );
};
