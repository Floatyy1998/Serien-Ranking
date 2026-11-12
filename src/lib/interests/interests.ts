// IDs müssen zu SerienApi/build-interest-tags.js (catalog/interests.json) passen.

export type InterestGroup = 'franchise' | 'genre';

export interface Interest {
  id: string;
  label: string;
  group: InterestGroup;
  aliases?: string[];
}

export const INTERESTS: Interest[] = [
  { id: 'marvel', label: 'Marvel', group: 'franchise', aliases: ['mcu', 'avengers'] },
  { id: 'dc', label: 'DC', group: 'franchise', aliases: ['batman', 'superman'] },
  { id: 'star-wars', label: 'Star Wars', group: 'franchise', aliases: ['jedi'] },
  {
    id: 'wizarding-world',
    label: 'Harry Potter',
    group: 'franchise',
    aliases: ['wizarding world', 'phantastische tierwesen'],
  },
  {
    id: 'middle-earth',
    label: 'Herr der Ringe',
    group: 'franchise',
    aliases: ['mittelerde', 'lord of the rings', 'hobbit', 'tolkien'],
  },
  { id: 'star-trek', label: 'Star Trek', group: 'franchise' },
  { id: 'james-bond', label: 'James Bond', group: 'franchise', aliases: ['007'] },
  { id: 'disney', label: 'Disney', group: 'franchise' },
  { id: 'pixar', label: 'Pixar', group: 'franchise' },
  { id: 'ghibli', label: 'Studio Ghibli', group: 'franchise' },
  { id: 'anime', label: 'Anime', group: 'genre' },
  { id: 'k-drama', label: 'K-Drama', group: 'genre', aliases: ['kdrama', 'korea'] },
  { id: 'animation', label: 'Animation', group: 'genre', aliases: ['zeichentrick'] },
  { id: 'superhelden', label: 'Superhelden', group: 'genre', aliases: ['superhero'] },
  { id: 'action', label: 'Action', group: 'genre' },
  { id: 'krieg', label: 'Krieg', group: 'genre', aliases: ['kriegsfilm', 'war'] },
  { id: 'historie', label: 'Historie', group: 'genre', aliases: ['geschichte', 'history'] },
  { id: 'true-crime', label: 'True Crime', group: 'genre' },
  { id: 'krimi', label: 'Krimi', group: 'genre', aliases: ['crime'] },
  { id: 'thriller', label: 'Thriller', group: 'genre' },
  { id: 'mystery', label: 'Mystery', group: 'genre' },
  { id: 'horror', label: 'Horror', group: 'genre' },
  { id: 'zombies', label: 'Zombies', group: 'genre' },
  { id: 'sci-fi', label: 'Science-Fiction', group: 'genre', aliases: ['scifi', 'sci-fi'] },
  { id: 'fantasy', label: 'Fantasy', group: 'genre' },
  { id: 'comedy', label: 'Comedy', group: 'genre', aliases: ['komödie', 'humor'] },
  { id: 'sitcom', label: 'Sitcoms', group: 'genre', aliases: ['sitcom'] },
  { id: 'romance', label: 'Romantik', group: 'genre', aliases: ['romance', 'liebesfilm'] },
  { id: 'doku', label: 'Dokus', group: 'genre', aliases: ['dokumentation', 'documentary'] },
  { id: 'reality', label: 'Reality-TV', group: 'genre', aliases: ['reality'] },
  { id: 'western', label: 'Western', group: 'genre' },
  { id: 'sport', label: 'Sport', group: 'genre', aliases: ['fußball', 'football'] },
];

export const MAX_INTERESTS = 12;

const BY_ID = new Map(INTERESTS.map((interest) => [interest.id, interest]));

export const interestById = (id: string): Interest | undefined => BY_ID.get(id);

export const interestDirectoryPath = (id: string): string =>
  `/activity?tab=friends&view=public&interest=${encodeURIComponent(id)}`;

export function normalizeInterestIds(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const keys = Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === 'string')
    : Object.entries(raw as Record<string, unknown>)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
  const wanted = new Set(keys);
  return INTERESTS.filter((i) => wanted.has(i.id))
    .map((i) => i.id)
    .slice(0, MAX_INTERESTS);
}

export const interestsToRecord = (ids: string[]): Record<string, true> =>
  Object.fromEntries(normalizeInterestIds(ids).map((id) => [id, true]));

export interface InterestTagMap {
  series: Record<string, string[]>;
  movies: Record<string, string[]>;
}

export interface InterestSuggestion {
  id: string;
  count: number;
}

export function suggestInterests(
  watched: { series: (string | number)[]; movies: (string | number)[] },
  tagMap: InterestTagMap,
  opts: { minCount?: number; minShare?: number; limit?: number } = {}
): InterestSuggestion[] {
  const { minCount = 3, minShare = 0.06, limit = 10 } = opts;
  const counts = new Map<string, number>();
  let total = 0;
  for (const [ids, map] of [
    [watched.series, tagMap.series],
    [watched.movies, tagMap.movies],
  ] as const) {
    for (const id of ids) {
      total++;
      for (const tag of map[String(id)] ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  if (total === 0) return [];
  return [...counts.entries()]
    .filter(([id, count]) => {
      const interest = BY_ID.get(id);
      if (!interest) return false;
      if (interest.group === 'franchise') return count >= Math.min(minCount, 2);
      return count >= minCount && count / total >= minShare;
    })
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}

const fold = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ß]+/g, ' ')
    .trim();

export function matchInterests(query: string, translate: (label: string) => string): Interest[] {
  const q = fold(query);
  if (q.length < 2) return [];
  return INTERESTS.filter((interest) => {
    const names = [
      interest.id,
      interest.label,
      translate(interest.label),
      ...(interest.aliases ?? []),
    ];
    return names.some((name) => {
      const n = fold(name);
      return (
        n === q || n.startsWith(q) || (q.length >= 3 && n.split(' ').some((w) => w.startsWith(q)))
      );
    });
  });
}
