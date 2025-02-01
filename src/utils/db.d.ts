interface SeriesData {
  id: string;
  data: any;
}

interface RatingData {
  id: number;
  ratings: { [key: string]: number | string };
}

export const initDB: () => Promise<IDBPDatabase<unknown>>;
export const saveData: (data: SeriesData) => Promise<void>;
export const getData: (id: string) => Promise<SeriesData | undefined>;
export const saveOfflineData: (data: SeriesData) => Promise<void>;
export const getOfflineData: () => Promise<SeriesData[]>;
export const clearOfflineData: () => Promise<void>;
export const saveOfflineRating: (ratingData: RatingData) => Promise<void>;
export const getOfflineRatings: () => Promise<RatingData[]>;
export const clearOfflineRatings: () => Promise<void>;
