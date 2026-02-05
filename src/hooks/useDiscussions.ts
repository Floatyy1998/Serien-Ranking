import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../App';
import {
  CreateDiscussionInput,
  Discussion,
  DiscussionFeedMetadata,
  DiscussionItemType,
  DiscussionReply,
} from '../types/Discussion';
import { writeDiscussionFeedEntry, deleteDiscussionFeedEntries } from '../services/discussionFeedService';

interface UseDiscussionsOptions {
  itemId: number;
  itemType: DiscussionItemType;
  seasonNumber?: number;
  episodeNumber?: number;
  feedMetadata?: DiscussionFeedMetadata;
}

interface EditDiscussionInput {
  title?: string;
  content?: string;
  isSpoiler?: boolean;
}

interface UseDiscussionsResult {
  discussions: Discussion[];
  loading: boolean;
  error: string | null;
  createDiscussion: (input: Omit<CreateDiscussionInput, 'itemId' | 'itemType' | 'seasonNumber' | 'episodeNumber'>) => Promise<string | null>;
  editDiscussion: (discussionId: string, input: EditDiscussionInput) => Promise<boolean>;
  deleteDiscussion: (discussionId: string) => Promise<boolean>;
  toggleLike: (discussionId: string) => Promise<void>;
  refetch: () => void;
}

// Helper to generate a unique path for discussions
const getDiscussionPath = (itemType: DiscussionItemType, itemId: number, seasonNumber?: number, episodeNumber?: number): string => {
  if (itemType === 'episode' && seasonNumber !== undefined && episodeNumber !== undefined) {
    return `discussions/episode/${itemId}_s${seasonNumber}_e${episodeNumber}`;
  }
  return `discussions/${itemType}/${itemId}`;
};

