import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import type { FirebaseUserProfile } from './types';
import type { Friend, FriendRequest } from '../../types/Friend';

interface UseActivityFriendProfilesResult {
  friendProfiles: Record<string, FirebaseUserProfile>;
  requestProfiles: Record<string, FirebaseUserProfile>;
}

export const useActivityFriendProfiles = (
  friends: Friend[],
  friendRequests: FriendRequest[]
): UseActivityFriendProfilesResult => {
  const [friendProfiles, setFriendProfiles] = useState<Record<string, FirebaseUserProfile>>({});
  const [requestProfiles, setRequestProfiles] = useState<Record<string, FirebaseUserProfile>>({});

  useEffect(() => {
    if (friends.length === 0) return;

    const loadProfiles = async () => {
      const newProfiles: Record<string, FirebaseUserProfile> = {};
      await Promise.all(
        friends.map(async (friend) => {
          try {
            const userRef = firebase.database().ref(`users/${friend.uid}`);
            const snapshot = await userRef.once('value');
            if (snapshot.exists()) {
              newProfiles[friend.uid] = snapshot.val();
            }
          } catch (error) {
            // Silent fail
          }
        })
      );
      setFriendProfiles(newProfiles);
    };

    loadProfiles();
  }, [friends]);

  useEffect(() => {
    const loadRequestProfiles = async () => {
      const profiles: Record<string, FirebaseUserProfile> = {};
      for (const request of friendRequests) {
        try {
          const userRef = firebase.database().ref(`users/${request.fromUserId}`);
          const snapshot = await userRef.once('value');
          if (snapshot.exists()) {
            profiles[request.fromUserId] = snapshot.val();
          }
        } catch (error) {
          // Silent fail
        }
      }
      setRequestProfiles(profiles);
    };

    if (friendRequests.length > 0) {
      loadRequestProfiles();
    }
  }, [friendRequests]);

  return { friendProfiles, requestProfiles };
};
