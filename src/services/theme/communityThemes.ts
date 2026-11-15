import { dbRef, dbUpdate, serverIncrement } from '../db/ref';
import { queueModerationScan } from '../moderation/moderationScan';

const ROOT = 'communityThemes';
const USES = 'communityThemeUses';
const HEX = /^#[0-9a-fA-F]{6}$/;

export const COMMUNITY_THEME_NAME_MAX = 24;
export const COMMUNITY_THEMES_PER_USER = 10;

export interface CommunityThemeColors {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
  textColor: string;
}

export interface CommunityTheme extends CommunityThemeColors {
  id: string;
  name: string;
  uid: string;
  author: string;
  createdAt: number;
  uses: number;
  /** Von der Moderation zurückgehalten, bis der Admin freigibt. */
  hidden?: boolean;
  /**
   * Zähl-Eintrag eines fertigen Themes (Abyss, Ember …): steht nicht in der Community-Liste,
   * liefert aber die Nutzerzahl für die Theme-Karte.
   */
  preset?: boolean;
}

export const cleanThemeName = (raw: string): string =>
  raw.replace(/\s+/g, ' ').trim().slice(0, COMMUNITY_THEME_NAME_MAX);

export const isShareableColors = (colors: Partial<CommunityThemeColors>): boolean =>
  [
    colors.primaryColor,
    colors.backgroundColor,
    colors.surfaceColor,
    colors.accentColor,
    colors.textColor,
  ].every((value) => typeof value === 'string' && HEX.test(value));

/** Die meistübernommenen Designs zuerst; bei Gleichstand das neuere. */
export const sortCommunityThemes = (themes: CommunityTheme[]): CommunityTheme[] =>
  [...themes].sort((a, b) => b.uses - a.uses || b.createdAt - a.createdAt);

const parseThemes = (raw: unknown, viewerUid: string | undefined): CommunityTheme[] => {
  const value = (raw as Record<string, Omit<CommunityTheme, 'id'>> | null) ?? {};
  const themes = Object.entries(value)
    .filter(([, theme]) => theme && isShareableColors(theme) && typeof theme.name === 'string')
    // Zurückgehaltene Designs sieht nur, wer sie geteilt hat.
    .filter(([, theme]) => !theme.hidden || theme.uid === viewerUid)
    .map(([id, theme]) => ({ ...theme, id, uses: Number(theme.uses) || 0 }));
  return sortCommunityThemes(themes);
};

/** Live-Abo auf die meistgenutzten Designs; liefert die Funktion zum Abmelden zurück. */
export function watchCommunityThemes(
  viewerUid: string | undefined,
  onChange: (themes: CommunityTheme[]) => void,
  onError: () => void,
  limit = 80
): () => void {
  const query = dbRef(ROOT).orderByChild('uses').limitToLast(limit);
  const handler = query.on(
    'value',
    (snap) => onChange(parseThemes(snap.val(), viewerUid)),
    () => onError()
  );
  return () => query.off('value', handler);
}

/**
 * Name, unter dem ein Design geteilt wird. Die Anmeldung kennt nicht bei jedem Konto einen
 * Anzeigenamen — dann den aus dem Profil nehmen, damit nie „von Unbekannt" dasteht.
 */
async function resolveAuthor(uid: string, given: string): Promise<string> {
  const direct = given.trim();
  if (direct) return direct.slice(0, 40);
  const read = async (field: string) => {
    try {
      const value: unknown = (await dbRef(`users/${uid}/${field}`).once('value')).val();
      return typeof value === 'string' ? value.trim() : '';
    } catch {
      return '';
    }
  };
  return ((await read('displayName')) || (await read('username')) || 'TV-Rank').slice(0, 40);
}

export async function shareCommunityTheme(
  uid: string,
  author: string,
  name: string,
  colors: CommunityThemeColors
): Promise<CommunityTheme> {
  const ref = dbRef(ROOT).push();
  const theme = {
    name: cleanThemeName(name),
    primaryColor: colors.primaryColor,
    backgroundColor: colors.backgroundColor,
    surfaceColor: colors.surfaceColor,
    accentColor: colors.accentColor,
    textColor: colors.textColor,
    uid,
    author: await resolveAuthor(uid, author),
    createdAt: Date.now(),
    uses: 0,
  };
  await ref.set(theme);
  // Der Name ist freier Text für alle: wie Kommentare von der KI-Moderation prüfen lassen.
  void queueModerationScan({
    kind: 'theme',
    path: `${ROOT}/${ref.key}`,
    text: theme.name,
    userId: uid,
    username: theme.author,
  });
  return { ...theme, id: ref.key as string };
}

/** Neuer Name für das eigene Design; er läuft erneut durch die Moderation. */
export async function renameCommunityTheme(
  id: string,
  name: string,
  uid: string,
  author: string
): Promise<void> {
  const clean = cleanThemeName(name);
  if (!clean) throw new Error('Name fehlt');
  await dbRef(`${ROOT}/${id}/name`).set(clean);
  void queueModerationScan({
    kind: 'theme',
    path: `${ROOT}/${id}`,
    text: clean,
    userId: uid,
    username: await resolveAuthor(uid, author),
  });
}

export const deleteCommunityTheme = (id: string): Promise<void> => dbRef(`${ROOT}/${id}`).remove();

/**
 * Meldet ein Konto als aktuellen Nutzer eines Designs an. Die Regeln lassen das je Konto
 * und Design nur einmal zu; dann bleibt der Zähler stehen.
 */
