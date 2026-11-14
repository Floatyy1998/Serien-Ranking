import { dbRef, dbUpdate, serverIncrement } from '../db/ref';
import { queueModerationScan } from '../moderation/moderationScan';

const ROOT = 'communityThemes';
const USES = 'communityThemeUses';
const HEX = /^#[0-9a-fA-F]{6}$/;

export const COMMUNITY_THEME_NAME_MAX = 24;
export const COMMUNITY_THEMES_PER_USER = 5;

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

export async function listCommunityThemes(
  viewerUid?: string,
  limit = 60
): Promise<CommunityTheme[]> {
  const snap = await dbRef(ROOT).orderByChild('uses').limitToLast(limit).once('value');
  const value = (snap.val() as Record<string, Omit<CommunityTheme, 'id'>> | null) ?? {};
  const themes = Object.entries(value)
    .filter(([, theme]) => theme && isShareableColors(theme) && typeof theme.name === 'string')
    // Zurückgehaltene Designs sieht nur, wer sie geteilt hat.
    .filter(([, theme]) => !theme.hidden || theme.uid === viewerUid)
    .map(([id, theme]) => ({ ...theme, id, uses: Number(theme.uses) || 0 }));
  return sortCommunityThemes(themes);
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
    author: author.trim().slice(0, 40),
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

export const deleteCommunityTheme = (id: string): Promise<void> => dbRef(`${ROOT}/${id}`).remove();

/**
 * Zählt eine Übernahme — je Konto und Design nur einmal, das eigene Design gar nicht.
 * Die Regeln lehnen Wiederholungen ab; dann bleibt der Zähler einfach stehen.
 */
export async function countCommunityThemeUse(id: string, uid: string): Promise<boolean> {
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
