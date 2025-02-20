import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Check } from 'lucide-react';
import React from 'react';
import { Series } from '../../../interfaces/Series';
import { getFormattedDate } from '../../../utils/date.utils';
import { DraggableSeriesItem } from './DraggableSeriesItem';

// Neue Hilfsfunktion, um verbleibende Folgen zu zählen
const countRemainingEpisodes = (series: Series): number => {
  const now = new Date();
  let count = 0;
  for (const season of series.seasons) {
    for (const episode of season.episodes) {
      if (!episode.watched && new Date(episode.air_date) <= now) {
        count++;
      }
    }
  }
  return count;
};

interface SeriesListItemProps {
  series: Series;
  index?: number;
  draggable?: boolean;
  moveItem?: (from: number, to: number) => void;
  nextUnwatchedEpisode: {
    seasonNumber: number;
    episodeIndex: number;
    air_date: string;
    name: string;
  } | null;
  onWatchedToggle: () => void;
}
const SeriesListItem: React.FC<SeriesListItemProps> = ({
  series,
  index = 0,
  draggable = false,
  moveItem,
  nextUnwatchedEpisode,
  onWatchedToggle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const remaining = countRemainingEpisodes(series);
  const content = (
    <Box
      className='mb-6 rounded-xl border border-[#00fed7]/8 bg-black/40 p-3 text-sm backdrop-blur-sm flex items-center'
      style={{ width: '100%' }}
    >
      <img
        className='w-[92px] mr-4'
        src={series.poster.poster}
        alt={series.title}
      />
      <div className='flex-1'>
        <div className='font-medium text-[#00fed7]'>
          {series.title}
          {!isMobile && remaining > 0 && (
            <span className='text-xs text-gray-500 ml-2'>
              ({remaining} {remaining === 1 ? 'Folge' : 'Folgen'} übrig)
            </span>
          )}
        </div>
        {isMobile && remaining > 0 && (
          <div className='text-xs text-gray-500'>
            ({remaining} {remaining === 1 ? 'Folge' : 'Folgen'} übrig)
          </div>
        )}
        {nextUnwatchedEpisode ? (
          <>
            <div className='mt-1 text-xs text-gray-400'>
              Nächste Folge: S{nextUnwatchedEpisode.seasonNumber + 1} E
              {nextUnwatchedEpisode.episodeIndex + 1} -{' '}
              {nextUnwatchedEpisode.name}
            </div>
            <div className='mt-1 text-xs text-gray-400'>
              Erscheinungsdatum:{' '}
              {getFormattedDate(nextUnwatchedEpisode.air_date)}
            </div>
          </>
        ) : (
          <div className='mt-1 text-xs text-gray-400'>
            Alle Episoden gesehen.
          </div>
        )}
      </div>
      {nextUnwatchedEpisode && (
        <IconButton onClick={onWatchedToggle} sx={{ color: '#00fed7' }}>
          <Check />
        </IconButton>
      )}
    </Box>
  );
  return draggable && moveItem ? (
    <DraggableSeriesItem series={series} index={index} moveItem={moveItem}>
      {content}
    </DraggableSeriesItem>
  ) : (
    content
  );
};
export default SeriesListItem;
