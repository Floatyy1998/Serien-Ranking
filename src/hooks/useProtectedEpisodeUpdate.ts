import firebase from 'firebase/compat/app';
import { useDataProtection } from './useDataProtection';

/**
 * Hook für geschützte Episode-Updates
 * - Überwacht Firebase-Updates und stellt sicher dass sie ankommen
 * - Automatischer Retry bei Fehlern
 * - Schutz vor Datenverlust bei Seitenwechsel
 */
export const useProtectedEpisodeUpdate = () => {
  const { addProtectedUpdate, removeProtectedUpdate } = useDataProtection();

  const updateEpisode = async (
    userId: string,
    seriesNmr: number,
    seasonNumber: number,
    episodeIndex: number,
    updateData: any
  ) => {
    const updateId = `episode-${seriesNmr}-${seasonNumber}-${episodeIndex}`;
    const episodeRef = firebase
      .database()
      .ref(
        `${userId}/serien/${seriesNmr}/seasons/${seasonNumber}/episodes/${episodeIndex}`
      );

    // Registriere Update für Überwachung
    addProtectedUpdate(
      updateId,
      async () => {
        await episodeRef.update(updateData);
      },
      3 // Maximal 3 Retry-Versuche
    );

    try {
      // Führe Update sofort aus
      await episodeRef.update(updateData);
      // Erfolgreich - entferne aus Überwachung
      removeProtectedUpdate(updateId);
      return true;
    } catch (error) {
      console.warn(`Episode update failed, will retry automatically:`, error);
      // Update bleibt in der Überwachung für automatischen Retry
      throw error;
    }
  };

  return { updateEpisode };
};
