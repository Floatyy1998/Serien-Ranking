import { useCallback, useEffect, useState } from 'react';
import { dbRef, serverIncrement } from '../services/db/ref';
import { useAuth } from '../contexts/AuthContext';
import type {
  DiscussionFeedMetadata,
  DiscussionItemType,
  DiscussionReply,
} from '../types/Discussion';
import { writeDiscussionFeedEntry } from '../services/discussionFeedService';
import { ADMIN_UID } from '../config/admin';
import { sendNotificationToUser } from './useDiscussionHelpers';
import { getUserDisplayData } from '../services/firebase/userDisplayData';
import { queueModerationScan } from '../services/moderation/moderationScan';
import { t, tLocale } from '../services/i18n';

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
  const [loading, setLoading] = useState(!!discussionId && shouldFetch);
  const [error, setError] = useState<string | null>(null);

  const repliesPath = `discussionReplies/${discussionId}`;

  // Fetch replies with realtime listener
  useEffect(() => {
    if (!discussionId || !shouldFetch) return;

    const ref = dbRef(repliesPath);

    const listener = ref.orderByChild('createdAt').on(
      'value',
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const replyList: DiscussionReply[] = Object.entries(
            data as Record<string, DiscussionReply>
          )
            .map(([id, reply]) => ({
              ...reply,
              id,
              likes: reply.likes ? Object.keys(reply.likes) : [],
            }))
            // KI-Quarantäne: versteckte Inhalte sieht nur der Autor selbst
            .filter((reply) => !reply.hidden || reply.userId === user?.uid);
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
        setError(t('Fehler beim Laden der Antworten'));
        setLoading(false);
      }
    );

    return () => {
      ref.off('value', listener);
      setLoading(true);
      setReplies([]);
    };
  }, [discussionId, repliesPath, shouldFetch, user?.uid]);

  // Create a reply
  const createReply = useCallback(
    async (content: string, isSpoiler?: boolean): Promise<boolean> => {
      if (!user?.uid || !discussionId) return false;

      setError(null);
      try {
        const { username, photoURL } = await getUserDisplayData(user);

        const newReply: Omit<DiscussionReply, 'id'> = {
          userId: user.uid,
          username,
          content,
          createdAt: Date.now(),
          likes: [],
          ...(isSpoiler && { isSpoiler: true }),
        };
        // Only add userPhotoURL if it exists (Firebase doesn't accept undefined)
        if (photoURL) {
          (newReply as Omit<DiscussionReply, 'id'> & { userPhotoURL?: string }).userPhotoURL =
            photoURL;
        }

        // Add reply
        const replyRef = await dbRef(repliesPath).push(newReply);

        // KI-Moderations-Scan (fire-and-forget)
        void queueModerationScan({
          kind: 'reply',
          path: `${repliesPath}/${replyRef.key}`,
          text: content,
          userId: user.uid,
          username,
        });

        // Update reply count and lastReplyAt on discussion
        const discussionRef = dbRef(`${discussionPath}/${discussionId}`);
        const discussionSnapshot = await discussionRef.once('value');
        const discussion = discussionSnapshot.val();

        await discussionRef.update({
          replyCount: serverIncrement(1),
          lastReplyAt: Date.now(),
        });

        // Get all participants (discussion author + all reply authors)
        const participantIds = new Set<string>();

        // Add discussion author
        if (discussion?.userId) {
          participantIds.add(discussion.userId);
        }

        // Add all reply authors
        const existingRepliesSnapshot = await dbRef(repliesPath).once('value');
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
          const template = isAuthor
            ? '{name} hat auf deine Diskussion "{title}" geantwortet'
            : '{name} hat auch auf "{title}" geantwortet';
          const vars = { name: username, title: discussion?.title ?? '' };
          await sendNotificationToUser(participantId, {
            type: 'discussion_reply',
            title: 'Neue Antwort',
            titleEn: tLocale('en', 'Neue Antwort'),
            message: tLocale('de', template, vars),
            messageEn: tLocale('en', template, vars),
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
            discussionId: discussionId,
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
        setError(t('Fehler beim Erstellen der Antwort'));
        return false;
      }
    },
    [user, discussionId, repliesPath, discussionPath, feedMetadata]
  );

  // Edit a reply (owner can edit all, others can only mark as spoiler)
  const editReply = useCallback(
    async (replyId: string, input: EditReplyInput): Promise<boolean> => {
      if (!user?.uid || !discussionId) return false;

      setError(null);
      try {
        const replyRef = dbRef(`${repliesPath}/${replyId}`);
        const snapshot = await replyRef.once('value');
        const reply = snapshot.val();

        const isOwner = reply?.userId === user.uid;

        // Non-owners can only set isSpoiler to true (flag as spoiler)
        if (!isOwner) {
          if (input.content !== undefined) {
            setError(t('Du kannst nur eigene Antworten bearbeiten'));
            return false;
          }
          // Non-owners can only add spoiler flag, not remove it
          if (input.isSpoiler === false) {
            setError(t('Nur der Autor kann die Spoiler-Markierung entfernen'));
            return false;
          }
        }

        const updates: Record<string, unknown> = {};

        // Only set updatedAt if content changed (not just spoiler flag by others)
        if (isOwner && input.content !== undefined) {
          updates.updatedAt = Date.now();
          // Übersetzungs-Cache passt nach einer Textänderung nicht mehr
          updates.translations = null;
          updates.lang = null;
        }

        if (input.content !== undefined) updates.content = input.content;
        if (input.isSpoiler !== undefined) updates.isSpoiler = input.isSpoiler;

        await replyRef.update(updates);

        // Send notification to reply owner if non-owner flagged as spoiler
        if (!isOwner && input.isSpoiler === true && reply?.userId) {
          const { username } = await getUserDisplayData(user);

          const vars = {
            name: username,
            snippet:
              reply.content.length > 50 ? reply.content.substring(0, 50) + '...' : reply.content,
          };
          await sendNotificationToUser(reply.userId, {
            type: 'spoiler_flag',
            title: 'Spoiler-Markierung',
            titleEn: tLocale('en', 'Spoiler-Markierung'),
            message: tLocale(
              'de',
              '{name} hat deinen Kommentar als Spoiler markiert: "{snippet}"',
              vars
            ),
            messageEn: tLocale(
              'en',
              '{name} hat deinen Kommentar als Spoiler markiert: "{snippet}"',
              vars
            ),
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
        setError(t('Fehler beim Bearbeiten der Antwort'));
        return false;
      }
    },
    [user, discussionId, repliesPath, discussionPath]
  );

  // Delete a reply (only owner)
  const deleteReply = useCallback(
    async (replyId: string): Promise<boolean> => {
      if (!user?.uid || !discussionId) return false;

      setError(null);
      try {
        const replyRef = dbRef(`${repliesPath}/${replyId}`);
        const snapshot = await replyRef.once('value');
        const reply = snapshot.val();

        if (reply?.userId !== user.uid && user.uid !== ADMIN_UID) {
          setError(t('Du kannst nur eigene Antworten löschen'));
          return false;
        }

        await replyRef.remove();

        // Update reply count on discussion
        const discussionRef = dbRef(`${discussionPath}/${discussionId}`);
        await discussionRef.update({
          replyCount: serverIncrement(-1),
        });

        return true;
      } catch (err) {
        console.error('Error deleting reply:', err);
        setError(t('Fehler beim Löschen der Antwort'));
        return false;
      }
    },
    [user, discussionId, repliesPath, discussionPath]
  );

  // Toggle like on a reply
  const toggleReplyLike = useCallback(
    async (replyId: string): Promise<void> => {
      if (!user?.uid) return;

      setError(null);
      try {
        const likeRef = dbRef(`${repliesPath}/${replyId}/likes/${user.uid}`);
        const snapshot = await likeRef.once('value');

        if (snapshot.exists()) {
          await likeRef.remove();
        } else {
          await likeRef.set(true);

          // Send notification to reply author (if not self)
          const replySnapshot = await dbRef(`${repliesPath}/${replyId}`).once('value');
          const reply = replySnapshot.val();
          if (reply && reply.userId !== user.uid) {
            const { username } = await getUserDisplayData(user);

            const vars = {
              name: username,
              snippet:
                reply.content.length > 50 ? reply.content.substring(0, 50) + '...' : reply.content,
            };
            await sendNotificationToUser(reply.userId, {
              type: 'discussion_like',
              title: 'Neue Reaktion',
              titleEn: tLocale('en', 'Neue Reaktion'),
              message: tLocale('de', '{name} gefällt deine Antwort: "{snippet}"', vars),
              messageEn: tLocale('en', '{name} gefällt deine Antwort: "{snippet}"', vars),
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
