import type { AniListMangaSearchResult } from '../types/Manga';

const ANILIST_API = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
query ($search: String!, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
    }
    media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      bannerImage
      description(asHtml: false)
      chapters
      volumes
      status
      format
      countryOfOrigin
      genres
      averageScore
      startDate {
        year
        month
        day
      }
      isAdult
    }
  }
}
`;

const GET_BY_ID_QUERY = `
query ($id: Int!) {
  Media(id: $id, type: MANGA) {
    id
    title {
      romaji
      english
      native
    }
    coverImage {
      large
      medium
    }
    bannerImage
    description(asHtml: false)
    chapters
    volumes
    status
    format
    countryOfOrigin
    genres
    averageScore
    startDate {
      year
      month
      day
    }
    isAdult
    recommendations(page: 1, perPage: 8, sort: RATING_DESC) {
      edges {
        node {
          mediaRecommendation {
            id
            title { romaji english }
            coverImage { large }
            format
            status
          }
        }
      }
    }
    staff(page: 1, perPage: 10) {
      edges {
        node { name { full } }
        role
      }
    }
    externalLinks {
      url
      site
    }
    relations {
      edges {
        relationType
        node {
          id
          title { romaji english }
          coverImage { large }
          format
          type
        }
      }
    }
  }
}
`;

async function anilistFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'AniList API error');
  }

  return json.data;
}

export async function searchManga(
  search: string,
  page = 1,
  perPage = 20
): Promise<{
  results: AniListMangaSearchResult[];
  hasNextPage: boolean;
  total: number;
}> {
  const data = await anilistFetch<{
    Page: {
      pageInfo: { total: number; hasNextPage: boolean };
      media: AniListMangaSearchResult[];
    };
  }>(SEARCH_QUERY, { search, page, perPage });

  return {
    results: data.Page.media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    total: data.Page.pageInfo.total,
  };
}

export async function getMangaById(id: number): Promise<AniListMangaSearchResult> {
  const data = await anilistFetch<{ Media: AniListMangaSearchResult }>(GET_BY_ID_QUERY, { id });
  return data.Media;
}

// ─── Discover: Trending / Popular / Top Rated ────────────

const DISCOVER_QUERY = `
query ($page: Int, $perPage: Int, $sort: [MediaSort], $countryOfOrigin: CountryCode) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total hasNextPage }
    media(type: MANGA, sort: $sort, countryOfOrigin: $countryOfOrigin, isAdult: false) {
      id
      title { romaji english native }
      coverImage { large medium }
      bannerImage
      description(asHtml: false)
      chapters volumes status format countryOfOrigin
      genres averageScore
      startDate { year month day }
      isAdult
    }
  }
}
`;

export type DiscoverCategory = 'trending' | 'popular' | 'top_rated' | 'upcoming';

const CATEGORY_SORTS: Record<DiscoverCategory, string[]> = {
  trending: ['TRENDING_DESC'],
  popular: ['POPULARITY_DESC'],
  top_rated: ['SCORE_DESC'],
  upcoming: ['START_DATE_DESC'],
};

export async function discoverManga(
  category: DiscoverCategory,
  page = 1,
  perPage = 20,
  countryOfOrigin?: string
): Promise<{
  results: AniListMangaSearchResult[];
  hasNextPage: boolean;
  total: number;
}> {
  const variables: Record<string, unknown> = {
    page,
    perPage,
    sort: CATEGORY_SORTS[category],
  };
  if (countryOfOrigin && countryOfOrigin !== 'all') {
    variables.countryOfOrigin = countryOfOrigin;
  }

  const data = await anilistFetch<{
    Page: {
      pageInfo: { total: number; hasNextPage: boolean };
      media: AniListMangaSearchResult[];
    };
  }>(DISCOVER_QUERY, variables);

  return {
    results: data.Page.media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    total: data.Page.pageInfo.total,
  };
}
