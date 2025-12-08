export type DiscussionItemType = 'movie' | 'series' | 'episode';

export interface DiscussionReply {
  id: string;
  userId: string;
  username: string;
  userPhotoURL?: string;
  content: string;
  createdAt: number; // Timestamp
  updatedAt?: number;
  likes: string[]; // Array of userIds who liked
}

export interface Discussion {
  id: string;
  itemId: number; // TMDB ID
  itemType: DiscussionItemType;
  // For episodes: additional identifiers
  seasonNumber?: number;
  episodeNumber?: number;
  // Author info
  userId: string;
  username: string;
  userPhotoURL?: string;
  // Content
  title: string;
  content: string;
  // Metadata
  createdAt: number; // Timestamp
  updatedAt?: number;
  // Engagement
  likes: string[]; // Array of userIds who liked
  replyCount: number;
  lastReplyAt?: number;
  // Status
  isPinned?: boolean;
  isSpoiler?: boolean;
}

export interface DiscussionWithReplies extends Discussion {
  replies: DiscussionReply[];
}

export interface CreateDiscussionInput {
  itemId: number;
  itemType: DiscussionItemType;
  seasonNumber?: number;
  episodeNumber?: number;
  title: string;
  content: string;
  isSpoiler?: boolean;
}

export interface CreateReplyInput {
  discussionId: string;
  content: string;
}
