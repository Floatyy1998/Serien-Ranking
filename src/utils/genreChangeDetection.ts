import firebase from 'firebase/compat/app';
import { Movie } from '../interfaces/Movie';
import { Series } from '../interfaces/Series';

export interface GenreChangeNotification {
  id: string;
  type: 'series' | 'movie';
  tmdbId: number;
  title: string;
  oldGenres: string[];
  newGenres: string[];
  hasRating: boolean;
  timestamp: number;
}

/**
 * Überprüft alle Serien und Filme auf Genre-Änderungen durch TMDB API
 */
export class GenreChangeDetector {
  private userId: string;
  private TMDB_API_KEY: string;

  constructor(userId: string) {
    this.userId = userId;
    this.TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
  }

  /**
   * Prüft alle Serien und Filme auf Genre-Änderungen
   */
  async checkForGenreChanges(): Promise<GenreChangeNotification[]> {
    const notifications: GenreChangeNotification[] = [];

    try {
      // Prüfe Serien
      const seriesNotifications = await this.checkSeriesGenreChanges();
      notifications.push(...seriesNotifications);

      // Prüfe Filme
      const movieNotifications = await this.checkMovieGenreChanges();
      notifications.push(...movieNotifications);

      // Speichere gefundene Änderungen
      if (notifications.length > 0) {
        await this.saveGenreChangeNotifications(notifications);
      }
    } catch (error) {
      console.error('❌ Fehler bei Genre-Änderungserkennung:', error);
    }

    return notifications;
  }

