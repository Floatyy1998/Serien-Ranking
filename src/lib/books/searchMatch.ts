/** Wortgenaue Prüfung, ob ein Buchtreffer zur Suche passt — gegen Volltext-Rauschen der Quellen. */

const words = (value: string): string[] =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** Artikel und Füllwörter dürfen im Titel fehlen („Schwarm" passt zu „Der Schwarm"). */
const OPTIONAL = new Set(
  [
    'der die das des dem den ein eine einer eines und von vom',
    'the a an of and',
    'le la les l un une du de et',
    'el los las y o um uma e',
  ].flatMap((line) => line.split(' '))
);

const isNumber = (value: string) => /^\d+$/.test(value);

const wordMatches = (word: string, token: string) =>
  isNumber(token) ? isNumber(word) && Number(word) === Number(token) : word.startsWith(token);

export interface SearchMatchInput {
  title: string;
  subtitle?: string;
  authors?: string[];
}

/** Suchwörter ohne Füllwörter — jedes muss irgendwo als Wortanfang vorkommen. */
export const requiredTokens = (query: string): string[] =>
  words(query).filter((token) => !OPTIONAL.has(token));

export interface SearchMatch {
  /** Alle Pflichtwörter stehen in Titel, Untertitel oder Autor. */
  matches: boolean;
  /** Alle Pflichtwörter stehen schon im Titel. */
  inTitle: boolean;
  /** Alle Pflichtwörter stehen im Autorennamen — Bücher von Stephen King, nicht über ihn. */
  byAuthor: boolean;
}

export function searchMatch(result: SearchMatchInput, query: string): SearchMatch {
  const tokens = requiredTokens(query);
  if (!tokens.length) return { matches: true, inTitle: true, byAuthor: false };
  const titleWords = words(`${result.title} ${result.subtitle ?? ''}`);
  const authorWords = words((result.authors ?? []).join(' '));
  const covered = (pool: string[]) =>
    tokens.every((token) => pool.some((word) => wordMatches(word, token)));
  const inTitle = covered(titleWords);
  const byAuthor = covered(authorWords);
  return {
    matches: inTitle || byAuthor || covered([...titleWords, ...authorWords]),
    inTitle,
    byAuthor,
  };
}

/** Solr-Abfrage für Open Library: Titelwörter, das letzte als Wortanfang (Suche beim Tippen). */
export function titlePrefixQuery(query: string): string | null {
  const parts = query
    .replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  const tail = last.length >= 2 && !isNumber(last) ? `${last}*` : last;
  return `title:(${[...parts.slice(0, -1), tail].join(' ')})`;
}
