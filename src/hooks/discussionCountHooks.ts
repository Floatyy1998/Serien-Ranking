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

    // Einmaliger Read statt Realtime-Listener
    ref.once('value').then((snapshot) => {
      const data = snapshot.val();
      const discussionCount = data ? Object.keys(data).length : 0;
      countsCache[path] = discussionCount;
      setCount(discussionCount);
    });
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

    // Ein einziger Batch-Read für alle Episoden der Staffel
    const parentPath = `discussions/episode`;
    const ref = firebase.database().ref(parentPath);

    // Lade alle Diskussionen die mit dieser seriesId+season beginnen
    const prefix = `${seriesId}_s${seasonNumber}_e`;
    ref
      .orderByKey()
      .startAt(prefix + '1')
      .endAt(prefix + '\uf8ff')
      .once('value')
      .then((snapshot) => {
        const data = snapshot.val();
        const newCounts: DiscussionCounts = {};

        if (data) {
          for (let ep = 1; ep <= episodeCount; ep++) {
            const key = `${seriesId}_s${seasonNumber}_e${ep}`;
            if (data[key]) {
              newCounts[ep] = Object.keys(data[key]).length;
            }
          }
        }

        setCounts(newCounts);
      });
  }, [seriesId, seasonNumber, episodeCount]);

  return counts;
};
