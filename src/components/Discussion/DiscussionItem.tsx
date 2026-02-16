import {
  Delete,
  Edit,
  Favorite,
  FavoriteBorder,
  Flag,
  Person,
  Warning,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Discussion, DiscussionFeedMetadata } from '../../types/Discussion';
import { ImagePreview } from './ImagePreview';
import { RepliesSection } from './RepliesSection';
import { extractImageUrls, formatRelativeTime } from './utils';

export const DiscussionItem: React.FC<{
  discussion: Discussion;
  discussionPath: string;
  onDelete: () => void;
  onEdit: (input: { title?: string; content?: string; isSpoiler?: boolean }) => Promise<boolean>;
  onToggleLike: () => void;
  isOwner: boolean;
  currentUserId?: string;
  feedMetadata?: DiscussionFeedMetadata;
}> = ({ discussion, discussionPath, onDelete, onEdit, onToggleLike, isOwner, currentUserId, feedMetadata }) => {
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div
          onClick={() => navigate(`/friend/${discussion.userId}`)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            flexShrink: 0,
            cursor: 'pointer',
            border: `2px solid ${currentTheme.primary}40`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
          {!discussion.userPhotoURL && <Person style={{ fontSize: '20px', color: 'white' }} />}
        </div>

        {/* Title & Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
            <span
              onClick={() => navigate(`/friend/${discussion.userId}`)}
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: currentTheme.text.primary,
                cursor: 'pointer',
              }}
            >
              {discussion.username}
            </span>
            <span style={{ fontSize: '11px', color: currentTheme.text.muted }}>
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
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                <Warning style={{ fontSize: '12px' }} />
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
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                ANGEPINNT
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons - inline mit Bestätigungen */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          {/* Spoiler Flag Button */}
          {!isOwner && !discussion.isSpoiler && currentUserId && !showSpoilerConfirm && (
            <Tooltip title="Als Spoiler melden" arrow>
              <button
                onClick={() => setShowSpoilerConfirm(true)}
                style={{
                  background: `${currentTheme.status.warning}15`,
                  border: 'none',
                  padding: '6px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: currentTheme.status.warning,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Flag style={{ fontSize: '18px' }} />
              </button>
            </Tooltip>
          )}

          {/* Spoiler Confirm - inline */}
          {showSpoilerConfirm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: currentTheme.status.warning, fontWeight: 500 }}>Spoiler?</span>
              <button
                onClick={handleFlagAsSpoiler}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: currentTheme.status.warning,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Ja
              </button>
              <button
                onClick={() => setShowSpoilerConfirm(false)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border.default}`,
                  background: 'transparent',
                  color: currentTheme.text.secondary,
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Nein
              </button>
            </div>
          )}

          {/* Edit/Delete Buttons */}
          {isOwner && !showDeleteConfirm && !showSpoilerConfirm && (
            <>
              <Tooltip title="Bearbeiten" arrow>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: `${currentTheme.primary}15`,
                    border: 'none',
                    padding: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: currentTheme.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Edit style={{ fontSize: '18px' }} />
                </button>
              </Tooltip>
              <Tooltip title="Löschen" arrow>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    background: `${currentTheme.status.error}15`,
                    border: 'none',
                    padding: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: currentTheme.status.error,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Delete style={{ fontSize: '18px' }} />
                </button>
              </Tooltip>
            </>
          )}

          {/* Delete Confirm - inline */}
          {showDeleteConfirm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: currentTheme.status.error, fontWeight: 500 }}>Löschen?</span>
              <button
                onClick={handleDelete}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: currentTheme.status.error,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Ja
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${currentTheme.border.default}`,
                  background: 'transparent',
                  color: currentTheme.text.secondary,
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Nein
              </button>
            </div>
          )}
        </div>
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
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            marginBottom: '16px',
            padding: '16px',
            background: currentTheme.background.surface,
            borderRadius: '12px',
            border: `2px solid ${currentTheme.primary}40`,
          }}
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Titel"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border.default}`,
              background: currentTheme.background.card,
              color: currentTheme.text.primary,
              fontSize: '15px',
              fontWeight: 600,
              boxSizing: 'border-box',
            }}
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Inhalt"
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border.default}`,
              background: currentTheme.background.card,
              color: currentTheme.text.primary,
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${editIsSpoiler ? currentTheme.status.warning + '60' : currentTheme.border.default}`,
                background: editIsSpoiler ? `${currentTheme.status.warning}15` : 'transparent',
                color: editIsSpoiler ? currentTheme.status.warning : currentTheme.text.secondary,
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={editIsSpoiler}
                onChange={(e) => setEditIsSpoiler(e.target.checked)}
                style={{ display: 'none' }}
              />
              <Warning style={{ fontSize: '18px' }} />
              Spoiler
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(discussion.title);
                  setEditContent(discussion.content);
                  setEditIsSpoiler(discussion.isSpoiler || false);
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${currentTheme.border.default}`,
                  background: 'transparent',
                  color: currentTheme.text.secondary,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || saving}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: editTitle.trim() ? currentTheme.primary : currentTheme.background.surface,
                  color: editTitle.trim() ? '#fff' : currentTheme.text.muted,
                  cursor: editTitle.trim() ? 'pointer' : 'default',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      {!isEditing && (
        discussion.isSpoiler && !showSpoiler ? (
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
              fontSize: '14px',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: text ? '16px' : 0 }}>
                {images.map((img, i) => (
                  <ImagePreview key={i} src={img} />
                ))}
              </div>
            )}
          </>
        )
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${currentTheme.border.default}` }}>
        <Tooltip title={isLiked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'} arrow>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onToggleLike}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isLiked ? `${currentTheme.status.error}15` : 'transparent',
              border: `1px solid ${isLiked ? currentTheme.status.error + '40' : currentTheme.border.default}`,
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              color: isLiked ? '#e91e63' : currentTheme.text.muted,
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {isLiked ? <Favorite style={{ fontSize: '20px' }} /> : <FavoriteBorder style={{ fontSize: '20px' }} />}
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
