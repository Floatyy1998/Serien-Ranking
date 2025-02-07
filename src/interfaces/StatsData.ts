export interface StatsData {
  genres: {
    name: string;
    count: number;
    totalRating: number;
    averageRating: number;
  }[];
  providers: {
    name: string;
    count: number;
    totalRating: number;
    averageRating: number;
  }[];
  userStats: {
    watchtime: string[];
    episodesWatched: number;
    seriesRated: number;
  };
}
