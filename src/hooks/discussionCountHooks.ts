import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';

interface DiscussionCounts {
  [key: string]: number;
}

// Cache for discussion counts to avoid re-fetching
const countsCache: DiscussionCounts = {};

// Get discussion count for a single item
export const useDiscussionCount = (
  itemType: 'series' | 'movie' | 'episode',
  itemId: number,
  seasonNumber?: number,
  episodeNumber?: number
): number => {
  const path =
    itemType === 'episode' && seasonNumber !== undefined && episodeNumber !== undefined
      ? `discussions/episode/${itemId}_s${seasonNumber}_e${episodeNumber}`
      : `discussions/${itemType}/${itemId}`;

  const [count, setCount] = useState(() => countsCache[path] ?? 0);

  useEffect(() => {
    if (!itemId) return;

    const ref = firebase.database().ref(path);

    const handleValue = (snapshot: firebase.database.DataSnapshot) => {
      const data = snapshot.val();
      const discussionCount = data ? Object.keys(data).length : 0;
      countsCache[path] = discussionCount;
      setCount(discussionCount);
    };

    ref.on('value', handleValue);

    return () => {
      ref.off('value', handleValue);
    };
  }, [path, itemId]);

  return count;
};

// Get discussion counts for multiple episodes of a series
export const useEpisodeDiscussionCounts = (
  seriesId: number,
  seasonNumber: number,
  episodeCount: number
): DiscussionCounts => {
  const [counts, setCounts] = useState<DiscussionCounts>({});

  useEffect(() => {
    if (!seriesId || !episodeCount) return;

    const unsubscribes: (() => void)[] = [];

    for (let ep = 1; ep <= episodeCount; ep++) {
      const path = `discussions/episode/${seriesId}_s${seasonNumber}_e${ep}`;
      const ref = firebase.database().ref(path);

      const handleValue = (snapshot: firebase.database.DataSnapshot) => {
        const data = snapshot.val();
        const count = data ? Object.keys(data).length : 0;
        setCounts((prev) => ({ ...prev, [ep]: count }));
      };

      ref.on('value', handleValue);
      unsubscribes.push(() => ref.off('value', handleValue));
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [seriesId, seasonNumber, episodeCount]);

  return counts;
};
