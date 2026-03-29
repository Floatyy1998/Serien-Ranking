import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { DiscussionItemType } from '../types/Discussion';

// Helper to generate a unique path for discussions
export const getDiscussionPath = (
  itemType: DiscussionItemType,
  itemId: number,
  seasonNumber?: number,
  episodeNumber?: number
): string => {
  if (itemType === 'episode' && seasonNumber !== undefined && episodeNumber !== undefined) {
    return `discussions/episode/${itemId}_s${seasonNumber}_e${episodeNumber}`;
  }
  return `discussions/${itemType}/${itemId}`;
};

// Helper to send notification to another user
export const sendNotificationToUser = async (
  targetUserId: string,
  notification: {
    type:
      | 'discussion_reply'
      | 'discussion_like'
      | 'spoiler_flag'
      | 'bug_ticket_reply'
      | 'bug_ticket_status';
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
