/**
 * Setzt den Nutzernamen in einen Gruß: steht `{name}` im Text, ersetzt er den
 * Platzhalter; sonst wird er angehängt — außer der Gruß spricht schon jemanden an.
 */
export function greetingWithName(
  text: string,
  name: string,
  noName?: boolean
): { text: string; tail: string } {
  if (text.includes('{name}')) return { text: text.split('{name}').join(name), tail: '!' };
  return { text, tail: noName ? '!' : `, ${name}!` };
}
