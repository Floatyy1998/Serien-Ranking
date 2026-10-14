/** Wie viele Lieblingsgenres „Für dich" höchstens mischt — jedes kostet eigene Abfragen. */
export const FOR_YOU_MAX_GENRES = 4;

/** Gewählte Genres in der festen Genre-Reihenfolge; Unbekanntes fällt weg. */
export const pickedGenres = (all: readonly string[], picked: readonly string[]): string[] =>
  all.filter((id) => picked.includes(id));

/** „Für dich": eigene Wahl vor dem abgeleiteten Lesegeschmack. */
export const forYouGenres = (picked: readonly string[], taste: readonly string[]): string[] =>
  picked.length ? picked.slice(0, FOR_YOU_MAX_GENRES) : taste.slice(0, 2);

/** Genre-Regale: gewählte zuerst (auch solche ohne festes Regal), dann die übrigen. */
export const genreShelfOrder = (
  defaults: readonly string[],
  picked: readonly string[]
): string[] => [...new Set([...picked, ...defaults])];
