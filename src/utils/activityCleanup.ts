/**
 * 🧹 Activity Cleanup Utility
 *
 * Stellt sicher, dass nur maximal 20 Activities pro User gespeichert werden
 * um Speicher zu sparen und die Performance zu optimieren.
 */

import firebase from 'firebase/compat/app';

const MAX_ACTIVITIES = 20;

/**
 * Begrenzt Activities auf maximal 20 Einträge
 * Löscht die ältesten Einträge wenn mehr als MAX_ACTIVITIES vorhanden sind
 */
export const limitActivities = async (userId: string): Promise<void> => {
  if (!userId) return;

  try {
    const activitiesRef = firebase.database().ref(`activities/${userId}`);

    // Alle Activities nach Timestamp sortiert abrufen
    const snapshot = await activitiesRef
      .orderByChild('timestamp')
      .once('value');

    const activities = snapshot.val();

    if (!activities) return;

    // Activities in Array konvertieren und nach Timestamp sortieren (neueste zuerst)
    const sortedActivities = Object.entries(activities)
      .map(([id, activity]: [string, any]) => ({ id, ...activity }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Wenn mehr als MAX_ACTIVITIES vorhanden sind, die ältesten löschen
    if (sortedActivities.length > MAX_ACTIVITIES) {
      const activitiesToDelete = sortedActivities.slice(MAX_ACTIVITIES);
      const updates: { [key: string]: null } = {};

      activitiesToDelete.forEach((activity) => {
        updates[activity.id] = null;
      });

      // Batch-Update zum Löschen der alten Activities
      await activitiesRef.update(updates);

      console.log(
        `🧹 Cleaned up ${activitiesToDelete.length} old activities for user ${userId} (keeping ${MAX_ACTIVITIES} most recent)`
      );
    }
  } catch (error) {
    console.error('Error limiting activities:', error);
  }
};

/**
 * Fügt eine neue Activity hinzu und sorgt automatisch für das Limit
 *
 * @param userId - Die User-ID
 * @param activity - Das Activity-Objekt das hinzugefügt werden soll
 */
export const addActivityWithLimit = async (
  userId: string,
  activity: any
): Promise<void> => {
  if (!userId) return;

  try {
    const activitiesRef = firebase.database().ref(`activities/${userId}`);

    // Neue Activity hinzufügen
    await activitiesRef.push(activity);

    // Activities auf MAX_ACTIVITIES begrenzen
    await limitActivities(userId);
  } catch (error) {
    console.error('Error adding activity with limit:', error);
  }
};

/**
 * Utility-Funktion für direkte Firebase Push-Operationen
 * Verwendet addActivityWithLimit für automatische Limitierung
 */
export const pushActivityWithLimit = async (
  userId: string,
  activity: any
): Promise<void> => {
  return addActivityWithLimit(userId, activity);
};
