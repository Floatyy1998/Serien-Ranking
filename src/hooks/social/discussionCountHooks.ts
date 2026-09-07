import { useEffect, useState } from 'react';
import { dbRef } from '../../services/db/ref';

interface DiscussionCounts {
  [key: string]: number;
}

// Cache for discussion counts to avoid re-fetching
const countsCache: DiscussionCounts = {};

const RETRY_LIMIT = 1;
const RETRY_DELAY_MS = 2000;

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
    let cancelled = false;
    let retryId: number | undefined;

    // Einmaliger Read statt Realtime-Listener
    const load = (attempt: number) => {
      dbRef(path)
        .once('value')
        .then((snapshot) => {
          if (cancelled) return;
          const data = snapshot.val();
          const discussionCount = data ? Object.keys(data).length : 0;
          countsCache[path] = discussionCount;
          setCount(discussionCount);
        })
        .catch(() => {
          // Kommt die App aus dem Hintergrund zurueck, kann der erste Read in
          // die Token-Erneuerung laufen — die Regeln verlangen auth != null,
          // die Ablehnung war sonst eine unbehandelte Rejection. Einmal
          // nachfassen, danach bleibt die Zahl einfach aus.
          if (cancelled || attempt >= RETRY_LIMIT) return;
          retryId = window.setTimeout(() => load(attempt + 1), RETRY_DELAY_MS);
        });
    };
    load(0);

    return () => {
      cancelled = true;
      if (retryId) window.clearTimeout(retryId);
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

    // Ein einziger Batch-Read für alle Episoden der Staffel
    const parentPath = `discussions/episode`;
    const ref = dbRef(parentPath);

    // Lade alle Diskussionen die mit dieser seriesId+season beginnen
    const prefix = `${seriesId}_s${seasonNumber}_e`;
    let cancelled = false;
    let retryId: number | undefined;

    const load = (attempt: number) => {
      ref
        .orderByKey()
        .startAt(prefix + '1')
        .endAt(prefix + '\uf8ff')
        .once('value')
        .then((snapshot) => {
          if (cancelled) return;
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
        })
        .catch(() => {
          if (cancelled || attempt >= RETRY_LIMIT) return;
          retryId = window.setTimeout(() => load(attempt + 1), RETRY_DELAY_MS);
        });
    };
    load(0);

    return () => {
      cancelled = true;
      if (retryId) window.clearTimeout(retryId);
    };
  }, [seriesId, seasonNumber, episodeCount]);

  return counts;
};
