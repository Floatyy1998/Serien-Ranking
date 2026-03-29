import { createContext, useContext } from 'react';
import type { Friend, FriendActivity, FriendRequest } from '../types/Friend';

export interface OptimizedFriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friendActivities: FriendActivity[];
  loading: boolean;
  unreadRequestsCount: number;
  unreadActivitiesCount: number;
  markRequestsAsRead: () => void;
  markActivitiesAsRead: () => void;
  sendFriendRequest: (username: string) => Promise<boolean>;
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
  friendRequests: [],
  sentRequests: [],
  friendActivities: [],
  loading: true,
  unreadRequestsCount: 0,
  unreadActivitiesCount: 0,
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
