import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { DiscussionFeedMetadata, DiscussionItemType, DiscussionReply } from '../types/Discussion';
import { writeDiscussionFeedEntry } from '../services/discussionFeedService';
import { sendNotificationToUser } from './useDiscussionHelpers';

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

export const useDiscussionReplies = (
  discussionId: string | null,
  discussionPath: string,
  shouldFetch: boolean = true,
  feedMetadata?: DiscussionFeedMetadata
): UseDiscussionRepliesResult => {
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
          const replyList: DiscussionReply[] = Object.entries(
            data as Record<string, DiscussionReply>
          ).map(([id, reply]) => ({
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
  const createReply = useCallback(
    async (content: string, isSpoiler?: boolean): Promise<boolean> => {
      if (!user?.uid || !discussionId) return false;

      try {
        // Get user data (displayName is stored at users/{uid}, not users/{uid}/profile)
        const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userData = userSnapshot.val() || {};
        const username =
          userData.displayName || user.displayName || user.email?.split('@')[0] || 'Anonym';

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
          (newReply as Omit<DiscussionReply, 'id'> & { userPhotoURL?: string }).userPhotoURL =
            photoURL;
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
              if (
                pathItemType === 'movie' ||
                pathItemType === 'series' ||
                pathItemType === 'episode'
              ) {
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
            ...(discussion.episodeNumber !== undefined && {
              episodeNumber: discussion.episodeNumber,
            }),
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
    },
    [user, discussionId, repliesPath, discussionPath, feedMetadata]
  );

  // Edit a reply (owner can edit all, others can only mark as spoiler)
  const editReply = useCallback(
    async (replyId: string, input: EditReplyInput): Promise<boolean> => {
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
    },
    [user, discussionId, repliesPath, discussionPath]
  );

  // Delete a reply (only owner)
  const deleteReply = useCallback(
    async (replyId: string): Promise<boolean> => {
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
    },
    [user, discussionId, repliesPath, discussionPath]
  );

  // Toggle like on a reply
  const toggleReplyLike = useCallback(
    async (replyId: string): Promise<void> => {
      if (!user?.uid) return;

      try {
        const likeRef = firebase.database().ref(`${repliesPath}/${replyId}/likes/${user.uid}`);
        const snapshot = await likeRef.once('value');

        if (snapshot.exists()) {
          await likeRef.remove();
        } else {
          await likeRef.set(true);

          // Send notification to reply author (if not self)
          const replySnapshot = await firebase
            .database()
            .ref(`${repliesPath}/${replyId}`)
            .once('value');
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
    },
    [user, repliesPath, discussionId, discussionPath]
  );

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
