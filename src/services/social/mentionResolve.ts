import { mentionTokens, splitMentions } from '../../lib/text/mentions';
import { dbRef } from '../db/ref';

const MAX_LOOKUPS = 5;

const lookupUid = async (token: string): Promise<string | null> => {
  const lower = token.toLowerCase();
  for (const field of ['usernameLower', 'displayNameLower']) {
    try {
      const snap = await dbRef('userSearchIndex')
        .orderByChild(field)
        .equalTo(lower)
        .limitToFirst(1)
        .once('value');
      const uid = Object.keys((snap.val() as Record<string, unknown> | null) ?? {})[0];
      if (uid) return uid;
    } catch {
      /* nächstes Feld */
    }
  }
  return null;
};

/**
 * Wen erwähnt der Text? Zuerst die Leute aus dem Thread (auch Namen mit Leerzeichen), dann
 * einzelne @Wörter über den Such-Index. Ergebnis: uid → Name, wie er im Text steht.
 */
export async function resolveMentions(
  text: string,
  known: Record<string, string>
): Promise<Record<string, string>> {
  if (!text.includes('@')) return {};
  const targets = Object.entries(known).map(([uid, name]) => ({ uid, name }));
  const found: Record<string, string> = {};
  let rest = '';
  for (const segment of splitMentions(text, targets)) {
    if (segment.kind === 'mention') found[segment.uid] = known[segment.uid];
    else rest += `${segment.text} `;
  }
  for (const token of mentionTokens(rest).slice(0, MAX_LOOKUPS)) {
    const uid = await lookupUid(token);
    if (uid && !found[uid]) found[uid] = token;
  }
  return found;
}
