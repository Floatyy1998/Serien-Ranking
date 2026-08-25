/** Willkommens-Meldungen fuer frisch angelegte Konten. */
import { dbRef, userPath } from './db/ref';
import { localizedVariants } from './i18n';

const WELCOME_TITLE = 'Willkommen bei TV-Rank!';
const WELCOME_MESSAGE =
  'Schön, dass du da bist — viel Spaß beim Tracken deiner Serien und Filme! Wenn etwas nicht funktioniert oder du Fragen hast, melde dich einfach über das kleine rote Käfer-Symbol. Danke, dass du bei TV-Rank dabei bist!';
const CUSTOMIZE_TITLE = 'Mach TV-Rank zu deinem';
const CUSTOMIZE_MESSAGE =
  'Wusstest du? Unter „Mehr" kannst du die Theme-Farben komplett frei anpassen und deine Startseite im Layout-Editor selbst zusammenstellen — ganz nach deinem Geschmack.';

/**
 * Feste Schluessel statt push(): der Aufruf kommt aus der Registrierung UND aus
 * dem authProvider (Social-Login legt den Knoten erst dort an), und
 * onAuthStateChanged kann beim Erstlogin doppelt feuern. set() auf denselben
 * Schluessel ueberschreibt, statt zu verdoppeln.
 *
 * async, weil die Uebersetzungen fuer den Empfaenger (localizedVariants) die
 * Woerterbuecher nachladen. Aufrufer duerfen weiterhin fire-and-forget bleiben.
 */
export const writeWelcomeNotifications = async (uid: string): Promise<void> => {
  try {
    void dbRef(userPath(uid, 'notifications', 'welcome')).set({
      type: 'welcome',
      title: WELCOME_TITLE,
      message: WELCOME_MESSAGE,
      titleL: await localizedVariants(WELCOME_TITLE),
      messageL: await localizedVariants(WELCOME_MESSAGE),
      timestamp: Date.now(),
      read: false,
    });
    // 1 s aelter, damit die Willkommens-Meldung im Feed oben steht.
    void dbRef(userPath(uid, 'notifications', 'customizeHint')).set({
      type: 'welcome',
      title: CUSTOMIZE_TITLE,
      message: CUSTOMIZE_MESSAGE,
      titleL: await localizedVariants(CUSTOMIZE_TITLE),
      messageL: await localizedVariants(CUSTOMIZE_MESSAGE),
      timestamp: Date.now() - 1000,
      read: false,
      data: { navigateTo: '/profile' },
    });
  } catch {
    /* best-effort */
  }
};
