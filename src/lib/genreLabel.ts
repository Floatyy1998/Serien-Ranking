/**
 * Genre-Beschriftung für Karten.
 *
 * Auf Poster- und Listenkarten stehen rund 50px für die Genre-Zeile zur
 * Verfügung. Eine volle Liste („Sci-Fi & Fantasy, Drama") wird dort auf
 * „Sci-F…" gekürzt und sagt damit nichts mehr aus. Deshalb zeigen Karten nur
 * das erste Genre — das passt in jeder Sprache und auf jedem Gerät.
 */

/**
 * Erstes Genre einer kommaseparierten Liste, durch `translate` geschickt.
 *
 * Die Genres kommen je nach Quelle schon übersetzt oder roh aus dem Katalog
 * (dort englisch); bereits Übersetztes fällt durch `t()` unverändert durch.
 */
export const primaryGenre = (
  genres: string | null | undefined,
  translate: (value: string) => string
): string => {
  const first = (genres ?? '').split(',')[0]?.trim();
  return first ? translate(first) : '';
};
