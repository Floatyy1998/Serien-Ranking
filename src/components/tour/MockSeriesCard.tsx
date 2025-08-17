import { CheckCircle } from '@mui/icons-material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { Suspense } from 'react';
import ThreeDotMenu, {
  DeleteIcon,
  PlaylistPlayIcon,
  StarIcon,
} from '../ui/ThreeDotMenu';
import { colors } from '../../theme';

interface MockSeriesCardProps {
  highlightedArea?: string;
}

export const MockSeriesCard: React.FC<MockSeriesCardProps> = ({
  highlightedArea,
}) => {
  const shadowColor = '#22c55e'; // Production series (green)
  const shadowColors = {
    rgb: '34, 197, 94',
    hex: shadowColor,
  };

  const cardStyles = {
    background: `radial-gradient(circle at 50% 50%, rgba(${shadowColors.rgb}, 0.08) 0%, transparent 70%)`,
    boxShadow: `0 0 25px rgba(${shadowColors.rgb}, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)`,
    border: `2px solid rgba(${shadowColors.rgb}, 0.4)`,
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    // Keine hover-Effekte für die Tour-Version
  };

  const isMobile = window.innerWidth < 768;
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '160px', // Feste Position 160px vom oberen Rand (wie Offset)
        left: '50%',
        transform: 'translateX(-50%)', // Nur horizontal zentrieren
        zIndex: 9997, // Deutlich unter dem Spotlight
        display: 'block',
        width: isMobile ? '200px' : '240px', // Kleiner auf Mobile
        height: isMobile ? '320px' : '400px', // Kleiner auf Mobile
      }}
    >
      <Suspense fallback={<div />}>
        <Card
          className='h-full transition-all duration-500 flex flex-col series-card group'
          sx={cardStyles}
        >
          <Box
            className='relative aspect-2/3 overflow-hidden'
            sx={{
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-2px',
                left: '-2px',
                right: '-2px',
                height: '65px',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                pointerEvents: 'none',
                transformOrigin: 'center bottom',
              },
              // Keine hover-Effekte für Tour-Version
            }}
          >
            <CardMedia
              sx={{
                height: '100%',
                objectFit: 'cover',
                backfaceVisibility: 'hidden',
                cursor: 'pointer',
                // Keine hover-Transformationen für Tour-Version
              }}
              image='https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg'
              title='Breaking Bad'
            />

            {/* Provider Logos */}
            <Box
              className='absolute top-3 left-1 flex gap-0.5 opacity-100 transition-all duration-300'
              data-tour='series-providers'
              sx={{
                transform: 'translateY(0)', // Immer sichtbar für Tour
                ...(highlightedArea === 'series-providers' && {
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    right: '-8px',
                    bottom: '-8px',
                    border: '3px solid var(--theme-primary)',
                    borderRadius: '8px',
                    boxShadow: colors.shadow.hover,
                    pointerEvents: 'none',
                    zIndex: 10,
                  },
                }),
              }}
            >
              <Box
                sx={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  p: 0.25,
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Keine hover-Effekte für Tour-Version
                }}
              >
                <img
                  src='https://image.tmdb.org/t/p/original/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg'
                  alt='Netflix'
                  style={{
                    height: '32px',
                    width: '32px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            </Box>

            {/* Watchlist Button */}
            <Box
              className='absolute bottom-2 left-2'
              data-tour='series-watchlist-button'
              sx={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                p: 1,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                // Keine hover-Effekte für Tour-Version
                ...(highlightedArea === 'series-watchlist-button' && {
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    right: '-8px',
                    bottom: '-8px',
                    border: '3px solid var(--theme-primary)',
                    borderRadius: '8px',
                    boxShadow: colors.shadow.hover,
                    pointerEvents: 'none',
                    zIndex: 10,
                  },
                }),
              }}
            >
              <BookmarkIcon
                sx={{
                  color: '#22c55e', // Green for active watchlist
                  fontSize: 24,
                }}
              />
            </Box>

            {/* Rating Box */}
            <Box
              className='absolute top-3 right-1'
              data-tour='series-rating'
              sx={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                px: 2,
                py: 1,
                // Keine hover-Effekte für Tour-Version
                ...(highlightedArea === 'series-rating' && {
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    right: '-8px',
                    bottom: '-8px',
                    border: '3px solid var(--theme-primary)',
                    borderRadius: '8px',
                    boxShadow: colors.shadow.hover,
                    pointerEvents: 'none',
                    zIndex: 10,
                  },
                }),
              }}
            >
              <Typography
                variant='body1'
                sx={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  fontWeight: 600,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                ⭐ 9.2
              </Typography>
            </Box>

            {/* Three Dot Menu */}
            <Box
              className='absolute bottom-3 right-3 opacity-100 transition-all duration-300'
              data-tour='series-menu'
              sx={{
                transform: 'translateY(0)', // Immer sichtbar für Tour
                ...(highlightedArea === 'series-menu' && {
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    right: '-8px',
                    bottom: '-8px',
                    border: '3px solid var(--theme-primary)',
                    borderRadius: '8px',
                    boxShadow: colors.shadow.hover,
                    pointerEvents: 'none',
                    zIndex: 10,
                  },
                }),
              }}
            >
              <ThreeDotMenu
                onMenuStateChange={() => {}}
                options={[
                  {
                    label: 'Rating anpassen',
                    icon: <StarIcon />,
                    onClick: () => {},
                  },
                  {
                    label: 'Gesehene Episoden bearbeiten',
                    icon: <CheckCircle />,
                    onClick: () => {},
                  },
                  {
                    label: 'Kommende Episoden anzeigen',
                    icon: <PlaylistPlayIcon />,
                    onClick: () => {},
                  },
                  {
                    label: 'Serie löschen',
                    icon: <DeleteIcon sx={{ color: '#f87171' }} />,
                    onClick: () => {},
                  },
                ]}
              />
            </Box>
          </Box>

          {/* Title Section - Das war der fehlende Teil! */}
          <CardContent
            className='grow flex items-center justify-center p-4'
            sx={{
              background: 'rgba(0, 0, 0, 1)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Tooltip title='Breaking Bad' arrow>
              <Typography
                variant='body1'
                className='text-white text-center'
                sx={{
                  maxWidth: '100%',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  height: '3em',
                  lineHeight: '1.5em',
                  wordBreak: 'break-word',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  // Keine hover-Effekte für Tour-Version
                }}
              >
                Breaking Bad
              </Typography>
            </Tooltip>
          </CardContent>
        </Card>
      </Suspense>
    </div>
  );
};
