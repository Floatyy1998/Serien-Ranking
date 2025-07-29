// import { FriendActivity } from '../contexts/FriendsProvider';

export interface BatchDetectionOptions {
  bingeTimeWindowMinutes?: number; // Zeit zwischen Episoden für Binge-Detection (default: 120 Min)
  quickwatchHoursAfterRelease?: number; // Stunden nach Veröffentlichung für Quickwatch (default: 24h)
}

export interface EpisodeWatchData {
  seriesTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string;
  watchedTimestamp: number;
  tmdbId: number;
  isRewatch?: boolean;
  watchCount?: number;
}

export interface BatchResult {
  shouldBatch: boolean;
  batchType: 'binge' | 'quickwatch' | 'season_complete' | null;
  episodes: EpisodeWatchData[];
  activityTitle: string;
  emoji: string;
}

const DEFAULT_OPTIONS: Required<BatchDetectionOptions> = {
  bingeTimeWindowMinutes: 120, // 2 Stunden
  quickwatchHoursAfterRelease: 24, // 24 Stunden
};

/**
 * Prüft ob eine Episode am Tag der Veröffentlichung geschaut wurde (Quickwatch)
 */
export const isQuickwatch = (
  airDate: string,
  watchedTimestamp: number,
  options: BatchDetectionOptions = {}
): boolean => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const airDateTime = new Date(airDate).getTime();
    const timeDiffHours = (watchedTimestamp - airDateTime) / (1000 * 60 * 60);
    
    // Episode wurde innerhalb der quickwatch-Zeit nach Veröffentlichung geschaut
    return timeDiffHours >= 0 && timeDiffHours <= opts.quickwatchHoursAfterRelease;
  } catch (error) {
    console.error('Error calculating quickwatch status:', error);
    return false;
  }
};

/**
 * Prüft ob mehrere Episoden innerhalb des Binge-Zeitfensters geschaut wurden
 */
export const detectBingeWatch = (
  episodes: EpisodeWatchData[],
  options: BatchDetectionOptions = {}
): boolean => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (episodes.length < 2) return false;
  
  // Sortiere nach Watch-Timestamp
  const sortedEpisodes = [...episodes].sort((a, b) => a.watchedTimestamp - b.watchedTimestamp);
  
  // Prüfe ob alle Episoden innerhalb des Zeitfensters geschaut wurden
  const firstWatch = sortedEpisodes[0].watchedTimestamp;
  const lastWatch = sortedEpisodes[sortedEpisodes.length - 1].watchedTimestamp;
  const timeDiffMinutes = (lastWatch - firstWatch) / (1000 * 60);
  
  return timeDiffMinutes <= opts.bingeTimeWindowMinutes;
};

/**
 * Prüft ob eine komplette Staffel geschaut wurde
 */
export const isSeasonComplete = (episodes: EpisodeWatchData[]): boolean => {
  if (episodes.length < 3) return false; // Mindestens 3 Episoden für "Staffel komplett"
  
  // Prüfe ob alle Episoden aus derselben Staffel sind
  const seasonNumber = episodes[0].seasonNumber;
  return episodes.every(ep => ep.seasonNumber === seasonNumber);
};

/**
 * Generiert Batch-Activity basierend auf den erkannten Patterns
 */
export const generateBatchActivity = (
  episodes: EpisodeWatchData[],
  options: BatchDetectionOptions = {}
): BatchResult => {
  if (episodes.length === 0) {
    return {
      shouldBatch: false,
      batchType: null,
      episodes: [],
      activityTitle: '',
      emoji: ''
    };
  }

  if (episodes.length === 1) {
    const episode = episodes[0];
    // Einzelne Episode - prüfe auf Quickwatch
    if (isQuickwatch(episode.airDate, episode.watchedTimestamp, options)) {
      const rewatchSuffix = episode.isRewatch && episode.watchCount && episode.watchCount > 1 
        ? ` (${episode.watchCount}x gesehen)` 
        : '';
      
      return {
        shouldBatch: true,
        batchType: 'quickwatch',
        episodes,
        activityTitle: `${episode.seriesTitle} - S${episode.seasonNumber}E${episode.episodeNumber} direkt nach Veröffentlichung angeschaut${rewatchSuffix}`,
        emoji: '⚡'
      };
    }
    
    // Keine Batch-Verhalten für einzelne Episode
    return {
      shouldBatch: false,
      batchType: null,
      episodes,
      activityTitle: '',
      emoji: ''
    };
  }

  // Mehrere Episoden
  const seriesTitle = episodes[0].seriesTitle;
  const isBinge = detectBingeWatch(episodes, options);
  const isCompleteSeason = isSeasonComplete(episodes);
  
  // Prüfe auf Quickwatch-Pattern bei mehreren Episoden
  const quickwatchEpisodes = episodes.filter(ep => 
    isQuickwatch(ep.airDate, ep.watchedTimestamp, options)
  );
  
  if (quickwatchEpisodes.length >= 2) {
    // Mehrere Episoden schnell nach Veröffentlichung geschaut
    return {
      shouldBatch: true,
      batchType: 'quickwatch',
      episodes,
      activityTitle: `${seriesTitle} - ${quickwatchEpisodes.length} neue Episoden direkt nach Veröffentlichung angeschaut`,
      emoji: '🔥'
    };
  }
  
  // Binge-Aktivitäten sind deaktiviert - erstelle individuelle Aktivitäten
  
  // Kein Batch-Pattern erkannt
  return {
    shouldBatch: false,
    batchType: null,
    episodes,
    activityTitle: '',
    emoji: ''
  };
};

/**
 * Extrahiert Episode-Daten aus Activity-Logs für Batch-Detection
 */
export const extractEpisodeDataFromActivity = (activity: any): EpisodeWatchData | null => {
  if (activity.type !== 'episode_watched') return null;
  
  // Parse den Activity-Titel um Episode-Infos zu extrahieren
  // Format: "SeriesTitle - Staffel X Episode Y" oder "SeriesTitle - Staffel X Episode Y (Zx gesehen)"
  const titleMatch = activity.itemTitle.match(/^(.+?) - Staffel (\d+) Episode (\d+)(?:\s*\((\d+)x gesehen\))?/);
  
  if (!titleMatch) return null;
  
  const [, seriesTitle, seasonStr, episodeStr, watchCountStr] = titleMatch;
  
  return {
    seriesTitle: seriesTitle.trim(),
    seasonNumber: parseInt(seasonStr, 10),
    episodeNumber: parseInt(episodeStr, 10),
    episodeName: '', // Nicht aus Activity-Titel extrahierbar
    airDate: '', // Müsste aus Serie-Daten geholt werden
    watchedTimestamp: activity.timestamp,
    tmdbId: activity.tmdbId || 0,
    isRewatch: watchCountStr ? true : false,
    watchCount: watchCountStr ? parseInt(watchCountStr, 10) : 1,
  };
};