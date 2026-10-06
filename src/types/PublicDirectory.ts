/** Ein Eintrag im Verzeichnis „Öffentliche Profile“ (Backend-Cron build-public-directory.js). */
export interface PublicDirectoryEntry {
  uid: string;
  publicId: string;
  displayName: string;
  username: string | null;
  photoURL: string | null;
  series: number;
  movies: number;
  watchtimeMinutes: number;
}
