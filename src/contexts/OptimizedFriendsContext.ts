import { createContext, useContext } from 'react';
import type { Friend, FriendActivity, FriendRequest } from '../types/Friend';

export interface OptimizedFriendsContextType {
  /** Favoriten zuerst, danach alphabetisch. */
  friends: Friend[];
  /** Nur die als Favorit markierten — Grundlage für Kalender-Leiste und Sheet-Tab. */
  favoriteFriends: Friend[];
  favoriteIds: Set<string>;
  toggleFavoriteFriend: (friendId: string) => Promise<void>;
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friendActivities: FriendActivity[];
  loading: boolean;
  unreadRequestsCount: number;
  unreadActivitiesCount: number;
  lastReadActivitiesTime: number;
  markRequestsAsRead: () => void;
  markActivitiesAsRead: () => void;
  sendFriendRequest: (username: string, targetUid?: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  updateUserActivity: (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ) => Promise<void>;
  refreshFriends: () => void;
}

export const OptimizedFriendsContext = createContext<OptimizedFriendsContextType>({
  friends: [],
  favoriteFriends: [],
  favoriteIds: new Set(),
  toggleFavoriteFriend: async () => {},
  friendRequests: [],
  sentRequests: [],
  friendActivities: [],
  loading: true,
  unreadRequestsCount: 0,
  unreadActivitiesCount: 0,
  lastReadActivitiesTime: 0,
  markRequestsAsRead: () => {},
  markActivitiesAsRead: () => {},
  sendFriendRequest: async () => false,
  acceptFriendRequest: async () => {},
  declineFriendRequest: async () => {},
  cancelFriendRequest: async () => {},
  removeFriend: async () => {},
  updateUserActivity: async () => {},
  refreshFriends: () => {},
});

export const useOptimizedFriends = () => useContext(OptimizedFriendsContext);
