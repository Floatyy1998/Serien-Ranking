import { ChatBubbleOutline, Movie, Reply, Tv } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { PageLayout, PageHeader, LoadingSpinner, EmptyState } from '../../components/ui';
import { useDiscussionFeed, FeedFilterType } from '../../hooks/useDiscussionFeed';
import { formatRelativeTime } from '../../components/Discussion/utils';
import type { DiscussionFeedEntry } from '../../types/Discussion';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

const FILTER_TABS: { id: FeedFilterType; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'series', label: 'Serien' },
  { id: 'movie', label: 'Filme' },
  { id: 'episode', label: 'Episoden' },
];

const FeedCard: React.FC<{
  entry: DiscussionFeedEntry;
  index: number;
  onClick: () => void;
}> = ({ entry, index, onClick }) => {
  const { currentTheme } = useTheme();

  const isReply = entry.type === 'reply_created';
  const actionText = isReply ? 'hat geantwortet auf' : 'hat eine Diskussion gestartet in';
  const ItemIcon = entry.itemType === 'movie' ? Movie : Tv;
  const posterUrl = entry.posterPath ? `${POSTER_BASE}${entry.posterPath}` : null;

  const itemLabel =
    entry.itemType === 'episode' && entry.seasonNumber && entry.episodeNumber
      ? `${entry.itemTitle} S${entry.seasonNumber}E${entry.episodeNumber}`
      : entry.itemTitle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '14px',
        padding: '16px',
        background: currentTheme.background.surface,
        borderRadius: '16px',
        border: `1px solid ${currentTheme.border.default}`,
        cursor: 'pointer',
      }}
    >
      {/* Poster Thumbnail */}
      {posterUrl && (
        <div
          style={{
            width: '50px',
            height: '75px',
            borderRadius: '10px',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <img
            src={posterUrl}
            alt={entry.itemTitle}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* User action line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              flexShrink: 0,
              ...(entry.userPhotoURL
                ? {
                    backgroundImage: `url("${entry.userPhotoURL}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {
                    background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                  }),
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 700, color: currentTheme.text.primary }}>
            {entry.username}
          </span>
          <span style={{ fontSize: '12px', color: currentTheme.text.muted }}>{actionText}</span>
        </div>

        {/* Item info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ItemIcon
            style={{
              fontSize: '15px',
              color: entry.itemType === 'movie' ? currentTheme.status.error : currentTheme.primary,
            }}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: currentTheme.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {itemLabel}
          </span>
        </div>

        {/* Episode title if available */}
        {entry.episodeTitle && (
          <span
            style={{
              fontSize: '12px',
              color: currentTheme.text.muted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.episodeTitle}
          </span>
        )}

        {/* Discussion title or reply preview */}
        <div
          style={{
            fontSize: '13px',
            color: currentTheme.text.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isReply && <Reply style={{ fontSize: '14px', color: currentTheme.text.muted }} />}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isReply ? entry.contentPreview : entry.discussionTitle}
          </span>
        </div>

        {/* Timestamp */}
        <span style={{ fontSize: '11px', color: currentTheme.text.muted }}>
          {formatRelativeTime(entry.createdAt)}
        </span>
      </div>
    </motion.div>
  );
};

export const DiscussionFeedPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [filter, setFilter] = useState<FeedFilterType>('all');
  const { entries, loading, error } = useDiscussionFeed(filter);

  const handleCardClick = (entry: DiscussionFeedEntry) => {
    if (entry.itemType === 'episode' && entry.seasonNumber && entry.episodeNumber) {
      navigate(`/episode/${entry.itemId}/s/${entry.seasonNumber}/e/${entry.episodeNumber}`);
    } else if (entry.itemType === 'movie') {
      navigate(`/movie/${entry.itemId}`);
    } else {
      navigate(`/series/${entry.itemId}`);
    }
  };

  return (
    <PageLayout>
      <PageHeader title="Diskussions-Feed" icon={<ChatBubbleOutline />} />

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '0 20px 20px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {FILTER_TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(tab.id)}
            style={{
              flex: 1,
              padding: '12px',
              background:
                filter === tab.id
                  ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                  : currentTheme.background.card,
              border: filter === tab.id ? 'none' : `1px solid ${currentTheme.border.default}`,
              borderRadius: '14px',
              color: filter === tab.id ? 'white' : currentTheme.text.primary,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: filter === tab.id ? `0 4px 15px ${currentTheme.primary}40` : 'none',
            }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <LoadingSpinner size={40} text="Diskussionen werden geladen..." />
        ) : error ? (
          <div
            style={{
              padding: '16px',
              background: `${currentTheme.status.error}15`,
              borderRadius: '12px',
              color: currentTheme.status.error,
              fontSize: '14px',
              border: `1px solid ${currentTheme.status.error}30`,
            }}
          >
            {error}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<ChatBubbleOutline style={{ fontSize: '48px' }} />}
            title="Noch keine Diskussionen"
            description={
              filter !== 'all'
                ? `Keine ${filter === 'movie' ? 'Film' : filter === 'episode' ? 'Episoden' : 'Serien'}-Diskussionen vorhanden`
                : 'Es wurden noch keine Diskussionen gestartet'
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingBottom: '100px',
              }}
            >
              {entries.map((entry, index) => (
                <FeedCard
                  key={entry.id}
                  entry={entry}
                  index={index}
                  onClick={() => handleCardClick(entry)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageLayout>
  );
};
