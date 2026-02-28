import { Delete, Edit, Favorite, FavoriteBorder, Flag, Person, Warning } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { DiscussionReply } from '../../types/Discussion';
import { ImagePreview } from './ImagePreview';
import { extractImageUrls, formatRelativeTime } from './utils';

export const ReplyItem: React.FC<{
  reply: DiscussionReply;
  onDelete: () => void;
  onEdit: (input: { content?: string; isSpoiler?: boolean }) => Promise<boolean>;
  onToggleLike: () => void;
  isOwner: boolean;
  currentUserId?: string;
}> = ({ reply, onDelete, onEdit, onToggleLike, isOwner, currentUserId }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const isLiked = currentUserId ? reply.likes.includes(currentUserId) : false;
  const { text, images } = extractImageUrls(reply.content);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [editIsSpoiler, setEditIsSpoiler] = useState(reply.isSpoiler || false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSpoilerConfirm, setShowSpoilerConfirm] = useState(false);

  const handleSaveEdit = async () => {
    setSaving(true);
    const success = await onEdit({
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        display: 'flex',
        gap: '10px',
        padding: '12px',
        background: `linear-gradient(135deg, ${currentTheme.background.surface}80, ${currentTheme.background.card}60)`,
        borderRadius: '12px',
        marginLeft: '12px',
        borderLeft: `3px solid ${reply.isSpoiler ? currentTheme.status.warning : currentTheme.primary}60`,
      }}
    >
      {/* Avatar */}
      <button
        onClick={() => navigate(`/friend/${reply.userId}`)}
        aria-label={`Profil von ${reply.username} anzeigen`}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          flexShrink: 0,
          cursor: 'pointer',
          border: `2px solid ${currentTheme.border.default}`,
          padding: 0,
          ...(reply.userPhotoURL
            ? {
                backgroundImage: `url("${reply.userPhotoURL}")`,
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
        {!reply.userPhotoURL && (
          <Person style={{ fontSize: '15px', color: 'white' }} aria-hidden="true" />
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => navigate(`/friend/${reply.userId}`)}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: currentTheme.text.primary,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            {reply.username}
          </button>
          <span style={{ fontSize: '10px', color: currentTheme.text.muted }}>
            {formatRelativeTime(reply.createdAt)}
            {reply.updatedAt && ' (bearb.)'}
          </span>
          {reply.isSpoiler && (
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
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <div style={{ marginBottom: '8px' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: `1px solid ${currentTheme.border.default}`,
                background: currentTheme.background.card,
                color: currentTheme.text.primary,
                fontSize: '13px',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${editIsSpoiler ? currentTheme.status.warning + '60' : currentTheme.border.default}`,
                  background: editIsSpoiler ? `${currentTheme.status.warning}15` : 'transparent',
                  color: editIsSpoiler ? currentTheme.status.warning : currentTheme.text.secondary,
                  fontSize: '12px',
                }}
              >
                <input
                  type="checkbox"
                  checked={editIsSpoiler}
                  onChange={(e) => setEditIsSpoiler(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <Warning style={{ fontSize: '14px' }} />
                Spoiler
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(reply.content);
                    setEditIsSpoiler(reply.isSpoiler || false);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${currentTheme.border.default}`,
                    background: 'transparent',
                    color: currentTheme.text.secondary,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: currentTheme.primary,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {saving ? '...' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        ) : reply.isSpoiler && !showSpoiler ? (
          <button
            onClick={() => setShowSpoiler(true)}
            style={{
              padding: '10px 14px',
              background: `${currentTheme.status.warning}15`,
              border: `1px dashed ${currentTheme.status.warning}40`,
              borderRadius: '8px',
              color: currentTheme.status.warning,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}
          >
            <Warning style={{ fontSize: '16px' }} />
            Spoiler anzeigen
          </button>
        ) : (
          <>
            {text && (
              <p
                style={{
                  fontSize: '14px',
                  color: currentTheme.text.secondary,
                  margin: '0 0 8px 0',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
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
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                {images.map((img, i) => (
                  <ImagePreview key={i} src={img} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        {!isEditing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Tooltip title={isLiked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'} arrow>
              <button
                onClick={onToggleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isLiked ? `${currentTheme.status.error}15` : 'transparent',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  color: isLiked ? '#e91e63' : currentTheme.text.muted,
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {isLiked ? (
                  <Favorite style={{ fontSize: '16px' }} />
                ) : (
                  <FavoriteBorder style={{ fontSize: '16px' }} />
                )}
                {reply.likes.length > 0 && reply.likes.length}
              </button>
            </Tooltip>

            {/* Flag as Spoiler (non-owners only, if not already spoiler) */}
            {!isOwner && !reply.isSpoiler && currentUserId && !showSpoilerConfirm && (
              <Tooltip title="Als Spoiler melden" arrow>
                <button
                  onClick={() => setShowSpoilerConfirm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    color: currentTheme.status.warning,
                    transition: 'all 0.2s',
                  }}
                >
                  <Flag style={{ fontSize: '16px' }} />
                </button>
              </Tooltip>
            )}

            {/* Spoiler Confirm - inline */}
            {showSpoilerConfirm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: currentTheme.status.warning }}>
                  Als Spoiler?
                </span>
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

            {/* Edit Button (owner only) */}
            {isOwner && !showDeleteConfirm && (
              <Tooltip title="Bearbeiten" arrow>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    color: currentTheme.text.muted,
                    transition: 'all 0.2s',
                  }}
                >
                  <Edit style={{ fontSize: '16px' }} />
                </button>
              </Tooltip>
            )}

            {/* Delete Button (owner only) */}
            {isOwner && !showDeleteConfirm && (
              <Tooltip title="Löschen" arrow>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    color: currentTheme.text.muted,
                    transition: 'all 0.2s',
                  }}
                >
                  <Delete style={{ fontSize: '16px' }} />
                </button>
              </Tooltip>
            )}

            {/* Delete Confirm - inline */}
            {showDeleteConfirm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: currentTheme.status.error }}>Löschen?</span>
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
        )}
      </div>
    </motion.div>
  );
};
