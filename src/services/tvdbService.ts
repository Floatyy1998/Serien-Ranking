// TVDB API Service for episode data
const TVDB_API_KEY = import.meta.env.VITE_API_TVDB;
const TVDB_API_URL = 'https://api4.thetvdb.com/v4';

let tvdbToken: string | null = null;
let tokenExpiry: Date | null = null;

// Authenticate with TVDB API
const authenticateTVDB = async (): Promise<string> => {
  // Return cached token if still valid
  if (tvdbToken && tokenExpiry && new Date() < tokenExpiry) {
    return tvdbToken;
  }

  try {
    const response = await fetch(`${TVDB_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: TVDB_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error(`TVDB Auth failed: ${response.status}`);
    }

    const data = await response.json();
    tvdbToken = data.data.token;
    // Token valid for 24 hours
    tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return tvdbToken!;
  } catch (error) {
    console.error('TVDB Authentication error:', error);
    throw error;
  }
};

// Get TVDB ID from TMDB
export const getTVDBIdFromTMDB = async (tmdbId: number): Promise<number | null> => {
  try {
    const apiKey = import.meta.env.VITE_API_TMDB;
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${apiKey}&language=en-US`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.tvdb_id || null;
  } catch (error) {
    console.error('Error fetching TVDB ID from TMDB:', error);
    return null;
  }
};

export interface TVDBEpisode {
  id: number;
  name: string;
  overview: string;
  aired: string | null;
  seasonNumber: number;
  number: number;
  runtime: number | null;
  image: string | null;
}

interface TVDBRawEpisode {
  id: number;
  name?: string;
  overview?: string;
  aired: string | null;
  seasonNumber: number;
  number: number;
  runtime?: number | null;
  image?: string | null;
}

export interface TVDBSeason {
  seasonNumber: number;
  episodes: TVDBEpisode[];
}

// Get episodes from TVDB with pagination support
export const getTVDBEpisodes = async (tvdbId: number): Promise<TVDBEpisode[]> => {
  const token = await authenticateTVDB();
  let allEpisodes: TVDBRawEpisode[] = [];
  let page = 0;
  let hasMorePages = true;
  let useGerman = true;

  try {
    // First check if German is available
    const testResponse = await fetch(
      `${TVDB_API_URL}/series/${tvdbId}/episodes/default/deu?page=0`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    useGerman = testResponse.ok;
    if (!useGerman) {
    }

    // Fetch all pages
    while (hasMorePages) {
      const langSuffix = useGerman ? '/deu' : '';
      const response = await fetch(
        `${TVDB_API_URL}/series/${tvdbId}/episodes/default${langSuffix}?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (page === 0) {
          throw new Error(`TVDB Episodes fetch failed: ${response.status}`);
        }
        break;
      }

      const data = await response.json();

      // Extract episodes from response
      let episodesData: TVDBRawEpisode[] = [];
      if (data.data && data.data.episodes && Array.isArray(data.data.episodes)) {
        episodesData = data.data.episodes;
      } else if (data.data && Array.isArray(data.data)) {
        episodesData = data.data;
      } else if (data.episodes && Array.isArray(data.episodes)) {
        episodesData = data.episodes;
      }

      if (episodesData.length === 0) {
        hasMorePages = false;
      } else {
        allEpisodes = [...allEpisodes, ...episodesData];
        // Check if there are more pages via links.next or if we got less than expected
        if (data.links && data.links.next) {
          page++;
        } else {
          hasMorePages = false;
        }
      }
    }

    // Filter episodes with aired date and seasonNumber > 0
    const filteredEpisodes = allEpisodes
      .filter((episode) => episode.aired !== null && episode.seasonNumber > 0)
      .map((episode) => ({
        id: episode.id,
        name: episode.name || `Episode ${episode.number}`,
        overview: episode.overview || '',
        aired: episode.aired,
        seasonNumber: episode.seasonNumber,
        number: episode.number,
        runtime: episode.runtime || null,
        image: episode.image || null,
      }));

    return filteredEpisodes;
  } catch (error) {
    console.error('Error fetching TVDB episodes:', error);
    throw error;
  }
};

// Get all episodes organized by seasons
export const getTVDBSeasons = async (tvdbId: number): Promise<TVDBSeason[]> => {
  try {
    const episodes = await getTVDBEpisodes(tvdbId);

    const seasons: Record<number, TVDBSeason> = {};

    episodes.forEach((episode) => {
      if (!seasons[episode.seasonNumber]) {
        seasons[episode.seasonNumber] = {
          seasonNumber: episode.seasonNumber,
          episodes: [],
        };
      }
      seasons[episode.seasonNumber].episodes.push(episode);
    });

    // Sort episodes within each season
    Object.values(seasons).forEach((season) => {
      season.episodes.sort((a, b) => a.number - b.number);
    });

    // Return sorted by season number
    return Object.values(seasons).sort((a, b) => a.seasonNumber - b.seasonNumber);
  } catch (error) {
    console.error('Error fetching TVDB seasons:', error);
    return [];
  }
};