  /**
   * Prüft Serien auf Genre-Änderungen
   */
  private async checkSeriesGenreChanges(): Promise<GenreChangeNotification[]> {
    const notifications: GenreChangeNotification[] = [];

    try {
      const seriesSnapshot = await firebase
        .database()
        .ref(`${this.userId}/serien`)
        .once('value');

      if (!seriesSnapshot.exists()) {
        return notifications;
      }

      const seriesData = seriesSnapshot.val();
      const seriesList = Object.values(seriesData) as Series[];

      // Begrenze auf 10 Serien pro Check um API-Limits zu respektieren
      const limitedSeries = seriesList.slice(0, 10);

      for (const series of limitedSeries) {
        try {
          // Nur prüfen wenn Serie eine TMDB-ID hat und bewertet wurde
          if (!series.id || !this.hasRating(series)) {
            continue;
          }

          const currentGenres = series.genre?.genres || [];
          const tmdbGenres = await this.fetchTMDBSeriesGenres(series.id);

          if (this.hasGenreChanges(currentGenres, tmdbGenres)) {
            notifications.push({
              id: `series_${series.id}_${Date.now()}`,
              type: 'series',
              tmdbId: series.id,
              title: series.title || 'Unbekannte Serie',
              oldGenres: currentGenres,
              newGenres: tmdbGenres,
              hasRating: true,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.warn(`Fehler beim Prüfen der Serie ${series.title}:`, error);
          // Weiter mit nächster Serie
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Prüfen der Serien-Genres:', error);
    }

    return notifications;
  }

  /**
   * Prüft Filme auf Genre-Änderungen
   */
  private async checkMovieGenreChanges(): Promise<GenreChangeNotification[]> {
    const notifications: GenreChangeNotification[] = [];

    try {
      const moviesSnapshot = await firebase
        .database()
        .ref(`${this.userId}/filme`)
        .once('value');

      if (!moviesSnapshot.exists()) {
        return notifications;
      }

      const moviesData = moviesSnapshot.val();
      const moviesList = Object.values(moviesData) as Movie[];

      // Begrenze auf 10 Filme pro Check um API-Limits zu respektieren
      const limitedMovies = moviesList.slice(0, 10);

      for (const movie of limitedMovies) {
        try {
          // Nur prüfen wenn Film eine TMDB-ID hat und bewertet wurde
          if (!movie.id || !this.hasMovieRating(movie)) {
            continue;
          }

          const currentGenres = movie.genre?.genres || [];
          const tmdbGenres = await this.fetchTMDBMovieGenres(movie.id);

          if (this.hasGenreChanges(currentGenres, tmdbGenres)) {
            notifications.push({
              id: `movie_${movie.id}_${Date.now()}`,
              type: 'movie',
              tmdbId: movie.id,
              title: movie.title || 'Unbekannter Film',
              oldGenres: currentGenres,
              newGenres: tmdbGenres,
              hasRating: true,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.warn(`Fehler beim Prüfen des Films ${movie.title}:`, error);
          // Weiter mit nächstem Film
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Prüfen der Film-Genres:', error);
    }

    return notifications;
  }

  /**
   * Holt aktuelle Genres einer Serie von TMDB
   */
  private async fetchTMDBSeriesGenres(tmdbId: number): Promise<string[]> {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${this.TMDB_API_KEY}&language=de-DE`
    );

    if (!response.ok) {
      throw new Error(`TMDB API Fehler: ${response.status}`);
    }

    const data = await response.json();
    return data.genres?.map((genre: any) => genre.name) || [];
  }

  /**
   * Holt aktuelle Genres eines Films von TMDB
   */
  private async fetchTMDBMovieGenres(tmdbId: number): Promise<string[]> {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${this.TMDB_API_KEY}&language=de-DE`
    );

    if (!response.ok) {
      throw new Error(`TMDB API Fehler: ${response.status}`);
    }

    const data = await response.json();
    return data.genres?.map((genre: any) => genre.name) || [];
  }

  /**
   * Prüft ob sich Genres geändert haben
   */
  private hasGenreChanges(oldGenres: string[], newGenres: string[]): boolean {
    // Filtere "All" Genre raus (ist kein echtes Genre)
    const cleanOldGenres = oldGenres.filter((g) => g !== 'All').sort();
    const cleanNewGenres = newGenres.filter((g) => g !== 'All').sort();

    if (cleanOldGenres.length !== cleanNewGenres.length) {
      return true;
    }

    return !cleanOldGenres.every(
      (genre, index) => genre === cleanNewGenres[index]
    );
  }

  /**
   * Prüft ob eine Serie bewertet wurde
   */
  private hasRating(series: Series): boolean {
    if (!series.rating) return false;

    if (typeof series.rating === 'object') {
      return Object.values(series.rating).some(
        (rating) => rating !== null && rating !== undefined && rating > 0
      );
    }

    return typeof series.rating === 'number' && series.rating > 0;
  }

  /**
   * Prüft ob ein Film bewertet wurde
   */
  private hasMovieRating(movie: Movie): boolean {
    if (!movie.rating) return false;

    if (typeof movie.rating === 'object') {
      return Object.values(movie.rating).some(
        (rating) => rating !== null && rating !== undefined && rating > 0
      );
    }

    return typeof movie.rating === 'number' && movie.rating > 0;
  }

  /**
   * Speichert Genre-Änderungsbenachrichtigungen
   */
  async saveGenreChangeNotifications(
    notifications: GenreChangeNotification[]
  ): Promise<void> {
    for (const notification of notifications) {
      await firebase
        .database()
        .ref(`genreChangeNotifications/${this.userId}/${notification.id}`)
        .set(notification);
    }
  }

  /**
   * Lädt alle ausstehenden Genre-Änderungsbenachrichtigungen
   */
  async getPendingGenreChangeNotifications(): Promise<
    GenreChangeNotification[]
  > {
    try {
      const snapshot = await firebase
        .database()
        .ref(`genreChangeNotifications/${this.userId}`)
        .once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val();
      return Object.values(data) as GenreChangeNotification[];
    } catch (error) {
      console.error(
        '❌ Fehler beim Laden der Genre-Änderungsbenachrichtigungen:',
        error
      );
      return [];
    }
  }

  /**
   * Markiert eine Genre-Änderungsbenachrichtigung als verarbeitet
   */
  async markNotificationAsProcessed(notificationId: string): Promise<void> {
    try {
      await firebase
        .database()
        .ref(`genreChangeNotifications/${this.userId}/${notificationId}`)
        .remove();
    } catch (error) {
      console.error(
        '❌ Fehler beim Markieren der Benachrichtigung als verarbeitet:',
        error
      );
    }
  }

  /**
   * Aktualisiert die Genres einer Serie in Firebase
   */
  async updateSeriesGenres(tmdbId: number, newGenres: string[]): Promise<void> {
    try {
      // Finde die Serie anhand der TMDB-ID
      const seriesSnapshot = await firebase
        .database()
        .ref(`${this.userId}/serien`)
        .orderByChild('id')
        .equalTo(tmdbId)
        .once('value');

      if (seriesSnapshot.exists()) {
        const seriesData = seriesSnapshot.val();
        const seriesKey = Object.keys(seriesData)[0];

        await firebase
          .database()
          .ref(`${this.userId}/serien/${seriesKey}/genre/genres`)
          .set(newGenres);
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Serie-Genres:', error);
    }
  }

  /**
   * Aktualisiert die Genres eines Films in Firebase
   */
  async updateMovieGenres(tmdbId: number, newGenres: string[]): Promise<void> {
    try {
      // Finde den Film anhand der TMDB-ID
      const movieSnapshot = await firebase
        .database()
        .ref(`${this.userId}/filme`)
        .orderByChild('id')
        .equalTo(tmdbId)
        .once('value');

      if (movieSnapshot.exists()) {
        const movieData = movieSnapshot.val();
        const movieKey = Object.keys(movieData)[0];

        await firebase
          .database()
          .ref(`${this.userId}/filme/${movieKey}/genre/genres`)
          .set(newGenres);
      }
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Film-Genres:', error);
    }
  }
}

/**
 * Startet die Genre-Änderungserkennung für einen Benutzer
 */
export async function startGenreChangeDetection(
  userId: string
): Promise<GenreChangeNotification[]> {
  const detector = new GenreChangeDetector(userId);
  return await detector.checkForGenreChanges();
}

/**
 * Lädt ausstehende Genre-Änderungsbenachrichtigungen für einen Benutzer
 */
export async function loadPendingGenreNotifications(
  userId: string
): Promise<GenreChangeNotification[]> {
  const detector = new GenreChangeDetector(userId);
  return await detector.getPendingGenreChangeNotifications();
}
