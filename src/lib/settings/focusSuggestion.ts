/** Ab so vielen Manga und Büchern lohnt der Vorschlag überhaupt. */
export const MIN_READING_FOR_SUGGESTION = 5;

/** Bestandskonten ohne gewählten Schwerpunkt: wer mehr liest als schaut, bekommt die Lese-Startseite angeboten. */
export function suggestsReadingHome(counts: { watch: number; read: number }): boolean {
  return counts.read >= MIN_READING_FOR_SUGGESTION && counts.read > counts.watch;
}
