import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import type { DiscussionFeedEntry, DiscussionItemType } from '../types/Discussion';

export type FeedFilterType = 'all' | DiscussionItemType;

interface UseDiscussionFeedResult {
  entries: DiscussionFeedEntry[];
  loading: boolean;
  error: string | null;
}

export const useDiscussionFeed = (
  filter: FeedFilterType = 'all',
  limit: number = 50
): UseDiscussionFeedResult => {
  const [entries, setEntries] = useState<DiscussionFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const ref = firebase.database().ref('discussionFeed');
    let query: firebase.database.Query;

    if (filter !== 'all') {
      query = ref.orderByChild('itemType').equalTo(filter).limitToLast(limit);
    } else {
      query = ref.orderByChild('createdAt').limitToLast(limit);
    }

    const listener = query.on(
      'value',
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val() as Record<string, Omit<DiscussionFeedEntry, 'id'>>;
          const list = Object.entries(data).map(([key, entry]) => ({
            ...entry,
            id: key,
          }));
          list.sort((a, b) => b.createdAt - a.createdAt);
          setEntries(list);
        } else {
          setEntries([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching discussion feed:', err);
        setError('Fehler beim Laden des Diskussions-Feeds');
        setLoading(false);
      }
    );

    return () => {
      query.off('value', listener);
    };
  }, [filter, limit]);

  return { entries, loading, error };
};
