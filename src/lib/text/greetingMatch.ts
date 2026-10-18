export interface GreetingSearchHit {
  id: number;
  name?: string;
  title?: string;
  original_name?: string;
  original_title?: string;
  vote_count?: number;
}

const normalize = (text: string | undefined): string =>
  (text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Ohne Titeltreffer zählt nur, was TMDB-Nutzer überhaupt bewertet haben. */
const MIN_VOTES = 20;
/** Ein exakter Titel gewinnt gegen Fortsetzungen, solange er nicht kaum bekannt ist. */
const EXACT_MIN_SHARE = 0.25;

const votes = (hit: GreetingSearchHit): number => hit.vote_count ?? 0;

function mostVoted<T extends GreetingSearchHit>(hits: readonly T[]): T | null {
  return hits.reduce<T | null>(
    (best, hit) => (!best || votes(hit) > votes(best) ? hit : best),
    null
  );
}

/**
 * Wählt aus den TMDB-Suchtreffern den Titel, den der Gruß meint. Die erste
 * Position taugt nicht: TMDB sortiert nach Textnähe, dadurch landete „Dark" bei
 * „Dark Matter" und „The Fifth Element" bei einem koreanischen Kinderfilm ohne
 * Daten. Kandidaten sind Treffer, deren Titel (deutsch oder Original) mit dem
 * Suchtitel beginnt; der mit den meisten Stimmen gewinnt. Ein exakter Treffer
 * geht vor, damit „Ghost" nicht bei „Ghost in the Shell" landet — außer er ist
 * kaum bekannt (der Zeichentrick „The Lord of the Rings" gegen die Filmtrilogie).
 */
export function pickGreetingMatch<T extends GreetingSearchHit>(
  results: readonly T[],
  searchTitle: string
): T | null {
  const wanted = normalize(searchTitle);
  if (!wanted || results.length === 0) return null;

  const titles = (hit: GreetingSearchHit) =>
    [hit.name, hit.title, hit.original_name, hit.original_title].map(normalize);
  const exact = results.filter((hit) => titles(hit).includes(wanted));
  const prefixed = results.filter((hit) =>
    titles(hit).some((title) => title === wanted || title.startsWith(`${wanted} `))
  );

  const bestExact = mostVoted(exact);
  const bestPrefixed = mostVoted(prefixed);
  if (bestExact && bestPrefixed && votes(bestExact) >= votes(bestPrefixed) * EXACT_MIN_SHARE) {
    return bestExact;
  }
  if (bestPrefixed) return bestPrefixed;

  return mostVoted(results.filter((hit) => votes(hit) >= MIN_VOTES));
}
