import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import SkeletonCards from './SkeletonCards';

interface SmartLoaderProps {
  /**
   * Ob es sich um Movie-Karten handelt
   * @default false
   */
  isMovie?: boolean;
  /**
   * Anzahl der Skeleton-Karten
   * @default 20
   */
  count?: number;
  /**
   * Nach welcher Zeit (in ms) soll auf den Spinner gewechselt werden
   * @default 2000
   */
  switchAfter?: number;
  /**
   * Text für den Spinner
   * @default "Daten werden geladen..."
   */
  loadingText?: string;
}

/**
 * Intelligenter Loader der zuerst Skeleton-Karten zeigt und dann auf einen Spinner wechselt
 * Dies reduziert die wahrgenommene Ladezeit und verhindert "springende" Inhalte
 */
const SmartLoader = ({
  isMovie = false,
  count = 20,
  switchAfter = 2000,
  loadingText = 'Daten werden geladen...',
}: SmartLoaderProps) => {
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, switchAfter);

    return () => clearTimeout(timer);
  }, [switchAfter]);

  if (showSkeleton) {
    return <SkeletonCards count={count} isMovie={isMovie} />;
  }

  return (
    <Box className='flex justify-center items-center w-full h-64'>
      <div className='text-center'>
        <div className='w-16 h-16 border-4 border-[#00fed7] border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
        <div className='text-gray-400 text-sm'>{loadingText}</div>
        <div className='text-gray-500 text-xs mt-2'>
          Das dauert etwas länger als erwartet...
        </div>
      </div>
    </Box>
  );
};

export default SmartLoader;
