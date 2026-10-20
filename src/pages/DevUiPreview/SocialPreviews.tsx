import { useState } from 'react';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';
import { primePublicDirectory } from '../../services/social/publicDirectoryService';
import type { PublicDirectoryEntry } from '../../types/PublicDirectory';
import { PublicProfilesList } from '../Activity/tabs/PublicProfilesList';
import { FriendsTab } from '../Activity/tabs/FriendsTab';
import { primeFriendLibraryCounts } from '../../hooks/social/useFriendLibraryCounts';
import type { Friend } from '../../types/Friend';

const entry = (
  name: string,
  series: number,
  movies: number,
  manga: number,
  books: number
): PublicDirectoryEntry => ({
  uid: `dev-${name}`,
  publicId: `dev-${name}`,
  displayName: name,
  username: name.toLowerCase(),
  photoURL: name === 'Esteban Santos' ? null : PLACEHOLDER_SVG,
  series,
  movies,
  manga,
  books,
  watchtimeMinutes: series * 600 + movies * 120,
});

const ENTRIES = [
  entry('Flo', 295, 58, 12, 34),
  entry('Bärbel', 76, 34, 41, 128),
  entry('Esteban Santos', 28, 0, 0, 0),
  entry('VIC', 84, 24, 1, 1),
  entry('AdNoir', 24, 28, 0, 6),
  entry('saskiasteitz', 0, 0, 3, 0),
];

/** Verzeichnis „Öffentliche Profile" mit Serien, Filmen, Manga und Büchern. */
export const PublicProfilesPreview = () => {
  useState(() => primePublicDirectory(ENTRIES));
  return (
    <div style={{ padding: 16 }}>
      <PublicProfilesList saveScrollPosition={() => {}} />
    </div>
  );
};

const FRIENDS: Friend[] = ENTRIES.map((e) => ({
  uid: e.uid,
  email: '',
  username: e.username ?? e.displayName,
  displayName: e.displayName,
  photoURL: e.photoURL ?? undefined,
  friendsSince: 0,
}));

/** Freundesliste mit denselben Bibliothekszahlen wie das Verzeichnis. */
export const FriendsListPreview = () => {
  useState(() =>
    primeFriendLibraryCounts(
      Object.fromEntries(ENTRIES.map((e, i) => [e.uid, i === 2 ? null : { ...e }] as const))
    )
  );
  return (
    <div style={{ padding: 16 }}>
      <FriendsTab
        friends={FRIENDS}
        friendProfiles={{}}
        saveScrollPosition={() => {}}
        onAddFriend={() => {}}
        onRemoveFriend={() => {}}
      />
    </div>
  );
};

export const FriendsEmptyPreview = () => (
  <div style={{ padding: 16 }}>
    <FriendsTab
      friends={[]}
      friendProfiles={{}}
      saveScrollPosition={() => {}}
      onAddFriend={() => {}}
      onRemoveFriend={() => {}}
    />
  </div>
);
