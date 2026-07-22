import { ChatBubbleOutline, Movie, Reply, Tv } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { PageLayout, PageHeader, SkeletonListRow, EmptyState } from '../../components/ui';
import type { FeedFilterType } from '../../hooks/useDiscussionFeed';
import { useDiscussionFeed } from '../../hooks/useDiscussionFeed';
import { formatRelativeTime } from '../../components/Discussion/utils';
import { t } from '../../services/i18n';
import type { DiscussionFeedEntry } from '../../types/Discussion';
import { tapScale, tapScaleSmall } from '../../lib/motion';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

const FILTER_TABS: { id: FeedFilterType; label: string }[] = [
  { id: 'all', label: t('Alle') },
  { id: 'series', label: t('Serien') },
  { id: 'movie', label: t('Filme') },
  { id: 'episode', label: t('Episoden') },
];

const FeedCard: React.FC<{
  entry: DiscussionFeedEntry;
  index: number;
  onClick: () => void;
}> = ({ entry, index, onClick }) => {
  const { currentTheme } = useTheme();

  const isReply = entry.type === 'reply_created';
  const actionText = isReply ? t('hat geantwortet auf') : t('hat eine Diskussion gestartet in');
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
      whileTap={tapScaleSmall}
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
            decoding="async"
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
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fff',
                    userSelect: 'none',
                  }),
            }}
          >
            {!entry.userPhotoURL && (entry.username?.trim().charAt(0).toUpperCase() || '')}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: currentTheme.text.primary }}>
            {entry.username}
          </span>
          <span style={{ fontSize: '13px', color: currentTheme.text.muted }}>{actionText}</span>
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
              fontSize: '15px',
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
              fontSize: '13px',
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
            fontSize: '14px',
            color: currentTheme.text.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isReply && <Reply style={{ fontSize: '15px', color: currentTheme.text.muted }} />}
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
        <span style={{ fontSize: '12px', color: currentTheme.text.muted }}>
          {formatRelativeTime(entry.createdAt)}
        </span>
      </div>
    </motion.div>
  );
};

export const DiscussionFeedPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { isDesktop } = useDeviceType();
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
      <PageHeader title={t('Diskussions-Feed')} icon={<ChatBubbleOutline />} />

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
            whileTap={tapScale}
            onClick={() => {
              setFilter(tab.id);
            }}
            style={{
              /* Desktop: kompakte Pills statt Vollbreite-Streifen */
              flex: isDesktop ? 'none' : 1,
              padding: isDesktop ? '12px 28px' : '12px',
              background:
                filter === tab.id
                  ? `color-mix(in srgb, ${currentTheme.primary} 18%, rgba(255, 255, 255, 0.04))`
                  : currentTheme.background.card,
              border:
                filter === tab.id
                  ? `1px solid ${currentTheme.primary}55`
                  : `1px solid ${currentTheme.border.default}`,
              borderRadius: '14px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: filter === tab.id ? currentTheme.primary : currentTheme.text.muted,
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: filter === tab.id ? `0 4px 15px ${currentTheme.primary}22` : 'none',
            }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div role="status" aria-label={t('Diskussionen werden geladen')}>
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonListRow key={i} avatarShape="card" />
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              padding: '16px',
              background: `${currentTheme.status.error}15`,
              borderRadius: '14px',
              color: currentTheme.status.error,
              fontSize: '15px',
              border: `1px solid ${currentTheme.status.error}30`,
            }}
          >
            {error}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<ChatBubbleOutline style={{ fontSize: '48px' }} />}
            title={t('Noch keine Diskussionen')}
            description={
              filter !== 'all'
                ? filter === 'movie'
                  ? t('Keine Film-Diskussionen vorhanden')
                  : filter === 'episode'
                    ? t('Keine Episoden-Diskussionen vorhanden')
                    : t('Keine Serien-Diskussionen vorhanden')
                : t('Es wurden noch keine Diskussionen gestartet')
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
                /* Desktop: Karten-Grid statt gestreckter Vollbreite-Zeilen */
                display: 'grid',
                gridTemplateColumns: isDesktop
                  ? 'repeat(auto-fill, minmax(min(100%, 560px), 1fr))'
                  : '1fr',
                gap: '12px',
                alignItems: 'start',
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
