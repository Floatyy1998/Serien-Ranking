/** Erwähnungen (@Name) in Diskussionstexten: Zerlegung für die Anzeige und Kandidaten für die Auflösung. */

export interface MentionTarget {
  uid: string;
  name: string;
}

export type MentionSegment =
  { kind: 'text'; text: string } | { kind: 'mention'; text: string; uid: string };

const NAME_CHAR = /[\p{L}\p{N}_.-]/u;
const TOKEN = /(^|[^\p{L}\p{N}_.-])@([\p{L}\p{N}_][\p{L}\p{N}_.-]{0,99})/gu;

const isNameChar = (ch: string | undefined): boolean => !!ch && NAME_CHAR.test(ch);

/**
 * Zerlegt Text in normale Stücke und Erwähnungen bekannter Namen. Namen dürfen Leerzeichen
 * enthalten; der längste passende gewinnt. Ein @ mitten im Wort (E-Mail) zählt nicht.
 */
export function splitMentions(text: string, targets: MentionTarget[]): MentionSegment[] {
  const known = targets
    .map((target) => ({ uid: target.uid, name: target.name.trim() }))
    .filter((target) => target.name)
    .sort((a, b) => b.name.length - a.name.length);
  if (known.length === 0 || !text.includes('@')) return [{ kind: 'text', text }];

  const segments: MentionSegment[] = [];
  let start = 0;
  let pos = 0;
  while (pos < text.length) {
    const at = text.indexOf('@', pos);
    if (at === -1) break;
    pos = at + 1;
    if (at > 0 && isNameChar(text[at - 1])) continue;
    const hit = known.find((target) => {
      const end = at + 1 + target.name.length;
      return (
        text.slice(at + 1, end).toLowerCase() === target.name.toLowerCase() &&
        !isNameChar(text[end])
      );
    });
    if (!hit) continue;
    const end = at + 1 + hit.name.length;
    if (at > start) segments.push({ kind: 'text', text: text.slice(start, at) });
    segments.push({ kind: 'mention', text: text.slice(at, end), uid: hit.uid });
    start = end;
    pos = end;
  }
  if (start < text.length) segments.push({ kind: 'text', text: text.slice(start) });
  return segments;
}

/** Einzelne Wörter hinter einem @ — Kandidaten, die noch keinem bekannten Namen zugeordnet sind. */
export function mentionTokens(text: string): string[] {
  const tokens = new Set<string>();
  for (const match of text.matchAll(TOKEN)) {
    const token = match[2].replace(/[.-]+$/, '');
    if (token) tokens.add(token);
  }
  return [...tokens];
}
