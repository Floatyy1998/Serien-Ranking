import {
  ChatBubbleOutline,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../../App';
import { LoadingSpinner } from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiscussions } from '../../hooks/useDiscussions';
import { DiscussionItem } from './DiscussionItem';
import { NewDiscussionForm } from './NewDiscussionForm';
import { DiscussionThreadProps } from './types';

export const DiscussionThread: React.FC<DiscussionThreadProps> = ({
  itemId,
  itemType,
  seasonNumber,
  episodeNumber,
  title,
  isWatched,
}) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [showNewForm, setShowNewForm] = useState(false);

  // Spoiler protection for unwatched episodes
  const spoilerKey = itemType === 'episode' && seasonNumber !== undefined && episodeNumber !== undefined
    ? `spoiler_revealed_${itemId}_s${seasonNumber}_e${episodeNumber}`
    : null;

  const [spoilerRevealed, setSpoilerRevealed] = useState(() => {
    if (spoilerKey) {
      return localStorage.getItem(spoilerKey) === 'true';
    }
    return true;
  });

  const handleRevealSpoiler = () => {
    setSpoilerRevealed(true);
    if (spoilerKey) {
      localStorage.setItem(spoilerKey, 'true');
    }
  };

  // Show spoiler protection if episode is not watched and user hasn't revealed
  const showSpoilerProtection = itemType === 'episode' && isWatched === false && !spoilerRevealed;

  const { discussions, loading, error, createDiscussion, editDiscussion, deleteDiscussion, toggleLike } = useDiscussions({
    itemId,
    itemType,
    seasonNumber,
    episodeNumber,
  });

  // Generate the discussion path for replies
  const discussionPath =
    itemType === 'episode' && seasonNumber !== undefined && episodeNumber !== undefined
      ? `discussions/episode/${itemId}_s${seasonNumber}_e${episodeNumber}`
      : `discussions/${itemType}/${itemId}`;

  const handleCreateDiscussion = async (data: { title: string; content: string; isSpoiler: boolean }) => {
    const id = await createDiscussion(data);
    return !!id;
  };

  // Spoiler Protection Overlay
  if (showSpoilerProtection) {
    return (
      <div
        style={{
          marginTop: '24px',
          padding: '20px',
          background: currentTheme.background.card,
          borderRadius: '20px',
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentTheme.status.warning}30, ${currentTheme.status.error}30)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <VisibilityOff style={{ fontSize: '40px', color: currentTheme.status.warning }} />
          </div>

          <h3
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: currentTheme.text.primary,
              margin: '0 0 12px 0',
            }}
          >
            Spoiler-Warnung
          </h3>

          <p
            style={{
              fontSize: '14px',
              color: currentTheme.text.secondary,
              margin: '0 0 8px 0',
              maxWidth: '300px',
              lineHeight: 1.6,
            }}
          >
            Du hast diese Episode noch nicht gesehen.
          </p>
          <p
            style={{
              fontSize: '13px',
              color: currentTheme.text.muted,
              margin: '0 0 24px 0',
              maxWidth: '300px',
            }}
          >
            Die Diskussionen könnten Spoiler enthalten.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRevealSpoiler}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: `1px solid ${currentTheme.border.default}`,
                background: currentTheme.background.surface,
                color: currentTheme.text.primary,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Visibility style={{ fontSize: '18px' }} />
              Trotzdem anzeigen
            </motion.button>
          </div>

          {discussions.length > 0 && (
            <p
              style={{
                fontSize: '12px',
                color: currentTheme.text.muted,
                marginTop: '20px',
              }}
            >
              {discussions.length} {discussions.length === 1 ? 'Diskussion' : 'Diskussionen'} versteckt
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: '24px',
        padding: '20px',
        background: currentTheme.background.card,
        borderRadius: '20px',
        border: `1px solid ${currentTheme.border.default}`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: currentTheme.text.primary,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {title || 'Diskussionen'}
          {discussions.length > 0 && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: currentTheme.text.muted,
                background: currentTheme.background.surface,
                padding: '4px 10px',
                borderRadius: '12px',
              }}
            >
              {discussions.length}
            </span>
          )}
        </h3>

        {user && !showNewForm && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewForm(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info})`,
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
          >
            + Neue Diskussion
          </motion.button>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px',
            background: `${currentTheme.status.error}15`,
            borderRadius: '12px',
            color: currentTheme.status.error,
            fontSize: '14px',
            marginBottom: '16px',
            border: `1px solid ${currentTheme.status.error}30`,
          }}
        >
          {error}
        </motion.div>
      )}

      {/* New Discussion Form */}
      <AnimatePresence>
        {showNewForm && (
          <NewDiscussionForm onSubmit={handleCreateDiscussion} onCancel={() => setShowNewForm(false)} />
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading ? (
        <LoadingSpinner size={32} text="Diskussionen werden geladen..." />
      ) : discussions.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: currentTheme.text.muted,
            background: `linear-gradient(145deg, ${currentTheme.background.surface}80, ${currentTheme.background.card})`,
            borderRadius: '16px',
            border: `2px dashed ${currentTheme.border.default}`,
          }}
        >
          <ChatBubbleOutline style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Noch keine Diskussionen</p>
          {user && (
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
              Sei der Erste und starte eine Diskussion!
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {discussions.map((discussion) => (
            <DiscussionItem
              key={discussion.id}
              discussion={discussion}
              discussionPath={discussionPath}
              onDelete={() => deleteDiscussion(discussion.id)}
              onEdit={(input) => editDiscussion(discussion.id, input)}
              onToggleLike={() => toggleLike(discussion.id)}
              isOwner={discussion.userId === user?.uid}
              currentUserId={user?.uid}
            />
          ))}
        </div>
      )}
    </div>
  );
};
