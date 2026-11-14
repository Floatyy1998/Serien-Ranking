/** Willkommens-Meldungen fuer frisch angelegte Konten. */
import { nativePlatform } from '../app/nativeShell';
import { dbRef, userPath } from '../db/ref';
import { localizedVariants } from '../i18n';

const WELCOME_TITLE = 'Willkommen bei TV-Rank!';
const WELCOME_MESSAGE =
  'Schön, dass du da bist — viel Spaß beim Tracken deiner Serien und Filme! Wenn etwas nicht funktioniert oder du Fragen hast, melde dich einfach über das kleine rote Käfer-Symbol. Danke, dass du bei TV-Rank dabei bist!';
const CUSTOMIZE_TITLE = 'Mach TV-Rank zu deinem';
const CUSTOMIZE_MESSAGE =
  'Wusstest du? Unter „Mehr" kannst du die Theme-Farben komplett frei anpassen und deine Startseite im Layout-Editor selbst zusammenstellen — ganz nach deinem Geschmack.';
const APP_HINT_TITLE = 'TV-Rank gibt es auch als App';
const APP_HINT_MESSAGE =
  'Für iPhone, iPad und Android — im App Store und bei Google Play. Dein Konto und dein Stand kommen automatisch mit. Die Links findest du in den Einstellungen unter „Allgemein".';
const WEB_HINT_TITLE = 'TV-Rank gibt es auch als Website';
const WEB_HINT_MESSAGE =
  'Auf tv-rank.de läuft dein Konto in jedem Browser — am Computer, Tablet oder Fernseher, mit demselben Stand wie in der App.';

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
    // Wer in der App startet, erfährt von der Website; wer im Browser startet, von den Apps.
    const inApp = nativePlatform() !== null;
    const hintTitle = inApp ? WEB_HINT_TITLE : APP_HINT_TITLE;
    const hintMessage = inApp ? WEB_HINT_MESSAGE : APP_HINT_MESSAGE;
    void dbRef(userPath(uid, 'notifications', 'devicesHint')).set({
      type: 'welcome',
      title: hintTitle,
      message: hintMessage,
      titleL: await localizedVariants(hintTitle),
      messageL: await localizedVariants(hintMessage),
      timestamp: Date.now() - 2000,
      read: false,
      data: { navigateTo: '/settings?cat=allgemein' },
    });
  } catch {
    /* best-effort */
  }
};
