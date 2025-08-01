import firebase from 'firebase/compat/app';
import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { Movie } from '../../interfaces/Movie';
import { Series } from '../../interfaces/Series';
import {
  GenreChangeNotification,
  loadPendingGenreNotifications,
  startGenreChangeDetection,
} from '../../utils/genreChangeDetection';
import GenreChangeDialog from '../dialogs/GenreChangeDialog';
import MovieDialog from '../dialogs/MovieDialog';
import SeriesDialog from '../dialogs/SeriesDialog';

const GenreChangeNotificationManager = () => {
  const { user } = useAuth()!;
  const [notifications, setNotifications] = useState<GenreChangeNotification[]>(
    []
  );
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Series | Movie | null>(null);
  const [itemType, setItemType] = useState<'series' | 'movie'>('series');
  const [ratings, setRatings] = useState<{ [key: string]: number | string }>(
    {}
  );

  // Prüfe beim App-Start auf Genre-Änderungen und ausstehende Benachrichtigungen
  useEffect(() => {
    if (!user?.uid) return;

    const checkForNotifications = async () => {
      try {
        // Erst neue Genre-Änderungen erkennen
        await startGenreChangeDetection(user.uid);

        // Dann ausstehende Benachrichtigungen laden
        const pendingNotifications = await loadPendingGenreNotifications(
          user.uid
        );

        if (pendingNotifications.length > 0) {
          setNotifications(pendingNotifications);
          setGenreDialogOpen(true);
        }
      } catch (error) {
        console.error('❌ Fehler beim Prüfen der Genre-Änderungen:', error);
      }
    };

    // Prüfe beim App-Start nach 5 Sekunden
    const timeoutId = setTimeout(checkForNotifications, 5000);

    return () => clearTimeout(timeoutId);
  }, [user?.uid]);

  const handleAcceptChange = async (
    notification: GenreChangeNotification,
    _openRatingDialog: () => void
  ) => {
    try {
      // Lade das entsprechende Item aus Firebase
      let item: Series | Movie | null = null;

      if (notification.type === 'series') {
        const seriesSnapshot = await firebase
          .database()
          .ref(`${user!.uid}/serien`)
          .orderByChild('id')
          .equalTo(notification.tmdbId)
          .once('value');

        if (seriesSnapshot.exists()) {
          const seriesData = seriesSnapshot.val();
          item = Object.values(seriesData)[0] as Series;
        }
      } else {
        const movieSnapshot = await firebase
          .database()
          .ref(`${user!.uid}/filme`)
          .orderByChild('id')
          .equalTo(notification.tmdbId)
          .once('value');

        if (movieSnapshot.exists()) {
          const movieData = movieSnapshot.val();
          item = Object.values(movieData)[0] as Movie;
        }
      }

      if (item) {
        setSelectedItem(item);
        setItemType(notification.type);

        // Lade aktuelle Ratings
        const currentRatings: { [key: string]: number } = {};
        const allGenres = notification.newGenres; // Verwende die neuen Genres

        allGenres.forEach((genre) => {
          currentRatings[genre] = (item as any).rating?.[genre] || 0;
        });

        setRatings(currentRatings);
        setRatingDialogOpen(true);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Items:', error);
    }
  };

  const handleDeclineChange = (_notification: GenreChangeNotification) => {
    // Wird bereits im GenreChangeDialog verarbeitet
  };

  const handleCloseGenreDialog = () => {
    setGenreDialogOpen(false);
    setNotifications([]);
  };

  const handleCloseRatingDialog = () => {
    setRatingDialogOpen(false);
    setSelectedItem(null);
  };

  const handleUpdateRatings = async () => {
    if (!selectedItem || !user?.uid) return;

    try {
      const path =
        itemType === 'series'
          ? `${user.uid}/serien/${(selectedItem as Series).nmr}/rating`
          : `${user.uid}/filme/${(selectedItem as Movie).nmr}/rating`;

      const updatedRatings = Object.fromEntries(
        Object.entries(ratings).map(([k, value]) => [
          k,
          value === '' ? 0 : Number(value),
        ])
      );

      await firebase.database().ref(path).set(updatedRatings);

      setRatingDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Ratings:', error);
    }
  };

  if (!user?.uid) {
    return null;
  }

  return (
    <>
      {/* Genre-Änderungs-Dialog */}
      <GenreChangeDialog
        open={genreDialogOpen}
        notifications={notifications}
        onClose={handleCloseGenreDialog}
        onAcceptChange={handleAcceptChange}
        onDeclineChange={handleDeclineChange}
        userId={user.uid}
      />

      {/* Rating-Dialog für Serien */}
      {selectedItem && itemType === 'series' && (
        <SeriesDialog
          open={ratingDialogOpen}
          onClose={handleCloseRatingDialog}
          series={selectedItem as Series}
          allGenres={Object.keys(ratings)}
          ratings={ratings}
          setRatings={setRatings}
          handleDeleteSeries={() => {}} // Deaktiviert im Genre-Change-Kontext
          handleUpdateRatings={handleUpdateRatings}
          isReadOnly={false}
        />
      )}

      {/* Rating-Dialog für Filme */}
      {selectedItem && itemType === 'movie' && (
        <MovieDialog
          open={ratingDialogOpen}
          onClose={handleCloseRatingDialog}
          movie={selectedItem as Movie}
          allGenres={Object.keys(ratings)}
          ratings={ratings}
          setRatings={setRatings}
          handleDeleteMovie={() => {}} // Deaktiviert im Genre-Change-Kontext
          handleUpdateRatings={handleUpdateRatings}
          isReadOnly={false}
        />
      )}
    </>
  );
};

export default GenreChangeNotificationManager;
