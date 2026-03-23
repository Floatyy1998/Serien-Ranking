import { Favorite, FavoriteBorder, Person, Warning } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Discussion, DiscussionFeedMetadata } from '../../types/Discussion';
import { DiscussionActions } from './DiscussionActions';
import { DiscussionEditForm } from './DiscussionEditForm';
import { ImagePreview } from './ImagePreview';
import { RepliesSection } from './RepliesSection';
import { extractImageUrls, formatRelativeTime } from './utils';

const DiscussionItemInner: React.FC<{
  discussion: Discussion;
  discussionPath: string;
  onDelete: () => void;
  onEdit: (input: { title?: string; content?: string; isSpoiler?: boolean }) => Promise<boolean>;
  onToggleLike: () => void;
  isOwner: boolean;
  currentUserId?: string;
  feedMetadata?: DiscussionFeedMetadata;
}> = ({
  discussion,
  discussionPath,
  onDelete,
  onEdit,
  onToggleLike,
  isOwner,
  currentUserId,
  feedMetadata,
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const isLiked = currentUserId ? discussion.likes.includes(currentUserId) : false;
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(discussion.title);
  const [editContent, setEditContent] = useState(discussion.content);
  const [editIsSpoiler, setEditIsSpoiler] = useState(discussion.isSpoiler || false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSpoilerConfirm, setShowSpoilerConfirm] = useState(false);
  const { text, images } = extractImageUrls(discussion.content);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    const success = await onEdit({
      title: editTitle.trim(),
      content: editContent.trim(),
      isSpoiler: editIsSpoiler,
    });
    if (success) {
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleFlagAsSpoiler = async () => {
    await onEdit({ isSpoiler: true });
    setShowSpoilerConfirm(false);
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: `linear-gradient(145deg, ${currentTheme.background.card}, ${currentTheme.background.surface}80)`,
        borderRadius: '16px',
        padding: '14px',
        border: `1px solid ${currentTheme.border.default}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <button
          onClick={() => navigate(`/friend/${discussion.userId}`)}
          aria-label={`Profil von ${discussion.username} anzeigen`}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            flexShrink: 0,
            cursor: 'pointer',
            border: `2px solid ${currentTheme.primary}40`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: 0,
            ...(discussion.userPhotoURL
              ? {
                  backgroundImage: `url("${discussion.userPhotoURL}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }),
          }}
        >
          {!discussion.userPhotoURL && (
            <Person
              style={{ fontSize: '20px', color: currentTheme.text.primary }}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Title & Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              marginBottom: '2px',
            }}
          >
            <button
              onClick={() => navigate(`/friend/${discussion.userId}`)}
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: currentTheme.text.primary,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                padding: 0,
              }}
            >
              {discussion.username}
            </button>
            <span style={{ fontSize: '12px', color: currentTheme.text.muted }}>
              {formatRelativeTime(discussion.createdAt)}
              {discussion.updatedAt && ' (bearb.)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {discussion.isSpoiler && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  background: `${currentTheme.status.warning}25`,
                  color: currentTheme.status.warning,
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                <Warning style={{ fontSize: '13px' }} />
                SPOILER
              </span>
            )}
            {discussion.isPinned && (
              <span
                style={{
                  padding: '2px 6px',
                  background: `${currentTheme.primary}25`,
                  color: currentTheme.primary,
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ANGEPINNT
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <DiscussionActions
          isOwner={isOwner}
          isSpoiler={discussion.isSpoiler || false}
          currentUserId={currentUserId}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          showSpoilerConfirm={showSpoilerConfirm}
          setShowSpoilerConfirm={setShowSpoilerConfirm}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          onFlagAsSpoiler={handleFlagAsSpoiler}
        />
      </div>

      {/* Title */}
      <h4
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: currentTheme.text.primary,
          margin: '0 0 10px 0',
          lineHeight: 1.3,
        }}
      >
        {discussion.title}
      </h4>

      {/* Edit Form */}
      {isEditing && (
        <DiscussionEditForm
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editContent={editContent}
          setEditContent={setEditContent}
          editIsSpoiler={editIsSpoiler}
          setEditIsSpoiler={setEditIsSpoiler}
          saving={saving}
          onSave={handleSaveEdit}
          onCancel={() => {
            setIsEditing(false);
            setEditTitle(discussion.title);
            setEditContent(discussion.content);
            setEditIsSpoiler(discussion.isSpoiler || false);
          }}
        />
      )}

      {/* Content */}
      {!isEditing &&
        (discussion.isSpoiler && !showSpoiler ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSpoiler(true)}
            style={{
              width: '100%',
              padding: '20px',
              background: `linear-gradient(135deg, ${currentTheme.status.warning}15, ${currentTheme.status.warning}08)`,
              border: `2px dashed ${currentTheme.status.warning}40`,
              borderRadius: '12px',
              color: currentTheme.status.warning,
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Warning style={{ fontSize: '20px' }} />
            Spoiler anzeigen
          </motion.button>
        ) : (
          <>
            {text && (
              <p
                style={{
                  fontSize: '15px',
                  color: currentTheme.text.secondary,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                }}
              >
                {text}
              </p>
            )}

            {/* Images */}
            {images.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: text ? '16px' : 0,
                }}
              >
                {images.map((img, i) => (
                  <ImagePreview key={i} src={img} />
                ))}
              </div>
            )}
          </>
        ))}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <Tooltip title={isLiked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'} arrow>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onToggleLike();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isLiked ? `${currentTheme.status.error}15` : 'transparent',
              border: `1px solid ${isLiked ? currentTheme.status.error + '40' : currentTheme.border.default}`,
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              color: isLiked ? currentTheme.accent : currentTheme.text.muted,
              fontSize: '15px',
              fontWeight: 600,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {isLiked ? (
              <Favorite style={{ fontSize: '20px' }} />
            ) : (
              <FavoriteBorder style={{ fontSize: '20px' }} />
            )}
            {discussion.likes.length > 0 ? discussion.likes.length : 'Gefällt mir'}
          </motion.button>
        </Tooltip>
      </div>

      {/* Replies Section */}
      <RepliesSection
        discussionId={discussion.id}
        discussionPath={discussionPath}
        replyCount={discussion.replyCount}
        isSpoilerHidden={discussion.isSpoiler && !showSpoiler}
        feedMetadata={feedMetadata}
      />
    </motion.div>
  );
};

export const DiscussionItem = memo(DiscussionItemInner);
DiscussionItem.displayName = 'DiscussionItem';
