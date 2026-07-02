import { ChatBubbleOutline, Check, DateRange, Visibility } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import type { Series } from '../../types/Series';
import { tapScaleSmall } from '../../lib/motion';

type Episode = Series['seasons'][number]['episodes'][number];

// Static inline styles hoisted out of render (no per-render allocation)
const DISCUSSION_ICON_STYLE: CSSProperties = { fontSize: '18px' };
const DISCUSSION_COUNT_STYLE: CSSProperties = { fontSize: '13px', fontWeight: 600 };

interface EpisodeListItemProps {
  episode: Episode;
  index: number;
  seriesId: string | undefined;
  seasonNumber: number;
  discussionCount: number;
  onEpisodeClick: () => void;
}

export const EpisodeListItem = memo(
  ({
    episode,
    index,
    seriesId,
    seasonNumber,
    discussionCount,
    onEpisodeClick,
  }: EpisodeListItemProps) => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();

    return (
      <motion.div
        className={`episode-item ${episode.watched ? 'watched' : ''}`}
        whileTap={tapScaleSmall}
        onClick={onEpisodeClick}
      >
        <div className="episode-number">{index + 1}</div>

        <div className="episode-details">
          <h3>{episode.name}</h3>
          <div className="episode-meta">
            <span className="meta-item">
              <DateRange fontSize="small" />
              {getUnifiedEpisodeDate(episode.air_date)}
            </span>
            {episode.firstWatchedAt && (
              <span className="meta-item watched-date">
                <Visibility fontSize="small" />
                {getUnifiedEpisodeDate(episode.firstWatchedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Discussion Button */}
        <Tooltip title="Diskussion" arrow>
          <button
            className="episode-discussion-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${index + 1}`);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: discussionCount ? currentTheme.primary : currentTheme.text.muted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              borderRadius: '8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <ChatBubbleOutline style={DISCUSSION_ICON_STYLE} />
            {discussionCount > 0 && <span style={DISCUSSION_COUNT_STYLE}>{discussionCount}</span>}
          </button>
        </Tooltip>

        <div className="episode-status">
          {episode.watched ? (
            <div className="status-watched">
              <Check />
              {(episode.watchCount || 0) > 1 && (
                <span className="watch-count">{episode.watchCount}x</span>
              )}
            </div>
          ) : (
            <div className="status-unwatched" />
          )}
        </div>
      </motion.div>
    );
  }
);

EpisodeListItem.displayName = 'EpisodeListItem';
