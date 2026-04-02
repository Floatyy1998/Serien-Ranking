export interface Manga {
  nmr: number;
  anilistId: number;
  title: string;
  titleEnglish?: string;
  titleRomaji?: string;
  poster: string;
  bannerImage?: string;
  description?: string;
  chapters?: number | null;
  volumes?: number | null;
  status?: string; // RELEASING, FINISHED, CANCELLED, HIATUS, NOT_YET_RELEASED
  format?: string; // MANGA, MANHWA, MANHUA, ONE_SHOT, NOVEL
  countryOfOrigin?: string; // JP, KR, CN
  genres?: string[];
  averageScore?: number | null;
  startDate?: string;
  isAdult?: boolean;
  rating: {
    [userId: string]: number;
  };
  currentChapter: number;
  currentVolume?: number;
  readStatus: 'reading' | 'completed' | 'paused' | 'dropped' | 'planned';
  hidden?: boolean;
  addedAt?: string;
  lastReadAt?: string;
  readingPlatform?: string;
  notes?: string;
  rereadCount?: number;
  startedAt?: string;
  completedAt?: string;
  latestChapterAvailable?: number;
}

export interface AniListMangaSearchResult {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    large: string;
    medium: string;
  };
  bannerImage: string | null;
  description: string | null;
  chapters: number | null;
  volumes: number | null;
  status: string;
  format: string;
  countryOfOrigin: string;
  genres: string[];
  averageScore: number | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  isAdult: boolean;
  recommendations?: {
    edges: {
      node: {
        mediaRecommendation: {
          id: number;
          title: { romaji: string; english: string | null };
          coverImage: { large: string };
          format: string;
          status: string;
        };
      };
    }[];
  };
  staff?: {
    edges: {
      node: { name: { full: string } };
      role: string;
    }[];
  };
  externalLinks?: {
    url: string;
    site: string;
  }[];
  relations?: {
    edges: {
      relationType: string;
      node: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { large: string };
        format: string;
        type: string;
      };
    }[];
  };
}
