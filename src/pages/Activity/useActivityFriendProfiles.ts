import { useEffect, useState } from 'react';
import { fetchPublicUserFields } from '../../services/firebase/userDisplayData';
import type { FirebaseUserProfile } from './types';
import type { Friend, FriendRequest } from '../../types/Friend';

interface UseActivityFriendProfilesResult {
  friendProfiles: Record<string, FirebaseUserProfile>;
  requestProfiles: Record<string, FirebaseUserProfile>;
}

/**
 * Punkt-Reads statt Vollknoten-Read: users/$other ist unter den gehärteten
 * Rules nicht mehr komplett lesbar — genutzt werden von den Activity-Tabs
 * ohnehin nur username/displayName/photoURL, die einzeln lesbar bleiben.
 */
const loadPublicProfile = async (uid: string): Promise<FirebaseUserProfile | null> => {
  const fields = await fetchPublicUserFields(uid);
  const profile: FirebaseUserProfile = {};
  if (fields.username) profile.username = fields.username;
  if (fields.displayName) profile.displayName = fields.displayName;
  if (fields.photoURL) profile.photoURL = fields.photoURL;
  return Object.keys(profile).length > 0 ? profile : null;
};

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
            const profile = await loadPublicProfile(friend.uid);
            if (profile) {
              newProfiles[friend.uid] = profile;
            }
          } catch {
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
          const profile = await loadPublicProfile(request.fromUserId);
          if (profile) {
            profiles[request.fromUserId] = profile;
          }
        } catch {
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
