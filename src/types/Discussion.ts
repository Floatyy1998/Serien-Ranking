import type React from 'react';

export type DiscussionItemType = 'movie' | 'series' | 'episode';

/** Geteilter Übersetzungs-Cache pro Zielsprache (Erst-Übersetzer schreibt). */
export type CommentTranslations = Record<string, { text: string; title?: string }>;

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
  lang?: string; // ISO-639-1, nach erster Übersetzung hinterlegt
  translations?: CommentTranslations;
  hidden?: boolean; // KI-Quarantäne — nur Autor + Admin sehen den Inhalt
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
  // Übersetzung
  lang?: string; // ISO-639-1, nach erster Übersetzung hinterlegt
  translations?: CommentTranslations;
  hidden?: boolean; // KI-Quarantäne — nur Autor + Admin sehen den Inhalt
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
  hidden?: boolean; // KI-Quarantäne
}

export interface DiscussionThreadProps {
  itemId: number;
  itemType: DiscussionItemType;
  seasonNumber?: number;
  episodeNumber?: number;
  title?: React.ReactNode;
  isWatched?: boolean; // For spoiler protection on episodes
  feedMetadata?: DiscussionFeedMetadata;
}
