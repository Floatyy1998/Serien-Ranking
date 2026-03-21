import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { DiscussionFeedEntry } from '../types/Discussion';

const FEED_PATH = 'discussionFeed';

export const writeDiscussionFeedEntry = async (
  entry: Omit<DiscussionFeedEntry, 'id'>
): Promise<string | null> => {
  try {
    const ref = firebase.database().ref(FEED_PATH);
    const newRef = await ref.push(entry);
    return newRef.key;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DiscussionFeed] Failed to write entry: ${message}`);
    return null;
  }
};

export const deleteDiscussionFeedEntries = async (discussionId: string): Promise<void> => {
  try {
    const ref = firebase.database().ref(FEED_PATH);
    const snapshot = await ref.orderByChild('discussionId').equalTo(discussionId).once('value');
    if (snapshot.exists()) {
      const updates: Record<string, null> = {};
      snapshot.forEach((child) => {
        updates[child.key!] = null;
        return false;
      });
      await ref.update(updates);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(
      `[DiscussionFeed] Failed to delete entries for discussion ${discussionId}: ${message}`
    );
  }
};
