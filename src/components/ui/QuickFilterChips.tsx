import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { colors } from '../../theme';

interface QuickFilterChipsProps {
  activeFilter: string;
  onFilterChange: (value: string) => void;
  isMovieMode?: boolean;
}

const seriesFilters = [
  { value: 'Ohne Bewertung', label: 'Ohne Bewertung' },
  { value: 'Neue Episoden', label: 'Neue Episoden' },
  { value: 'Begonnen', label: 'Begonnen' },
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
        backgroundColor: colors.overlay.light,
        borderRadius: '12px',
        border: `1px solid ${colors.overlay.white}`,
      }}
    >
      <Typography
        variant='caption'
        sx={{
          color: colors.text.muted,
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
                ? colors.overlay.medium
                : colors.overlay.light,
              color: isActive ? 'var(--theme-primary)' : colors.text.secondary,
              border: isActive
                ? `1px solid ${colors.border.primary}`
                : `1px solid ${colors.overlay.white}`,
              '&:hover': {
                backgroundColor: isActive
                  ? colors.overlay.medium
                  : colors.overlay.medium,
                color: 'var(--theme-primary)',
                borderColor: colors.border.primary,
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

  // Mobile Version - 2x2 grid layout
  const MobileFilters = (
    <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 1, px: 1 }}>
      <Typography
        variant='caption'
        sx={{
          color: colors.text.muted,
          fontSize: '0.75rem',
          fontWeight: 500,
          textAlign: 'center',
          display: 'block',
          mb: 0.5,
          userSelect: 'none',
        }}
      >
        Quick Filter:
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0.8,
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
                width: '100%',
                height: '32px',
                fontSize: '0.68rem',
                px: 1,
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: isActive ? 600 : 500,
                backgroundColor: isActive
                  ? colors.overlay.medium
                  : colors.overlay.light,
                borderColor: isActive
                  ? colors.border.primary
                  : colors.overlay.white,
                color: isActive ? 'var(--theme-primary)' : colors.text.secondary,
                '&:hover': {
                  backgroundColor: isActive
                    ? colors.overlay.medium
                    : colors.overlay.medium,
                  borderColor: colors.border.primary,
                  color: 'var(--theme-primary)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
                // Ensure text doesn't overflow
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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
