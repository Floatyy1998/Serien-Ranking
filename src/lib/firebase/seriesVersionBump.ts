import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

/**
 * Incrementiert den Versions-Counter für Serien-Daten eines Users.
 * Wird bei jedem Serien-Write aufgerufen, damit andere Geräte wissen
 * dass sich die Daten geändert haben und ein Full-Load nötig ist.
 */
export function bumpSeriesVersion(uid: string): void {
  firebase
    .database()
    .ref(`users/${uid}/meta/serienVersion`)
    .set(firebase.database.ServerValue.TIMESTAMP);
}
