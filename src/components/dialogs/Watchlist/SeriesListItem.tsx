import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Check } from 'lucide-react';
import React from 'react';
import { Series } from '../../../interfaces/Series';
import { getFormattedDate } from '../../../utils/date.utils';
import { DraggableSeriesItem } from './DraggableSeriesItem';

// Hilfsfunktion für Rewatch-Farben
const getRewatchColor = (watchCount: number): string => {
  switch (watchCount) {
    case 2:
      return '#ff9800'; // Orange
    case 3:
      return '#f44336'; // Rot
    case 4:
      return '#9c27b0'; // Lila
    case 5:
      return '#3f51b5'; // Indigo
    case 6:
      return '#2196f3'; // Blau
    case 7:
      return '#00bcd4'; // Cyan
    case 8:
      return '#4caf50'; // Grün
    case 9:
      return '#8bc34a'; // Hellgrün
    case 10:
      return '#cddc39'; // Lime
    default:
      return watchCount > 10 ? '#ffc107' : '#00fed7'; // Gold für >10, sonst Standard
  }
};

// Neue Hilfsfunktion, um verbleibende Folgen zu zählen
const countRemainingEpisodes = (series: Series): number => {
  const now = new Date();
  let count = 0;

  // Überprüfung, ob seasons existiert und ein Array ist
  if (!series.seasons || !Array.isArray(series.seasons)) {
    return count;
  }

  for (const season of series.seasons) {
    // Überprüfung, ob episodes existiert und ein Array ist
    if (!season.episodes || !Array.isArray(season.episodes)) {
      continue;
    }

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
    isRewatch?: boolean;
    currentWatchCount?: number;
    targetWatchCount?: number;
  } | null;
  rewatchInfo?: {
    seasonNumber: number;
    episodeIndex: number;
    air_date: string;
    name: string;
    isRewatch: boolean;
    currentWatchCount: number;
    targetWatchCount: number;
  } | null;
  onWatchedToggle: () => void;
  // Neuer Callback für Klick auf den Serientitel
  onTitleClick?: (series: Series) => void;
}
const SeriesListItem: React.FC<SeriesListItemProps> = ({
  series,
  index = 0,
  draggable = false,
  moveItem,
  nextUnwatchedEpisode,
  rewatchInfo,
  onWatchedToggle,
  onTitleClick,
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
        <div
          className='font-medium text-[#00fed7]'
          style={{ cursor: onTitleClick ? 'pointer' : 'default' }}
          onClick={(e) => {
            e.stopPropagation();
            onTitleClick && onTitleClick(series);
          }}
        >
          {series.title}
          {!isMobile && remaining > 0 && !nextUnwatchedEpisode?.isRewatch && (
            <span className='text-xs text-gray-500 ml-2'>
              ({remaining} {remaining === 1 ? 'Folge' : 'Folgen'} übrig)
            </span>
          )}
        </div>
        {isMobile && remaining > 0 && !nextUnwatchedEpisode?.isRewatch && (
          <div className='text-xs text-gray-500'>
            ({remaining} {remaining === 1 ? 'Folge' : 'Folgen'} übrig)
          </div>
        )}
        {nextUnwatchedEpisode || rewatchInfo ? (
          <>
            {/* Zeige nächste Episode (höchste Priorität) */}
            {nextUnwatchedEpisode && !nextUnwatchedEpisode.isRewatch && (
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
            )}

            {/* Zeige Rewatch-Info (zusätzlich oder alleine) */}
            {rewatchInfo && (
              <>
                <div className='mt-1 text-xs text-gray-400'>
                  <span
                    style={{
                      color: getRewatchColor(rewatchInfo.targetWatchCount || 2),
                    }}
                  >
                    Rewatch:
                  </span>{' '}
                  S{rewatchInfo.seasonNumber + 1} E
                  {rewatchInfo.episodeIndex + 1} - {rewatchInfo.name}
                </div>
                <div
                  className='mt-1 text-xs'
                  style={{
                    color: getRewatchColor(rewatchInfo.targetWatchCount || 2),
                  }}
                >
                  Fortschritt:{' '}
                  <span
                    style={{
                      color: getRewatchColor(
                        rewatchInfo.currentWatchCount || 1
                      ),
                    }}
                  >
                    {rewatchInfo.currentWatchCount}x
                  </span>{' '}
                  →{' '}
                  <span
                    style={{
                      color: getRewatchColor(rewatchInfo.targetWatchCount || 2),
                    }}
                  >
                    {rewatchInfo.targetWatchCount}x
                  </span>
                </div>
              </>
            )}

            {/* Fallback: Nur Rewatch als nächste Episode */}
            {nextUnwatchedEpisode &&
              nextUnwatchedEpisode.isRewatch &&
              !rewatchInfo && (
                <>
                  <div className='mt-1 text-xs text-gray-400'>
                    <span
                      style={{
                        color: getRewatchColor(
                          nextUnwatchedEpisode.targetWatchCount || 2
                        ),
                      }}
                    >
                      Rewatch:
                    </span>{' '}
                    S{nextUnwatchedEpisode.seasonNumber + 1} E
                    {nextUnwatchedEpisode.episodeIndex + 1} -{' '}
                    {nextUnwatchedEpisode.name}
                  </div>
                  <div
                    className='mt-1 text-xs'
                    style={{
                      color: getRewatchColor(
                        nextUnwatchedEpisode.targetWatchCount || 2
                      ),
                    }}
                  >
                    Fortschritt:{' '}
                    <span
                      style={{
                        color: getRewatchColor(
                          nextUnwatchedEpisode.currentWatchCount || 1
                        ),
                      }}
                    >
                      {nextUnwatchedEpisode.currentWatchCount}x
                    </span>{' '}
                    →{' '}
                    <span
                      style={{
                        color: getRewatchColor(
                          nextUnwatchedEpisode.targetWatchCount || 2
                        ),
                      }}
                    >
                      {nextUnwatchedEpisode.targetWatchCount}x
                    </span>
                  </div>
                </>
              )}
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
