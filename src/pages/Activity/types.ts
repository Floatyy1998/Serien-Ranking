/** Profile data loaded from Firebase for friends/request senders */
export interface FirebaseUserProfile {
  displayName?: string;
  username?: string;
  photoURL?: string;
  email?: string;
}

export type ActivityFilterType = 'all' | 'movies' | 'series';
