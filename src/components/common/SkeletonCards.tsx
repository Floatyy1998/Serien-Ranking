import { Box, Card, CardContent, Skeleton } from '@mui/material';
import { memo } from 'react';

interface SkeletonCardProps {
  /**
   * Anzahl der Skeleton-Karten die angezeigt werden sollen
   * @default 20
   */
  count?: number;
  /**
   * Ob es sich um eine Movie-Karte handelt (für unterschiedliche Höhen)
   * @default false
   */
  isMovie?: boolean;
}

const SkeletonCard = memo(({ isMovie = false }: { isMovie?: boolean }) => {
  return (
    <Card
      className='h-full transition-shadow duration-300 flex flex-col'
      sx={{
        boxShadow: `rgba(255, 255, 255, 0.2) 8px 8px 20px 0px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px;`,
        height: '445px',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Poster Area - genau wie die echte Karte */}
      <Box
        className='relative aspect-2/3'
        sx={{ backgroundColor: 'rgba(50, 50, 50, 0.3)' }}
      >
        {/* Poster Skeleton */}
        <Skeleton
          variant='rectangular'
          animation='wave'
          sx={{
            height: '100%',
            width: '100%',
            backgroundColor: 'rgba(100, 100, 100, 0.2)',
            borderRadius: 0,
          }}
        />

        {/* Provider Icons oben links (wie in echter Karte) */}
        <Box className='absolute top-2 left-2 flex gap-1'>
          {Array.from({ length: 2 }).map((_, index) => (
            <Box
              key={index}
              className='bg-black/50 backdrop-blur-xs rounded-lg p-1 w-9 h-9'
            >
              <Skeleton
                variant='rectangular'
                animation='wave'
                sx={{
                  height: '28px',
                  width: '28px',
                  backgroundColor: 'rgba(150, 150, 150, 0.3)',
                  borderRadius: '4px',
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Episode Info (für Serien) */}
        {!isMovie && (
          <Box
            className='absolute top-20 left-0 w-full bg-black/50 backdrop-blur-xs rounded-lg px-2 py-1 text-center'
            sx={{ height: '50px' }}
          >
            <Skeleton
              variant='text'
              animation='wave'
              sx={{
                backgroundColor: 'rgba(150, 150, 150, 0.3)',
                fontSize: '1rem',
                margin: '8px 0',
              }}
            />
            <Skeleton
              variant='text'
              animation='wave'
              sx={{
                backgroundColor: 'rgba(150, 150, 150, 0.3)',
                fontSize: '1rem',
                width: '60%',
                margin: '0 auto',
              }}
            />
          </Box>
        )}

        {/* Watchlist Button unten rechts */}
        <Box className='absolute bottom-2 right-2 bg-black/50 backdrop-blur-xs rounded-lg p-1'>
          <Skeleton
            variant='rectangular'
            animation='wave'
            sx={{
              height: '24px',
              width: '24px',
              backgroundColor: 'rgba(150, 150, 150, 0.3)',
              borderRadius: '4px',
            }}
          />
        </Box>
      </Box>

      {/* Title Area - genau wie die echte Karte */}
      <CardContent
        className='grow flex items-center justify-center'
        sx={{ padding: '16px' }}
      >
        <Skeleton
          variant='text'
          animation='wave'
          sx={{
            fontSize: '1.2rem',
            width: '90%',
            backgroundColor: 'rgba(150, 150, 150, 0.3)',
            textAlign: 'center',
          }}
        />
      </CardContent>
    </Card>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Zeigt eine Gruppe von Skeleton-Karten in einem Grid-Layout an
 * Diese sehen genau aus wie die echten Serien/Film-Karten
 */
const SkeletonCards = ({ count = 20, isMovie = false }: SkeletonCardProps) => {
  return (
    <Box className='flex-row flex flex-wrap justify-center gap-20'>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={`skeleton-${index}`} className='w-[230px]'>
          <SkeletonCard isMovie={isMovie} />
        </Box>
      ))}
    </Box>
  );
};

export default SkeletonCards;
