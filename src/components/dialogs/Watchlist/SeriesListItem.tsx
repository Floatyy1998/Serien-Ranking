import { Box, IconButton } from '@mui/material';
import { Check } from 'lucide-react';
import React from 'react';
import { Series } from '../../../interfaces/Series';
import { DraggableSeriesItem } from './DraggableSeriesItem';

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
  formatDate: (date: Date) => string;
  onWatchedToggle: () => void;
}

const SeriesListItem: React.FC<SeriesListItemProps> = ({
  series,
  index = 0,
  draggable = false,
  moveItem,
  nextUnwatchedEpisode,
  formatDate,
  onWatchedToggle,
}) => {
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
        <div className='font-medium text-[#00fed7]'>{series.title}</div>
        {nextUnwatchedEpisode ? (
          <>
            <div className='mt-1 text-xs text-gray-400'>
              Nächste Folge: S{nextUnwatchedEpisode.seasonNumber + 1} E
              {nextUnwatchedEpisode.episodeIndex + 1} -{' '}
              {nextUnwatchedEpisode.name}
            </div>
            <div className='mt-1 text-xs text-gray-400'>
              Erscheinungsdatum:{' '}
              {formatDate(new Date(nextUnwatchedEpisode.air_date))}
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
