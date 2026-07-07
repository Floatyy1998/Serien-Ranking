/**
 * Zentrale RTDB-Pfad-Builder (S1). Ersetzt schrittweise die ~116 Stellen mit
 * handgeschriebenen `users/${uid}/…`-Template-Strings — eine Quelle der
 * Wahrheit für die Node-Struktur, tippfehlersicher und leicht umbenennbar.
 *
 * Reine Funktionen (kein Firebase-Import) → trivial testbar. Der eigentliche
 * I/O-Wrapper lebt in `./ref`.
 */

const user = (uid: string) => `users/${uid}`;

/** Baut einen Pfad unterhalb von `users/$uid` aus Segmenten. */
export const userPath = (uid: string, ...segments: (string | number)[]): string =>
  [user(uid), ...segments].join('/');

export const paths = {
  user,

  // Meta / Versionierung
  meta: (uid: string) => `${user(uid)}/meta`,
  serienVersion: (uid: string) => `${user(uid)}/meta/serienVersion`,

  // Serien
  series: (uid: string) => `${user(uid)}/series`,
  seriesItem: (uid: string, id: string | number) => `${user(uid)}/series/${id}`,
  seriesRating: (uid: string, id: string | number) => `${user(uid)}/series/${id}/rating`,
  seriesWatch: (uid: string) => `${user(uid)}/seriesWatch`,
  seriesWatchItem: (uid: string, id: string | number) => `${user(uid)}/seriesWatch/${id}`,

  // Filme
  movies: (uid: string) => `${user(uid)}/movies`,
  movieItem: (uid: string, id: string | number) => `${user(uid)}/movies/${id}`,
  movieRating: (uid: string, id: string | number) => `${user(uid)}/movies/${id}/rating`,

  // Manga
  manga: (uid: string) => `${user(uid)}/manga`,
  mangaItem: (uid: string, anilistId: string | number) => `${user(uid)}/manga/${anilistId}`,

  // Profil / Sonstiges
  displayName: (uid: string) => `${user(uid)}/displayName`,
  theme: (uid: string) => `${user(uid)}/theme`,
  homeConfig: (uid: string) => `${user(uid)}/homeConfig`,

  // Detection-Notification-States (Dismiss-Tabellen)
  notificationState: (uid: string, node: string) => `${user(uid)}/${node}`,
} as const;
