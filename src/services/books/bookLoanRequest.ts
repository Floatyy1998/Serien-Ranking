import { dbRef, userPath } from '../db/ref';
import { LOCALES, SOURCE_LOCALE, tLocale, type Locale, type LocalizedMap } from '../i18n';
import { queuePush } from '../notifications/pushQueue';

const COOLDOWN_LS_PREFIX = 'bookLoanAskedAt:';
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const cooldownKey = (friendUid: string, bookKey: string) =>
  `${COOLDOWN_LS_PREFIX}${friendUid}:${bookKey}`.slice(0, 200);

export function canAskForBook(friendUid: string, bookKey: string): boolean {
  try {
    const raw = localStorage.getItem(cooldownKey(friendUid, bookKey));
    const askedAt = raw ? parseInt(raw, 10) : NaN;
    return isNaN(askedAt) || Date.now() - askedAt >= COOLDOWN_MS;
  } catch {
    return true;
  }
}

/** Bittet einen Freund per Benachrichtigung + Push, ihm das Buch zu leihen. */
export async function sendBookLoanRequest(opts: {
  fromUid: string;
  fromName: string;
  toUid: string;
  bookId: string;
  bookTitle: string;
  bookKey: string;
}): Promise<void> {
  const { fromUid, fromName, toUid, bookId, bookTitle, bookKey } = opts;
  const titleFor = (locale: Locale) =>
    tLocale(locale, '{name} möchte ein Buch leihen', { name: fromName });
  const messageFor = (locale: Locale) =>
    tLocale(locale, 'Hast du „{title}" noch im Regal? {name} würde es gern ausleihen.', {
      title: bookTitle,
      name: fromName,
    });
  const mapOver = (build: (locale: Locale) => string): LocalizedMap => {
    const out: LocalizedMap = {};
    for (const locale of LOCALES) if (locale !== SOURCE_LOCALE) out[locale] = build(locale);
    return out;
  };

  await dbRef(userPath(toUid, 'notifications')).push({
    type: 'book_loan_request',
    title: titleFor(SOURCE_LOCALE).slice(0, 500),
    message: messageFor(SOURCE_LOCALE).slice(0, 2000),
    titleL: mapOver((l) => titleFor(l).slice(0, 500)),
    messageL: mapOver((l) => messageFor(l).slice(0, 2000)),
    timestamp: Date.now(),
    read: false,
    data: { from: fromUid, fromName, bookId, bookTitle },
  });
  await queuePush(toUid, {
    title: titleFor(SOURCE_LOCALE).slice(0, 500),
    body: messageFor(SOURCE_LOCALE).slice(0, 2000),
    titleL: mapOver((l) => titleFor(l).slice(0, 500)),
    bodyL: mapOver((l) => messageFor(l).slice(0, 2000)),
    url: `/friend/${fromUid}`,
  });
  try {
    localStorage.setItem(cooldownKey(toUid, bookKey), String(Date.now()));
  } catch {
    /* egal */
  }
}
