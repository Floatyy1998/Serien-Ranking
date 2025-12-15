import {
  AddPhotoAlternate,
  ChatBubbleOutline,
  Close,
  Delete,
  Edit,
  ExpandLess,
  ExpandMore,
  Favorite,
  FavoriteBorder,
  Flag,
  Person,
  Send,
  Visibility,
  VisibilityOff,
  Warning,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { useDiscussionReplies, useDiscussions } from '../hooks/useDiscussions';
import { Discussion, DiscussionItemType, DiscussionReply } from '../types/Discussion';

interface DiscussionThreadProps {
  itemId: number;
  itemType: DiscussionItemType;
  seasonNumber?: number;
  episodeNumber?: number;
  title?: React.ReactNode;
  isWatched?: boolean; // For spoiler protection on episodes
}

// Format timestamp to relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min.`;
  if (hours < 24) return `vor ${hours} Std.`;
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(timestamp).toLocaleDateString('de-DE');
};

// Extract image URLs from content
const extractImageUrls = (content: string): { text: string; images: string[] } => {
  const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/gi;
  const images: string[] = [];
  const text = content.replace(imageRegex, (match) => {
    images.push(match);
    return '';
  }).trim();
  return { text, images };
};

// Image Preview Component
const ImagePreview: React.FC<{ src: string; onRemove?: () => void }> = ({ src, onRemove }) => {
  const { currentTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(true)}
      >
        <img
          src={src}
          alt="Bild"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '400px',
            objectFit: 'contain',
            borderRadius: '12px',
            border: `1px solid ${currentTheme.border.default}`,
            background: currentTheme.background.surface,
          }}
        />
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Close style={{ fontSize: '18px' }} />
          </button>
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.9)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={src}
              alt="Bild"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Close style={{ fontSize: '24px' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Single Reply Component
const ReplyItem: React.FC<{
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
      <div
        onClick={() => navigate(`/friend/${reply.userId}`)}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          flexShrink: 0,
          cursor: 'pointer',
          border: `2px solid ${currentTheme.border.default}`,
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
        {!reply.userPhotoURL && <Person style={{ fontSize: '15px', color: 'white' }} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span
            onClick={() => navigate(`/friend/${reply.userId}`)}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: currentTheme.text.primary,
              cursor: 'pointer',
            }}
          >
            {reply.username}
          </span>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
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
              <p style={{ fontSize: '14px', color: currentTheme.text.secondary, margin: '0 0 8px 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {text}
              </p>
            )}

            {/* Images */}
            {images.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
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
              {isLiked ? <Favorite style={{ fontSize: '16px' }} /> : <FavoriteBorder style={{ fontSize: '16px' }} />}
              {reply.likes.length > 0 && reply.likes.length}
            </button>

            {/* Flag as Spoiler (non-owners only, if not already spoiler) */}
            {!isOwner && !reply.isSpoiler && currentUserId && !showSpoilerConfirm && (
              <button
                onClick={() => setShowSpoilerConfirm(true)}
                title="Als Spoiler melden"
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
            )}

            {/* Spoiler Confirm - inline */}
            {showSpoilerConfirm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: currentTheme.status.warning }}>Als Spoiler?</span>
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
              <button
                onClick={() => setIsEditing(true)}
                title="Bearbeiten"
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
            )}

            {/* Delete Button (owner only) */}
            {isOwner && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Löschen"
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

// Replies Section Component
const RepliesSection: React.FC<{
  discussionId: string;
  discussionPath: string;
  replyCount: number;
  isSpoilerHidden?: boolean;
}> = ({ discussionId, discussionPath, replyCount, isSpoilerHidden = false }) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [isExpanded, setIsExpanded] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Always pass discussionId so createReply works, only load replies when expanded
  const { replies, loading, createReply, editReply, deleteReply, toggleReplyLike } = useDiscussionReplies(
    discussionId,
    discussionPath,
    isExpanded // Only fetch replies when expanded
  );
  const [newReplyIsSpoiler, setNewReplyIsSpoiler] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!user?.uid || uploadingImage) return;

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const storageRef = firebase.storage().ref(`discussions/${user.uid}/${timestamp}_${file.name}`);
      await storageRef.put(file);
      const downloadURL = await storageRef.getDownloadURL();
      setReplyImages((prev) => [...prev, downloadURL]);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const removeReplyImage = (imageUrl: string) => {
    setReplyImages((prev) => prev.filter((img) => img !== imageUrl));
  };

  const handleSubmitReply = async () => {
    if ((!newReply.trim() && replyImages.length === 0) || submitting) return;
    setSubmitting(true);
    // Combine text and images when submitting
    const fullContent = [newReply.trim(), ...replyImages].filter(Boolean).join('\n');
    const success = await createReply(fullContent, newReplyIsSpoiler);
    if (success) {
      setNewReply('');
      setReplyImages([]);
      setNewReplyIsSpoiler(false);
    }
    setSubmitting(false);
  };

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Toggle Button */}
      <button
        onClick={() => !isSpoilerHidden && setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isExpanded ? `${currentTheme.primary}15` : isSpoilerHidden ? `${currentTheme.status.warning}10` : 'transparent',
          border: `1px solid ${isExpanded ? currentTheme.primary + '40' : isSpoilerHidden ? currentTheme.status.warning + '30' : 'transparent'}`,
          padding: '8px 14px',
          cursor: isSpoilerHidden ? 'not-allowed' : 'pointer',
          color: isSpoilerHidden ? currentTheme.status.warning : currentTheme.primary,
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: '20px',
          transition: 'all 0.2s',
          opacity: isSpoilerHidden ? 0.7 : 1,
        }}
        title={isSpoilerHidden ? 'Zeige zuerst den Spoiler an, um Antworten zu sehen' : undefined}
      >
        {isSpoilerHidden ? <VisibilityOff style={{ fontSize: '18px' }} /> : <ChatBubbleOutline style={{ fontSize: '18px' }} />}
        {replyCount > 0 ? `${replyCount} Antworten` : 'Antworten'}
        {!isSpoilerHidden && (isExpanded ? <ExpandLess style={{ fontSize: '20px' }} /> : <ExpandMore style={{ fontSize: '20px' }} />)}
      </button>

      {/* Replies List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {loading ? (
                <div style={{ padding: '16px', color: currentTheme.text.muted, fontSize: '14px', textAlign: 'center' }}>
                  Lädt Antworten...
                </div>
              ) : (
                replies.map((reply) => (
                  <ReplyItem
                    key={reply.id}
                    reply={reply}
                    onDelete={() => deleteReply(reply.id)}
                    onEdit={(input) => editReply(reply.id, input)}
                    onToggleLike={() => toggleReplyLike(reply.id)}
                    isOwner={reply.userId === user?.uid}
                    currentUserId={user?.uid}
                  />
                ))
              )}

              {/* New Reply Input */}
              {user && (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginLeft: '12px',
                    marginTop: '8px',
                    alignItems: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: `2px solid ${currentTheme.border.default}`,
                      background: currentTheme.background.card,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Images inside input field */}
                    {replyImages.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {replyImages.map((img, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <img
                              src={img}
                              alt="Bild"
                              style={{
                                maxWidth: '150px',
                                maxHeight: '100px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: `1px solid ${currentTheme.border.default}`,
                              }}
                            />
                            <button
                              onClick={() => removeReplyImage(img)}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: currentTheme.status.error,
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Close style={{ fontSize: '14px' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      placeholder={replyImages.length > 0 ? "Beschreibung (optional)..." : "Antwort schreiben..."}
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      rows={1}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: currentTheme.text.primary,
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        minHeight: '24px',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          color: uploadingImage ? currentTheme.primary : currentTheme.text.muted,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <AddPhotoAlternate style={{ fontSize: '18px' }} />
                        {uploadingImage && <span style={{ fontSize: '11px', marginLeft: '3px' }}>...</span>}
                      </button>
                      {/* Spoiler Toggle */}
                      <button
                        onClick={() => setNewReplyIsSpoiler(!newReplyIsSpoiler)}
                        title={newReplyIsSpoiler ? 'Spoiler-Markierung entfernen' : 'Als Spoiler markieren'}
                        style={{
                          background: newReplyIsSpoiler ? `${currentTheme.status.warning}20` : 'transparent',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          color: newReplyIsSpoiler ? currentTheme.status.warning : currentTheme.text.muted,
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px',
                        }}
                      >
                        <Warning style={{ fontSize: '18px' }} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitReply}
                    disabled={(!newReply.trim() && replyImages.length === 0) || submitting || uploadingImage}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      flexShrink: 0,
                      background: (newReply.trim() || replyImages.length > 0) ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info})` : currentTheme.background.surface,
                      color: (newReply.trim() || replyImages.length > 0) ? '#fff' : currentTheme.text.muted,
                      cursor: (newReply.trim() || replyImages.length > 0) ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: (newReply.trim() || replyImages.length > 0) ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Send style={{ fontSize: '18px' }} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Single Discussion Component
const DiscussionItem: React.FC<{
  discussion: Discussion;
  discussionPath: string;
  onDelete: () => void;
  onEdit: (input: { title?: string; content?: string; isSpoiler?: boolean }) => Promise<boolean>;
  onToggleLike: () => void;
  isOwner: boolean;
  currentUserId?: string;
}> = ({ discussion, discussionPath, onDelete, onEdit, onToggleLike, isOwner, currentUserId }) => {
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
            <button
              onClick={() => setShowSpoilerConfirm(true)}
              title="Als Spoiler melden"
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
              <button
                onClick={() => setIsEditing(true)}
                title="Bearbeiten"
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
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Löschen"
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
      </div>

      {/* Replies Section */}
      <RepliesSection
        discussionId={discussion.id}
        discussionPath={discussionPath}
        replyCount={discussion.replyCount}
        isSpoilerHidden={discussion.isSpoiler && !showSpoiler}
      />
    </motion.div>
  );
};

// New Discussion Form
const NewDiscussionForm: React.FC<{
  onSubmit: (data: { title: string; content: string; isSpoiler: boolean }) => Promise<boolean>;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!user?.uid || uploadingImage) return;

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const storageRef = firebase.storage().ref(`discussions/${user.uid}/${timestamp}_${file.name}`);
      await storageRef.put(file);
      const downloadURL = await storageRef.getDownloadURL();
      setPreviewImages((prev) => [...prev, downloadURL]);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
    e.target.value = '';
  };

  const removeImage = (imageUrl: string) => {
    setPreviewImages((prev) => prev.filter((img) => img !== imageUrl));
  };

  const handleSubmit = async () => {
    if (!title.trim() || (!content.trim() && previewImages.length === 0) || submitting) return;
    setSubmitting(true);
    // Combine text and images when submitting
    const fullContent = [content.trim(), ...previewImages].filter(Boolean).join('\n');
    const success = await onSubmit({ title: title.trim(), content: fullContent, isSpoiler });
    if (success) {
      setTitle('');
      setContent('');
      setIsSpoiler(false);
      setPreviewImages([]);
      onCancel();
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      style={{
        background: `linear-gradient(145deg, ${currentTheme.background.card}, ${currentTheme.background.surface})`,
        borderRadius: '20px',
        padding: '24px',
        border: `2px solid ${currentTheme.primary}40`,
        marginBottom: '20px',
        boxShadow: `0 8px 32px ${currentTheme.primary}20`,
      }}
    >
      <h4 style={{ fontSize: '16px', fontWeight: 700, color: currentTheme.text.primary, margin: '0 0 16px 0' }}>
        Neue Diskussion starten
      </h4>

      <input
        type="text"
        placeholder="Gib deiner Diskussion einen Titel..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: '100%',
          padding: '14px 18px',
          marginBottom: '12px',
          borderRadius: '12px',
          border: `2px solid ${currentTheme.border.default}`,
          background: currentTheme.background.surface,
          color: currentTheme.text.primary,
          fontSize: '15px',
          fontWeight: 600,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
      />

      {/* Content Input with embedded images */}
      <div
        style={{
          marginBottom: '12px',
          borderRadius: '12px',
          border: `2px solid ${currentTheme.border.default}`,
          background: currentTheme.background.surface,
          padding: '14px 18px',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
      >
        {/* Image Previews inside input */}
        {previewImages.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {previewImages.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={img}
                  alt="Bild"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                />
                <button
                  onClick={() => removeImage(img)}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: currentTheme.status.error,
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Close style={{ fontSize: '16px' }} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          placeholder={previewImages.length > 0 ? "Beschreibung hinzufügen (optional)..." : "Was möchtest du diskutieren? Teile deine Gedanken..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={previewImages.length > 0 ? 2 : 4}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            color: currentTheme.text.primary,
            fontSize: '15px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Actions Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${currentTheme.border.default}`,
              background: 'transparent',
              color: uploadingImage ? currentTheme.primary : currentTheme.text.secondary,
              cursor: uploadingImage ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <AddPhotoAlternate style={{ fontSize: '20px' }} />
            {uploadingImage ? 'Lädt...' : 'Bild'}
          </button>

          {/* Spoiler Toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${isSpoiler ? currentTheme.status.warning + '60' : currentTheme.border.default}`,
              background: isSpoiler ? `${currentTheme.status.warning}15` : 'transparent',
              fontSize: '13px',
              fontWeight: 500,
              color: isSpoiler ? currentTheme.status.warning : currentTheme.text.secondary,
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={isSpoiler}
              onChange={(e) => setIsSpoiler(e.target.checked)}
              style={{ display: 'none' }}
            />
            <Warning style={{ fontSize: '18px' }} />
            Spoiler
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: `1px solid ${currentTheme.border.default}`,
              background: 'transparent',
              color: currentTheme.text.secondary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Abbrechen
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!title.trim() || (!content.trim() && previewImages.length === 0) || submitting || uploadingImage}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: title.trim() && (content.trim() || previewImages.length > 0) ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info})` : currentTheme.background.surface,
              color: title.trim() && (content.trim() || previewImages.length > 0) ? '#fff' : currentTheme.text.muted,
              cursor: title.trim() && (content.trim() || previewImages.length > 0) ? 'pointer' : 'default',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: title.trim() && (content.trim() || previewImages.length > 0) ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {submitting ? 'Wird gepostet...' : 'Posten'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
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
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: currentTheme.text.muted,
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '32px',
              height: '32px',
              border: `3px solid ${currentTheme.border.default}`,
              borderTopColor: currentTheme.primary,
              borderRadius: '50%',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ fontSize: '14px', margin: 0 }}>Diskussionen werden geladen...</p>
        </div>
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
