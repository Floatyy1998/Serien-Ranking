const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  bdquo: '„',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
  szlig: 'ß',
  eacute: 'é',
};

/** Google-Books-Beschreibungen kommen als HTML-Schnipsel. */
export function htmlToPlainText(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, '$1')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name] ?? match)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const STOPWORDS: Record<string, string[]> = {
  de: [
    'der',
    'die',
    'und',
    'das',
    'ist',
    'nicht',
    'ein',
    'eine',
    'mit',
    'sich',
    'auf',
    'für',
    'den',
    'von',
  ],
  en: ['the', 'and', 'of', 'to', 'is', 'in', 'that', 'with', 'for', 'his', 'her', 'a', 'an', 'as'],
  es: ['el', 'la', 'de', 'que', 'y', 'en', 'los', 'las', 'una', 'por', 'con', 'para', 'del', 'se'],
  fr: [
    'le',
    'la',
    'les',
    'de',
    'des',
    'et',
    'est',
    'une',
    'dans',
    'pour',
    'qui',
    'pas',
    'sur',
    'du',
  ],
  pt: ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'uma', 'para', 'com', 'não', 'os'],
};

/** Grobe Spracherkennung über Stoppwörter — reicht, um eine polnische Werkbeschreibung auszusortieren. */
export function guessLanguage(text: string): string | null {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 12) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const [lang, list] of Object.entries(STOPWORDS)) {
    const set = new Set(list);
    const score = words.filter((w) => set.has(w)).length / words.length;
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  return bestScore >= 0.06 ? best : null;
}

/** Beschreibung anzeigen, wenn sie in der App-Sprache oder auf Englisch ist (oder zu kurz zum Erkennen). */
export function isReadableDescription(text: string, locale: string): boolean {
  if (!text) return false;
  const lang = guessLanguage(text);
  if (lang === null) return (text.match(/\p{L}+/gu) ?? []).length < 12;
  return lang === locale || lang === 'en';
}
