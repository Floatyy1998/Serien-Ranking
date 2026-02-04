export type DiscussionItemType = 'movie' | 'series' | 'episode';

export interface DiscussionReply {
  id: string;
  userId: string;
  username: string;
  userPhotoURL?: string;
  content: string;
  createdAt: number; // Timestamp
  updatedAt?: number; // Set when edited
  likes: string[]; // Array of userIds who liked
  isSpoiler?: boolean;
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

export interface DiscussionFeedMetadata {
  itemTitle: string;
  posterPath?: string;
  episodeTitle?: string;
}

export interface DiscussionFeedEntry {
  id: string;
  type: 'discussion_created' | 'reply_created';
  discussionId: string;
  discussionTitle: string;
  userId: string;
  username: string;
  userPhotoURL?: string;
  itemType: DiscussionItemType;
  itemId: number;
  itemTitle: string;
  posterPath?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  contentPreview: string;
  createdAt: number;
}
