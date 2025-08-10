import CloseIcon from '@mui/icons-material/Close';
import { Box, DialogTitle, IconButton } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { getUnifiedEpisodeDate } from '../../../../lib/date/episodeDate.utils';

export const DialogHeader = ({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Sicheres Focus-Management für Accessibility
    const timer = setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <DialogTitle
      ref={titleRef}
      tabIndex={-1}
      sx={{ position: 'relative', textAlign: 'center', outline: 'none' }}
    >
      {title}
      <IconButton
        aria-label='close'
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8, color: 'red' }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
  );
};

export const TabPanel = (props: {
  children: React.ReactNode;
  value: number;
  index: number;
}) => {
  const { children, value, index, ...other } = props;
  return (
    <div role='tabpanel' hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const NextEpisodeDisplay = ({ episode }: { episode: any }) => {
  // React 19 optimiert Funktionen automatisch - kein useMemo/useCallback nötig
  return (
    <Box className='mb-6 rounded-xl border border-[#00fed7]/8 bg-black/40 p-3 text-sm backdrop-blur-sm'>
      <div className='font-medium text-[#00fed7]'>
        Nächste Folge: S{episode.seasonNumber} E{episode.episodeNumber} -{' '}
        {episode.name}
      </div>
      <div className='mt-1 text-xs text-gray-400'>
        Erscheinungsdatum: {getUnifiedEpisodeDate(episode.air_date)}
      </div>
    </Box>
  );
};
