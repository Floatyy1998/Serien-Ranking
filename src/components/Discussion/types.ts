import React from 'react';
import { DiscussionItemType } from '../../types/Discussion';

export interface DiscussionThreadProps {
  itemId: number;
  itemType: DiscussionItemType;
  seasonNumber?: number;
  episodeNumber?: number;
  title?: React.ReactNode;
  isWatched?: boolean; // For spoiler protection on episodes
}
