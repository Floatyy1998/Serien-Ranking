import { Box, Card, CardContent, Skeleton } from '@mui/material';
import { memo, useEffect, useState } from 'react';

interface LoadingCardProps {
  /**
   * Ob es sich um eine Movie-Karte handelt (für unterschiedliche Höhen)
   * @default false
   */
  isMovie?: boolean;
  /**
   * Ob ein Skeleton angezeigt werden soll (true) oder ein Spinner (false)
   * @default true
   */
  useSkeleton?: boolean;
  /**
   * Nach welcher Zeit soll von Skeleton auf Spinner gewechselt werden (in ms)
   * @default 1500
   */
  switchAfter?: number;
}

const LoadingCard = memo(
  ({
    isMovie = false,
    useSkeleton = true,
    switchAfter = 1500,
  }: LoadingCardProps) => {
    const [showSkeleton, setShowSkeleton] = useState(useSkeleton);

    useEffect(() => {
      if (!useSkeleton) return;

      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, switchAfter);

      return () => clearTimeout(timer);
    }, [useSkeleton, switchAfter]);

    if (showSkeleton) {
      // Skeleton-Version - sieht aus wie eine echte Karte
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
          {/* Poster Area */}
          <Box
            className='relative aspect-2/3'
            sx={{ backgroundColor: 'rgba(50, 50, 50, 0.3)' }}
          >
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

            {/* Provider Icons */}
            <Box className='absolute top-2 left-2 flex gap-1'>
              <Box className='bg-black/50 backdrop-blur-xs rounded-lg p-1 w-9 h-9'>
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
            </Box>

            {/* Episode Info für Serien */}
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
              </Box>
            )}

            {/* Watchlist Button */}
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

          {/* Title Area */}
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
    }

    // Spinner-Version - eleganter als die Skeleton-Version
    return (
      <Card
        className='h-full transition-shadow duration-300 flex flex-col'
        sx={{
          boxShadow: `rgba(0, 0, 0, 0.2) 8px 8px 20px 0px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px;`,
          height: '445px',
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            margin: 'auto',
            padding: '20px',
          }}
        >
          <div className='w-12 h-12 border-2 border-[#00fed7] border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <div className='text-gray-400 text-sm'>Wird geladen...</div>
        </Box>
      </Card>
    );
  }
);

LoadingCard.displayName = 'LoadingCard';

export default LoadingCard;