export async function joinCommunityTheme(id: string, uid: string): Promise<boolean> {
  try {
    await dbUpdate({
      [`${ROOT}/${id}/uses`]: serverIncrement(1),
      [`${USES}/${id}/${uid}`]: true,
    });
    return true;
  } catch {
    return false;
  }
}

/** Meldet das Konto wieder ab — der Zähler zeigt nur, wer das Design gerade nutzt. */
export async function leaveCommunityTheme(id: string, uid: string): Promise<boolean> {
  try {
    await dbUpdate({
      [`${ROOT}/${id}/uses`]: serverIncrement(-1),
      [`${USES}/${id}/${uid}`]: null,
    });
    return true;
  } catch {
    // Design inzwischen gelöscht: es gibt keinen Zähler mehr, nur die eigene Markierung räumen.
    try {
      await dbRef(`${USES}/${id}/${uid}`).remove();
    } catch {
      /* bleibt für das Nachzähl-Skript */
    }
    return false;
  }
}

// ───────── Wer nutzt welches Design? ─────────
// Je Konto gibt es höchstens einen Eintrag `users/$uid/communityThemeUse`: welches Design es
// trägt, mit welchen Farben und von welchem Gerät aus. Er liegt in der Datenbank, damit er
// einen gelöschten Browser-Speicher überlebt, und wird bei jedem Start gegen die tatsächlich
// eingestellten Farben geprüft — passt es nicht mehr, wird das Konto beim Design abgemeldet.

const USE_KEY = 'tvrank:communityThemeUse';
const DEVICE_KEY = 'tvrank:deviceId';

export interface CommunityThemeUse {
  id: string;
  /** Farben des Designs zum Zeitpunkt der Übernahme. */
  sig: string;
  device: string;
  /** Fingerabdruck ohne Textfarbe (fertige Themes). */
  noText?: boolean;
}

/**
 * Fingerabdruck der Farben. Fertige Themes zählen ohne Textfarbe: wer eins schon länger trägt,
 * hat noch die frühere Schrift und soll trotzdem mitgezählt werden.
 */
export const themeSignature = (colors: Partial<CommunityThemeColors>, withText = true): string =>
  [
    colors.primaryColor,
    colors.backgroundColor,
    colors.surfaceColor,
    colors.accentColor,
    withText ? colors.textColor : '',
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .join('|');

const deviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'unbekannt';
  }
};

const recordPath = (uid: string) => `users/${uid}/communityThemeUse`;

const isUse = (value: unknown): value is CommunityThemeUse =>
  !!value &&
  typeof (value as CommunityThemeUse).id === 'string' &&
  typeof (value as CommunityThemeUse).sig === 'string';

const cacheUse = (uid: string, use: CommunityThemeUse | null): void => {
  try {
    if (use) localStorage.setItem(USE_KEY, JSON.stringify({ uid, use }));
    else localStorage.setItem(USE_KEY, JSON.stringify({ uid, use: null }));
  } catch {
    /* der Eintrag in der Datenbank bleibt maßgeblich */
  }
};

/** Der Eintrag des Kontos; der lokale Zwischenstand spart den Lesezugriff bei jedem Start. */
async function readUse(uid: string): Promise<CommunityThemeUse | null> {
  try {
    const cached = JSON.parse(localStorage.getItem(USE_KEY) || 'null') as {
      uid?: string;
      use?: unknown;
    } | null;
    if (cached && cached.uid === uid) return isUse(cached.use) ? cached.use : null;
  } catch {
    /* weiter mit der Datenbank */
  }
  try {
    const snap = await dbRef(recordPath(uid)).once('value');
    const value: unknown = snap.val();
    const use = isUse(value) ? value : null;
    cacheUse(uid, use);
    return use;
  } catch {
    return null;
  }
}

async function writeUse(uid: string, use: CommunityThemeUse | null): Promise<void> {
  cacheUse(uid, use);
  try {
    await dbRef(recordPath(uid)).set(use);
  } catch {
    /* best effort */
  }
}

/**
 * Das Konto trägt jetzt dieses Design (oder keins mehr). Meldet das vorherige ab und
 * das neue an.
 */
export async function setCommunityThemeUse(
  uid: string,
  next: { id: string; colors: Partial<CommunityThemeColors>; noText?: boolean } | null
): Promise<void> {
  const previous = await readUse(uid);
  if ((previous?.id ?? null) === (next?.id ?? null)) return;
  if (previous) await leaveCommunityTheme(previous.id, uid);
  if (next) {
    await joinCommunityTheme(next.id, uid);
    await writeUse(uid, {
      id: next.id,
      sig: themeSignature(next.colors, !next.noText),
      device: deviceId(),
      ...(next.noText ? { noText: true } : {}),
    });
  } else {
    await writeUse(uid, null);
  }
}

/**
 * Abgleich bei jedem Start und jeder Theme-Änderung: Stimmen die eingestellten Farben nicht
 * mehr mit dem übernommenen Design überein, wird das Konto dort abgemeldet. Ohne Cloud-Sync
 * hat jedes Gerät eigene Farben — dann entscheidet nur das Gerät, das übernommen hat.
 */
export async function reconcileCommunityThemeUse(
  uid: string,
  currentColors: Partial<CommunityThemeColors>,
  sharedAcrossDevices: boolean
): Promise<void> {
  const use = await readUse(uid);
  if (!use) return;
  if (use.sig === themeSignature(currentColors, !use.noText)) return;
  if (!sharedAcrossDevices && use.device !== deviceId()) return;
  await leaveCommunityTheme(use.id, uid);
  await writeUse(uid, null);
}
