export type RecommendationMediaType = 'series' | 'movie';

export type RecommendationStatus = 'pending' | 'accepted' | 'declined';

export interface Recommendation {
  id: string;
  mediaId: number;
  mediaType: RecommendationMediaType;
  mediaTitle: string;
  mediaPoster?: string;
  mediaBackdrop?: string;
  senderUid: string;
  senderName: string;
  senderPhotoURL?: string;
  message?: string;
  timestamp: number;
  status: RecommendationStatus;
}

export type RecommendationPayload = Omit<Recommendation, 'id' | 'timestamp' | 'status'>;
