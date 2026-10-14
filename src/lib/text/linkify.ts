export type TextSegment =
  { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string };

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?'"»«“”‘’…*_]+$/;

const count = (text: string, char: string) => text.split(char).length - 1;

function trimUrl(raw: string): string {
  let url = raw.replace(TRAILING_PUNCTUATION, '');
  // Wikipedia-Links enden auf „)", eine Klammer um den ganzen Link gehört nicht dazu
  while (url.endsWith(')') && count(url, ')') > count(url, '(')) {
    url = url.slice(0, -1).replace(TRAILING_PUNCTUATION, '');
  }
  return url;
}

function toHref(url: string): string | null {
  const href = /^www\./i.test(url) ? `https://${url}` : url;
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname.includes('.')) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/** Zerlegt Text in Klartext- und Link-Stücke (nur http(s):// und www.). */
export function linkifyText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    const url = trimUrl(match[0]);
    const href = url && toHref(url);
    if (!href) continue;
    if (start > cursor) segments.push({ kind: 'text', text: text.slice(cursor, start) });
    segments.push({ kind: 'link', text: url, href });
    cursor = start + url.length;
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });
  return segments;
}

/** In-App-Pfad, wenn der Link auf eine der eigenen Domains zeigt — sonst null. */
export function internalPath(href: string, ownHosts: readonly string[]): string | null {
  try {
    const url = new URL(href);
    if (!ownHosts.includes(url.hostname.toLowerCase())) return null;
    return `${url.pathname}${url.search}${url.hash}` || '/';
  } catch {
    return null;
  }
}

export function linkHost(href: string): string {
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}
