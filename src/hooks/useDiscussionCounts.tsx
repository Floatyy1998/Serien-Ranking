import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

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
  const [count, setCount] = useState(0);

  const path =
    itemType === 'episode' && seasonNumber !== undefined && episodeNumber !== undefined
      ? `discussions/episode/${itemId}_s${seasonNumber}_e${episodeNumber}`
      : `discussions/${itemType}/${itemId}`;

  useEffect(() => {
    if (!itemId) return;

    // Check cache first
    if (countsCache[path] !== undefined) {
      setCount(countsCache[path]);
    }

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

// Get total discussion count for a series (all episodes + series itself)
export const useTotalSeriesDiscussionCount = (seriesId: number): number => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!seriesId) return;

    // Listen to series discussions
    const seriesRef = firebase.database().ref(`discussions/series/${seriesId}`);

    // Listen to all episode discussions for this series
    const episodesRef = firebase.database().ref('discussions/episode');

    let seriesCount = 0;
    let episodeCounts: { [key: string]: number } = {};

    const updateTotal = () => {
      const episodeTotal = Object.values(episodeCounts).reduce((sum, c) => sum + c, 0);
      setCount(seriesCount + episodeTotal);
    };

    const handleSeriesValue = (snapshot: firebase.database.DataSnapshot) => {
      const data = snapshot.val();
      seriesCount = data ? Object.keys(data).length : 0;
      updateTotal();
    };

    const handleEpisodesValue = (snapshot: firebase.database.DataSnapshot) => {
      const data = snapshot.val();
      episodeCounts = {};
      if (data) {
        Object.entries(data).forEach(([key, discussions]: [string, unknown]) => {
          if (key.startsWith(`${seriesId}_s`)) {
            episodeCounts[key] = discussions
              ? Object.keys(discussions as Record<string, unknown>).length
              : 0;
          }
        });
      }
      updateTotal();
    };

    seriesRef.on('value', handleSeriesValue);
    episodesRef.on('value', handleEpisodesValue);

    return () => {
      seriesRef.off('value', handleSeriesValue);
      episodesRef.off('value', handleEpisodesValue);
    };
  }, [seriesId]);

  return count;
};

// Simple badge component for discussion count
export const DiscussionBadge: React.FC<{
  count: number;
  size?: 'small' | 'medium';
  style?: React.CSSProperties;
}> = ({ count, size = 'small', style }) => {
  const { currentTheme } = useTheme();

  if (count === 0) return null;

  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '3px' : '4px',
        padding: isSmall ? '2px 6px' : '4px 8px',
        background: `${currentTheme.primary}26`,
        color: currentTheme.primary,
        borderRadius: '10px',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 600,
        ...style,
      }}
    >
      {count}
    </span>
  );
};