// Helper to send notification to another user
const sendNotificationToUser = async (
  targetUserId: string,
  notification: {
    type: 'discussion_reply' | 'discussion_like' | 'spoiler_flag';
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) => {
  try {
    const notificationRef = firebase.database().ref(`users/${targetUserId}/notifications`);
    await notificationRef.push({
      ...notification,
      timestamp: Date.now(),
      read: false,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const useDiscussions = (options: UseDiscussionsOptions): UseDiscussionsResult => {
  const { itemId, itemType, seasonNumber, episodeNumber, feedMetadata } = options;
  const { user } = useAuth() || {};

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const path = getDiscussionPath(itemType, itemId, seasonNumber, episodeNumber);

  // Fetch discussions with realtime listener
  useEffect(() => {
    if (!itemId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = firebase.database().ref(path);

    const listener = ref.orderByChild('createdAt').on(
      'value',
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const discussionList: Discussion[] = Object.entries(data as Record<string, Discussion>).map(([id, disc]) => ({
            ...disc,
            id,
            likes: disc.likes ? Object.keys(disc.likes) : [],
          }));
          // Sort by pinned first, then by createdAt (newest first)
          discussionList.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.createdAt - a.createdAt;
          });
          setDiscussions(discussionList);
        } else {
          setDiscussions([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching discussions:', err);
        setError('Fehler beim Laden der Diskussionen');
        setLoading(false);
      }
    );

    return () => {
      ref.off('value', listener);
    };
  }, [path, itemId]);

  // Create a new discussion
  const createDiscussion = useCallback(async (
    input: Omit<CreateDiscussionInput, 'itemId' | 'itemType' | 'seasonNumber' | 'episodeNumber'>
  ): Promise<string | null> => {
    if (!user?.uid) {
      setError('Du musst eingeloggt sein um zu diskutieren');
      return null;
    }

    try {
      // Get user data for username (displayName is stored at users/{uid}, not users/{uid}/profile)
      const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
      const userData = userSnapshot.val() || {};

      const newDiscussion: Omit<Discussion, 'id'> = {
        itemId,
        itemType,
        ...(seasonNumber !== undefined && { seasonNumber }),
        ...(episodeNumber !== undefined && { episodeNumber }),
        userId: user.uid,
        username: userData.displayName || user.displayName || user.email?.split('@')[0] || 'Anonym',
        userPhotoURL: userData.photoURL || user.photoURL || undefined,
        title: input.title,
        content: input.content,
        createdAt: Date.now(),
        likes: [],
        replyCount: 0,
        isSpoiler: input.isSpoiler || false,
      };

      const ref = firebase.database().ref(path);
      const newRef = await ref.push(newDiscussion);

      // Write to discussion feed (fire-and-forget)
      if (feedMetadata?.itemTitle) {
        writeDiscussionFeedEntry({
          type: 'discussion_created',
          discussionId: newRef.key!,
          discussionTitle: input.title,
          userId: user.uid,
          username: newDiscussion.username,
          ...(newDiscussion.userPhotoURL && { userPhotoURL: newDiscussion.userPhotoURL }),
          itemType,
          itemId,
          itemTitle: feedMetadata.itemTitle,
          ...(feedMetadata.posterPath && { posterPath: feedMetadata.posterPath }),
          ...(seasonNumber !== undefined && { seasonNumber }),
          ...(episodeNumber !== undefined && { episodeNumber }),
          ...(feedMetadata.episodeTitle && { episodeTitle: feedMetadata.episodeTitle }),
          contentPreview: input.content.substring(0, 100),
          createdAt: Date.now(),
        });
      }

      return newRef.key;
    } catch (err) {
      console.error('Error creating discussion:', err);
      setError('Fehler beim Erstellen der Diskussion');
      return null;
    }
  }, [user, path, itemId, itemType, seasonNumber, episodeNumber, feedMetadata]);

  // Edit a discussion (owner can edit all, others can only mark as spoiler)
  const editDiscussion = useCallback(async (discussionId: string, input: EditDiscussionInput): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const discussionRef = firebase.database().ref(`${path}/${discussionId}`);
      const snapshot = await discussionRef.once('value');
      const discussion = snapshot.val();

      const isOwner = discussion?.userId === user.uid;

      // Non-owners can only set isSpoiler to true (flag as spoiler)
      if (!isOwner) {
        if (input.title !== undefined || input.content !== undefined) {
          setError('Du kannst nur eigene Diskussionen bearbeiten');
          return false;
        }
        // Non-owners can only add spoiler flag, not remove it
        if (input.isSpoiler === false) {
          setError('Nur der Autor kann die Spoiler-Markierung entfernen');
          return false;
        }
      }

      const updates: Record<string, unknown> = {};

      // Only set updatedAt if content/title changed (not just spoiler flag by others)
      if (isOwner && (input.title !== undefined || input.content !== undefined)) {
        updates.updatedAt = Date.now();
      }

      if (input.title !== undefined) updates.title = input.title;
      if (input.content !== undefined) updates.content = input.content;
      if (input.isSpoiler !== undefined) updates.isSpoiler = input.isSpoiler;

      await discussionRef.update(updates);

      // Send notification to discussion owner if non-owner flagged as spoiler
      if (!isOwner && input.isSpoiler === true && discussion?.userId) {
        const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userData = userSnapshot.val() || {};
        const username = userData.displayName || user.displayName || 'Jemand';

        await sendNotificationToUser(discussion.userId, {
          type: 'spoiler_flag',
          title: 'Spoiler-Markierung',
          message: `${username} hat deine Diskussion "${discussion.title}" als Spoiler markiert`,
          data: {
            discussionId,
            itemId,
            itemType,
            seasonNumber,
            episodeNumber,
          },
        });
      }

      return true;
    } catch (err) {
      console.error('Error editing discussion:', err);
      setError('Fehler beim Bearbeiten der Diskussion');
      return false;
    }
  }, [user, path]);

  // Delete a discussion (only owner)
  const deleteDiscussion = useCallback(async (discussionId: string): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const discussionRef = firebase.database().ref(`${path}/${discussionId}`);
      const snapshot = await discussionRef.once('value');
      const discussion = snapshot.val();

      if (discussion?.userId !== user.uid) {
        setError('Du kannst nur eigene Diskussionen löschen');
        return false;
      }

      await discussionRef.remove();
      // Also remove replies
      await firebase.database().ref(`discussionReplies/${discussionId}`).remove();
      // Remove feed entries (fire-and-forget)
      deleteDiscussionFeedEntries(discussionId);

      return true;
    } catch (err) {
      console.error('Error deleting discussion:', err);
      setError('Fehler beim Löschen der Diskussion');
      return false;
    }
  }, [user, path]);

  // Toggle like on a discussion
  const toggleLike = useCallback(async (discussionId: string): Promise<void> => {
    if (!user?.uid) return;

    try {
      const likeRef = firebase.database().ref(`${path}/${discussionId}/likes/${user.uid}`);
      const snapshot = await likeRef.once('value');

      if (snapshot.exists()) {
        await likeRef.remove();
      } else {
        await likeRef.set(true);

        // Send notification to discussion author (if not self)
        const discussionSnapshot = await firebase.database().ref(`${path}/${discussionId}`).once('value');
        const discussion = discussionSnapshot.val();
        if (discussion && discussion.userId !== user.uid) {
          const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
          const userData = userSnapshot.val() || {};
          const username = userData.displayName || user.displayName || 'Jemand';

          await sendNotificationToUser(discussion.userId, {
            type: 'discussion_like',
            title: 'Neue Reaktion',
            message: `${username} gefällt deine Diskussion "${discussion.title}"`,
            data: {
              discussionId,
              itemId,
              itemType,
              seasonNumber,
              episodeNumber,
            },
          });
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, [user, path, itemId, itemType, seasonNumber, episodeNumber]);

  const refetch = useCallback(() => {
    // Realtime listener handles this automatically
  }, []);

  return {
    discussions,
    loading,
    error,
    createDiscussion,
    editDiscussion,
    deleteDiscussion,
    toggleLike,
    refetch,
  };
};

// Hook for managing replies to a discussion
interface EditReplyInput {
  content?: string;
  isSpoiler?: boolean;
}

interface UseDiscussionRepliesResult {
  replies: DiscussionReply[];
  loading: boolean;
  error: string | null;
  createReply: (content: string, isSpoiler?: boolean) => Promise<boolean>;
  editReply: (replyId: string, input: EditReplyInput) => Promise<boolean>;
  deleteReply: (replyId: string) => Promise<boolean>;
  toggleReplyLike: (replyId: string) => Promise<void>;
}

export const useDiscussionReplies = (discussionId: string | null, discussionPath: string, shouldFetch: boolean = true, feedMetadata?: DiscussionFeedMetadata): UseDiscussionRepliesResult => {
  const { user } = useAuth() || {};

  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repliesPath = `discussionReplies/${discussionId}`;

  // Fetch replies with realtime listener
  useEffect(() => {
    if (!discussionId || !shouldFetch) {
      setLoading(false);
      setReplies([]);
      return;
    }

    setLoading(true);
    const ref = firebase.database().ref(repliesPath);

    const listener = ref.orderByChild('createdAt').on(
      'value',
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const replyList: DiscussionReply[] = Object.entries(data as Record<string, DiscussionReply>).map(([id, reply]) => ({
            ...reply,
            id,
            likes: reply.likes ? Object.keys(reply.likes) : [],
          }));
          // Sort by createdAt (oldest first for replies)
          replyList.sort((a, b) => a.createdAt - b.createdAt);
          setReplies(replyList);
        } else {
          setReplies([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching replies:', err);
        setError('Fehler beim Laden der Antworten');
        setLoading(false);
      }
    );

    return () => {
      ref.off('value', listener);
    };
  }, [discussionId, repliesPath, shouldFetch]);

  // Create a reply
  const createReply = useCallback(async (content: string, isSpoiler?: boolean): Promise<boolean> => {
    if (!user?.uid || !discussionId) return false;

    try {
      // Get user data (displayName is stored at users/{uid}, not users/{uid}/profile)
      const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
      const userData = userSnapshot.val() || {};
      const username = userData.displayName || user.displayName || user.email?.split('@')[0] || 'Anonym';

      const newReply: Omit<DiscussionReply, 'id'> = {
        userId: user.uid,
        username,
        content,
        createdAt: Date.now(),
        likes: [],
        ...(isSpoiler && { isSpoiler: true }),
      };
      // Only add userPhotoURL if it exists (Firebase doesn't accept undefined)
      const photoURL = userData.photoURL || user.photoURL;
      if (photoURL) {
        (newReply as Omit<DiscussionReply, 'id'> & { userPhotoURL?: string }).userPhotoURL = photoURL;
      }

      // Add reply
      await firebase.database().ref(repliesPath).push(newReply);

      // Update reply count and lastReplyAt on discussion
      const discussionRef = firebase.database().ref(`${discussionPath}/${discussionId}`);
      const discussionSnapshot = await discussionRef.once('value');
      const discussion = discussionSnapshot.val();

      await discussionRef.update({
        replyCount: firebase.database.ServerValue.increment(1),
        lastReplyAt: Date.now(),
      });

      // Get all participants (discussion author + all reply authors)
      const participantIds = new Set<string>();

      // Add discussion author
      if (discussion?.userId) {
        participantIds.add(discussion.userId);
      }

      // Add all reply authors
      const existingRepliesSnapshot = await firebase.database().ref(repliesPath).once('value');
      if (existingRepliesSnapshot.exists()) {
        const existingReplies = existingRepliesSnapshot.val();
        Object.values(existingReplies).forEach((reply: unknown) => {
          const r = reply as DiscussionReply;
          if (r?.userId) {
            participantIds.add(r.userId);
          }
        });
      }

      // Remove current user from notification list
      participantIds.delete(user.uid);

      // Send notification to all participants
      for (const participantId of participantIds) {
        const isAuthor = participantId === discussion?.userId;
        await sendNotificationToUser(participantId, {
          type: 'discussion_reply',
          title: 'Neue Antwort',
          message: isAuthor
            ? `${username} hat auf deine Diskussion "${discussion.title}" geantwortet`
            : `${username} hat auch auf "${discussion?.title}" geantwortet`,
          data: {
            discussionId,
            discussionPath,
          },
        });
      }

      // Write to discussion feed (fire-and-forget)
      if (feedMetadata?.itemTitle && discussion) {
        // Extract itemType from discussionPath if not stored in discussion
        // Path format: "discussions/{itemType}/{itemId}" or "discussions/episode/{itemId}_s{season}_e{episode}"
        let derivedItemType: DiscussionItemType = discussion.itemType || 'series';
        if (!discussion.itemType && discussionPath) {
          const pathParts = discussionPath.split('/');
          if (pathParts.length >= 2 && pathParts[0] === 'discussions') {
            const pathItemType = pathParts[1];
            if (pathItemType === 'movie' || pathItemType === 'series' || pathItemType === 'episode') {
              derivedItemType = pathItemType;
            }
          }
        }

        writeDiscussionFeedEntry({
          type: 'reply_created',
          discussionId: discussionId!,
          discussionTitle: discussion.title,
          userId: user.uid,
          username,
          ...(photoURL && { userPhotoURL: photoURL }),
          itemType: derivedItemType,
          itemId: discussion.itemId,
          itemTitle: feedMetadata.itemTitle,
          ...(feedMetadata.posterPath && { posterPath: feedMetadata.posterPath }),
          ...(discussion.seasonNumber !== undefined && { seasonNumber: discussion.seasonNumber }),
          ...(discussion.episodeNumber !== undefined && { episodeNumber: discussion.episodeNumber }),
          ...(feedMetadata.episodeTitle && { episodeTitle: feedMetadata.episodeTitle }),
          contentPreview: content.substring(0, 100),
          createdAt: Date.now(),
        });
      }

      return true;
    } catch (err) {
      console.error('Error creating reply:', err);
      setError('Fehler beim Erstellen der Antwort');
      return false;
    }
  }, [user, discussionId, repliesPath, discussionPath, feedMetadata]);

  // Edit a reply (owner can edit all, others can only mark as spoiler)
  const editReply = useCallback(async (replyId: string, input: EditReplyInput): Promise<boolean> => {
    if (!user?.uid || !discussionId) return false;

    try {
      const replyRef = firebase.database().ref(`${repliesPath}/${replyId}`);
      const snapshot = await replyRef.once('value');
      const reply = snapshot.val();

      const isOwner = reply?.userId === user.uid;

      // Non-owners can only set isSpoiler to true (flag as spoiler)
      if (!isOwner) {
        if (input.content !== undefined) {
          setError('Du kannst nur eigene Antworten bearbeiten');
          return false;
        }
        // Non-owners can only add spoiler flag, not remove it
        if (input.isSpoiler === false) {
          setError('Nur der Autor kann die Spoiler-Markierung entfernen');
          return false;
        }
      }

      const updates: Record<string, unknown> = {};

      // Only set updatedAt if content changed (not just spoiler flag by others)
      if (isOwner && input.content !== undefined) {
        updates.updatedAt = Date.now();
      }

      if (input.content !== undefined) updates.content = input.content;
      if (input.isSpoiler !== undefined) updates.isSpoiler = input.isSpoiler;

      await replyRef.update(updates);

      // Send notification to reply owner if non-owner flagged as spoiler
      if (!isOwner && input.isSpoiler === true && reply?.userId) {
        const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userData = userSnapshot.val() || {};
        const username = userData.displayName || user.displayName || 'Jemand';

        await sendNotificationToUser(reply.userId, {
          type: 'spoiler_flag',
          title: 'Spoiler-Markierung',
          message: `${username} hat deinen Kommentar als Spoiler markiert: "${reply.content.length > 50 ? reply.content.substring(0, 50) + '...' : reply.content}"`,
          data: {
            discussionId,
            discussionPath,
            replyId,
          },
        });
      }

      return true;
    } catch (err) {
      console.error('Error editing reply:', err);
      setError('Fehler beim Bearbeiten der Antwort');
      return false;
    }
  }, [user, discussionId, repliesPath, discussionPath]);

  // Delete a reply (only owner)
  const deleteReply = useCallback(async (replyId: string): Promise<boolean> => {
    if (!user?.uid || !discussionId) return false;

    try {
      const replyRef = firebase.database().ref(`${repliesPath}/${replyId}`);
      const snapshot = await replyRef.once('value');
      const reply = snapshot.val();

      if (reply?.userId !== user.uid) {
        setError('Du kannst nur eigene Antworten löschen');
        return false;
      }

      await replyRef.remove();

      // Update reply count on discussion
      const discussionRef = firebase.database().ref(`${discussionPath}/${discussionId}`);
      await discussionRef.update({
        replyCount: firebase.database.ServerValue.increment(-1),
      });

      return true;
    } catch (err) {
      console.error('Error deleting reply:', err);
      setError('Fehler beim Löschen der Antwort');
      return false;
    }
  }, [user, discussionId, repliesPath, discussionPath]);

  // Toggle like on a reply
  const toggleReplyLike = useCallback(async (replyId: string): Promise<void> => {
    if (!user?.uid) return;

    try {
      const likeRef = firebase.database().ref(`${repliesPath}/${replyId}/likes/${user.uid}`);
      const snapshot = await likeRef.once('value');

      if (snapshot.exists()) {
        await likeRef.remove();
      } else {
        await likeRef.set(true);

        // Send notification to reply author (if not self)
        const replySnapshot = await firebase.database().ref(`${repliesPath}/${replyId}`).once('value');
        const reply = replySnapshot.val();
        if (reply && reply.userId !== user.uid) {
          const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
          const userData = userSnapshot.val() || {};
          const username = userData.displayName || user.displayName || 'Jemand';

          await sendNotificationToUser(reply.userId, {
            type: 'discussion_like',
            title: 'Neue Reaktion',
            message: `${username} gefällt deine Antwort: "${reply.content.length > 50 ? reply.content.substring(0, 50) + '...' : reply.content}"`,
            data: {
              discussionId,
              discussionPath,
              replyId,
            },
          });
        }
      }
    } catch (err) {
      console.error('Error toggling reply like:', err);
    }
  }, [user, repliesPath, discussionId, discussionPath]);

  return {
    replies,
    loading,
    error,
    createReply,
    editReply,
    deleteReply,
    toggleReplyLike,
  };
};
