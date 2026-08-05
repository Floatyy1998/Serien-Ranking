/**
 * Kürzen und Entschärfen dessen, was in einen Fehlerbericht wandert. Regel:
 * Struktur ja, Inhalt nein — Pfade und Selektoren helfen bei der Diagnose,
 * Query-Werte und DOM-Texte enthalten Nutzerdaten.
 */

export function truncate(value: string, max: number): string {
  const s = String(value ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * Behält Pfad und Parameternamen, ersetzt aber jeden Wert. Aus
 * `/search?q=tom&token=abc` wird `/search?q=~&token=~`.
 */
export function redactUrl(raw: string): string {
  const value = String(raw ?? '');
  if (!value) return '';
  try {
    const url = new URL(value, 'https://tv-rank.de');
    const keys = [...url.searchParams.keys()];
    const query = keys.length ? `?${keys.map((k) => `${k}=~`).join('&')}` : '';
    const sameOrigin = url.origin === 'https://tv-rank.de';
    const base = sameOrigin ? url.pathname : `${url.origin}${url.pathname}`;
    return truncate(`${base}${query}${url.hash ? '#~' : ''}`, 200);
  } catch {
    return truncate(value.split('?')[0], 200);
  }
}

/**
 * CSS-artiger Selektor eines Elements — bewusst ohne Textinhalt, damit keine
 * Serientitel, Nutzernamen oder Nachrichten in den Breadcrumbs landen.
 */
export function selectorFor(el: Element | null | undefined): string {
  if (!el || typeof el !== 'object' || !('tagName' in el)) return '';
  const tag = String(el.tagName || '').toLowerCase();
  if (!tag) return '';
  const id = typeof el.id === 'string' && el.id ? `#${el.id}` : '';
  const cls =
    typeof el.className === 'string' && el.className
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
      : '';
  const testId = el.getAttribute?.('data-testid');
  const suffix = testId ? `[data-testid=${testId}]` : '';
  return truncate(`${tag}${id}${cls}${suffix}`, 120);
}

/** Stack auf die vordersten Frames kürzen — der Rest ist selten hilfreich. */
export function shortStack(stack: string | undefined, maxLines: number): string | undefined {
  if (!stack) return undefined;
  const text = stack.split('\n').slice(0, maxLines).join('\n');
  return truncate(text, 2000);
}
