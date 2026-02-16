import { ChatBubbleOutline } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiscussionCount } from '../../hooks/useDiscussionCounts';

export const EpisodeDiscussionButton: React.FC<{
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
}> = ({ seriesId, seasonNumber, episodeNumber }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const count = useDiscussionCount('episode', seriesId, seasonNumber, episodeNumber);

  return (
    <Tooltip title={count > 0 ? `${count} Diskussion${count > 1 ? 'en' : ''}` : 'Diskussion'} arrow>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${episodeNumber}`);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: count > 0 ? currentTheme.primary : currentTheme.text.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <ChatBubbleOutline style={{ fontSize: '18px' }} />
        {count > 0 ? (
          <span style={{ fontSize: '12px', fontWeight: 600 }}>{count}</span>
        ) : null}
      </button>
    </Tooltip>
  );
};
