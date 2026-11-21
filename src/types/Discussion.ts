import type React from 'react';

export type DiscussionItemType = 'movie' | 'series' | 'episode' | 'manga' | 'book';

/** TMDB-ID (Serie, Film, Folge), AniList-ID (Manga) oder Buch-Schlüssel wie `hc-123`. */
export type DiscussionItemId = number | string;

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
  /** Erwähnte Nutzer: uid → Name, wie er im Text steht. */
  mentions?: Record<string, string>;
}

export interface Discussion {
  id: string;
  /** Erwähnte Nutzer: uid → Name, wie er im Text steht. */
  mentions?: Record<string, string>;
  itemId: DiscussionItemId;
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
  /** "Bezieht sich auf" (1-basiert) — Leser hinter diesem Stand sehen den Beitrag verdeckt. */
  refSeason?: number;
  refEpisode?: number;
  // Übersetzung
  lang?: string; // ISO-639-1, nach erster Übersetzung hinterlegt
  translations?: CommentTranslations;
  hidden?: boolean; // KI-Quarantäne — nur Autor + Admin sehen den Inhalt
}

export interface CreateDiscussionInput {
  itemId: DiscussionItemId;
  itemType: DiscussionItemType;
  seasonNumber?: number;
  episodeNumber?: number;
  title: string;
  content: string;
  isSpoiler?: boolean;
  refSeason?: number;
  refEpisode?: number;
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
  itemId: DiscussionItemId;
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
  itemId: DiscussionItemId;
  itemType: DiscussionItemType;
  /** Pfad-Schlüssel, wenn mehrere itemIds einen Thread teilen (Ausgaben eines Buchs); itemId bleibt das Sprungziel. */
  threadKey?: string;
  onCreated?: () => void;
  seasonNumber?: number;
  episodeNumber?: number;
  title?: React.ReactNode;
  /** false = noch nicht gesehen bzw. gelesen: die Diskussionen liegen hinter der Spoiler-Warnung. */
  isWatched?: boolean;
  feedMetadata?: DiscussionFeedMetadata;
  /** Letzter gesehener Stand des Betrachters (1-basiert) — für "bezieht sich auf"-Gating. */
  viewerProgress?: { season: number; episode: number } | null;
}
