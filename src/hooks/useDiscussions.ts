import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../App';
import {
  CreateDiscussionInput,
  Discussion,
  DiscussionItemType,
  DiscussionReply,
} from '../types/Discussion';

interface UseDiscussionsOptions {
  itemId: number;
  itemType: DiscussionItemType;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface UseDiscussionsResult {
  discussions: Discussion[];
  loading: boolean;
  error: string | null;
  createDiscussion: (input: Omit<CreateDiscussionInput, 'itemId' | 'itemType' | 'seasonNumber' | 'episodeNumber'>) => Promise<string | null>;
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
    type: 'discussion_reply' | 'discussion_like';
    title: string;
    message: string;
    data?: any;
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
  const { itemId, itemType, seasonNumber, episodeNumber } = options;
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
          const discussionList: Discussion[] = Object.entries(data).map(([id, disc]: [string, any]) => ({
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

      return newRef.key;
    } catch (err) {
      console.error('Error creating discussion:', err);
      setError('Fehler beim Erstellen der Diskussion');
      return null;
    }
  }, [user, path, itemId, itemType, seasonNumber, episodeNumber]);

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
    deleteDiscussion,
    toggleLike,
    refetch,
  };
};

// Hook for managing replies to a discussion
interface UseDiscussionRepliesResult {
  replies: DiscussionReply[];
  loading: boolean;
  error: string | null;
  createReply: (content: string) => Promise<boolean>;
  deleteReply: (replyId: string) => Promise<boolean>;
  toggleReplyLike: (replyId: string) => Promise<void>;
}

export const useDiscussionReplies = (discussionId: string | null, discussionPath: string, shouldFetch: boolean = true): UseDiscussionRepliesResult => {
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
          const replyList: DiscussionReply[] = Object.entries(data).map(([id, reply]: [string, any]) => ({
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
  const createReply = useCallback(async (content: string): Promise<boolean> => {
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
      };
      // Only add userPhotoURL if it exists (Firebase doesn't accept undefined)
      const photoURL = userData.photoURL || user.photoURL;
      if (photoURL) {
        (newReply as any).userPhotoURL = photoURL;
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

      // Send notification to discussion author (if not self)
      if (discussion && discussion.userId !== user.uid) {
        await sendNotificationToUser(discussion.userId, {
          type: 'discussion_reply',
          title: 'Neue Antwort',
          message: `${username} hat auf deine Diskussion "${discussion.title}" geantwortet`,
          data: {
            discussionId,
            discussionPath,
          },
        });
      }

      return true;
    } catch (err) {
      console.error('Error creating reply:', err);
      setError('Fehler beim Erstellen der Antwort');
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
    deleteReply,
    toggleReplyLike,
  };
};
