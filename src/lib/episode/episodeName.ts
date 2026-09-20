/**
 * Viele Folgen haben gar keinen echten Titel — der Katalog liefert dann einen
 * Platzhalter in der jeweiligen Sprache ("Folge 8", "Episode 8", "Épisode 8",
 * "Episodio 8", "Episódio 8"). Neben einem S/E-Kennzeichen ist das doppelt
 * gemoppelt, deshalb erkennt diese Prüfung solche Namen sprachübergreifend.
 */

const GENERIC_WORDS = [
  'folge',
  'episode',
  'épisode',
  'episodio',
  'episódio',
  'capitulo',
  'capítulo',
  'chapitre',
  'ep',
  'e',
];

const WORD_FIRST = new RegExp(`^(?:${GENERIC_WORDS.join('|')})\\s*[.#:-]?\\s*\\d+$`, 'i');
const NUMBER_FIRST = new RegExp(`^\\d+\\s*[.)]?\\s*(?:${GENERIC_WORDS.join('|')})$`, 'i');

export function isGenericEpisodeName(name: string | undefined | null): boolean {
  const value = (name ?? '').trim().replace(/\s+/g, ' ');
  if (!value) return true;
  return WORD_FIRST.test(value) || NUMBER_FIRST.test(value);
}
