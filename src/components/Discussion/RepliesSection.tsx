import {
  AddPhotoAlternate,
  ChatBubbleOutline,
  Close,
  ExpandLess,
  ExpandMore,
  Send,
  VisibilityOff,
  Warning,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import { DiscussionFeedMetadata } from '../../types/Discussion';
import { useDiscussionReplies } from '../../hooks/useDiscussions';
import { ReplyItem } from './ReplyItem';

export const RepliesSection: React.FC<{
  discussionId: string;
  discussionPath: string;
  replyCount: number;
  isSpoilerHidden?: boolean;
  feedMetadata?: DiscussionFeedMetadata;
}> = ({ discussionId, discussionPath, replyCount, isSpoilerHidden = false, feedMetadata }) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [isExpanded, setIsExpanded] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Always pass discussionId so createReply works, only load replies when expanded
  const { replies, loading, createReply, editReply, deleteReply, toggleReplyLike } =
    useDiscussionReplies(
      discussionId,
      discussionPath,
      isExpanded, // Only fetch replies when expanded
      feedMetadata
    );
  const [newReplyIsSpoiler, setNewReplyIsSpoiler] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!user?.uid || uploadingImage) return;

    setUploadingImage(true);
    try {
      const timestamp = Date.now();
      const storageRef = firebase
        .storage()
        .ref(`discussions/${user.uid}/${timestamp}_${file.name}`);
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
          background: isExpanded
            ? `${currentTheme.primary}15`
            : isSpoilerHidden
              ? `${currentTheme.status.warning}10`
              : 'transparent',
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
        {isSpoilerHidden ? (
          <VisibilityOff style={{ fontSize: '18px' }} />
        ) : (
          <ChatBubbleOutline style={{ fontSize: '18px' }} />
        )}
        {replyCount > 0 ? `${replyCount} Antworten` : 'Antworten'}
        {!isSpoilerHidden &&
          (isExpanded ? (
            <ExpandLess style={{ fontSize: '20px' }} />
          ) : (
            <ExpandMore style={{ fontSize: '20px' }} />
          ))}
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
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}
            >
              {loading ? (
                <div
                  style={{
                    padding: '16px',
                    color: currentTheme.text.muted,
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
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
                      placeholder={
                        replyImages.length > 0
                          ? 'Beschreibung (optional)...'
                          : 'Antwort schreiben...'
                      }
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
                        {uploadingImage && (
                          <span style={{ fontSize: '11px', marginLeft: '3px' }}>...</span>
                        )}
                      </button>
                      {/* Spoiler Toggle */}
                      <button
                        onClick={() => setNewReplyIsSpoiler(!newReplyIsSpoiler)}
                        title={
                          newReplyIsSpoiler
                            ? 'Spoiler-Markierung entfernen'
                            : 'Als Spoiler markieren'
                        }
                        style={{
                          background: newReplyIsSpoiler
                            ? `${currentTheme.status.warning}20`
                            : 'transparent',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          color: newReplyIsSpoiler
                            ? currentTheme.status.warning
                            : currentTheme.text.muted,
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
                    disabled={
                      (!newReply.trim() && replyImages.length === 0) || submitting || uploadingImage
                    }
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: 'none',
                      flexShrink: 0,
                      background:
                        newReply.trim() || replyImages.length > 0
                          ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info})`
                          : currentTheme.background.surface,
                      color:
                        newReply.trim() || replyImages.length > 0
                          ? '#fff'
                          : currentTheme.text.muted,
                      cursor: newReply.trim() || replyImages.length > 0 ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow:
                        newReply.trim() || replyImages.length > 0
                          ? '0 4px 12px rgba(0,0,0,0.2)'
                          : 'none',
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
