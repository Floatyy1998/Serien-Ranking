import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../App';
import {
  CreateDiscussionInput,
  Discussion,
  DiscussionFeedMetadata,
  DiscussionItemType,
} from '../types/Discussion';
import {
  writeDiscussionFeedEntry,
  deleteDiscussionFeedEntries,
} from '../services/discussionFeedService';
import { getDiscussionPath, sendNotificationToUser } from './useDiscussionHelpers';

// Re-export useDiscussionReplies so existing imports continue to work
export { useDiscussionReplies } from './useDiscussionReplies';

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
  createDiscussion: (
    input: Omit<CreateDiscussionInput, 'itemId' | 'itemType' | 'seasonNumber' | 'episodeNumber'>
  ) => Promise<string | null>;
  editDiscussion: (discussionId: string, input: EditDiscussionInput) => Promise<boolean>;
  deleteDiscussion: (discussionId: string) => Promise<boolean>;
  toggleLike: (discussionId: string) => Promise<void>;
  refetch: () => void;
}

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
          const discussionList: Discussion[] = Object.entries(
            data as Record<string, Discussion>
          ).map(([id, disc]) => ({
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
  const createDiscussion = useCallback(
    async (
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
          username:
            userData.displayName || user.displayName || user.email?.split('@')[0] || 'Anonym',
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
    },
    [user, path, itemId, itemType, seasonNumber, episodeNumber, feedMetadata]
  );

  // Edit a discussion (owner can edit all, others can only mark as spoiler)
  const editDiscussion = useCallback(
    async (discussionId: string, input: EditDiscussionInput): Promise<boolean> => {
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
    },
    [user, path]
  );

  // Delete a discussion (only owner)
  const deleteDiscussion = useCallback(
    async (discussionId: string): Promise<boolean> => {
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
    },
    [user, path]
  );

  // Toggle like on a discussion
  const toggleLike = useCallback(
    async (discussionId: string): Promise<void> => {
      if (!user?.uid) return;

      try {
        const likeRef = firebase.database().ref(`${path}/${discussionId}/likes/${user.uid}`);
        const snapshot = await likeRef.once('value');

        if (snapshot.exists()) {
          await likeRef.remove();
        } else {
          await likeRef.set(true);

          // Send notification to discussion author (if not self)
          const discussionSnapshot = await firebase
            .database()
            .ref(`${path}/${discussionId}`)
            .once('value');
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
    },
    [user, path, itemId, itemType, seasonNumber, episodeNumber]
  );

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
