/** Push-Queue: Clients legen Einträge ab, der Backend-Listener (hello.js) verschickt per FCM und löscht. */
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { dbRef, serverTimestamp } from './db/ref';
import type { LocalizedMap } from './i18n';

/** Kürzt jede Sprachfassung einzeln; leer heißt „kein Feld schreiben". */
const capMap = (map: LocalizedMap | undefined, max: number): LocalizedMap | undefined => {
  if (!map) return undefined;
  const out: LocalizedMap = {};
  for (const [locale, value] of Object.entries(map)) {
    if (value) out[locale as keyof LocalizedMap] = value.slice(0, max);
  }
  return Object.keys(out).length ? out : undefined;
};

export const queuePush = async (
  toUid: string,
  push: { title: string; body: string; url?: string; titleL?: LocalizedMap; bodyL?: LocalizedMap }
): Promise<void> => {
  try {
    // Rules verlangen from === auth.uid: macht jeden Eintrag zurechenbar und
    // verhindert, dass Fremde beliebige Pushes an beliebige Nutzer einreihen.
    const fromUid = firebase.auth().currentUser?.uid;
    if (!fromUid) return;
    const titleL = capMap(push.titleL, 100);
    const bodyL = capMap(push.bodyL, 300);
    await dbRef('pushQueue').push({
      to: toUid,
      from: fromUid,
      title: push.title.slice(0, 100),
      body: push.body.slice(0, 300),
      // Übersetzungen je Sprache — das Backend wählt nach users/$uid/language
      ...(titleL && { titleL }),
      ...(bodyL && { bodyL }),
      url: push.url && push.url.startsWith('/') ? push.url.slice(0, 200) : '/',
      ts: serverTimestamp(),
    });
  } catch {
    /* best effort — Push ist Zusatzkomfort */
  }
};
