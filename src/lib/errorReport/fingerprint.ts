/**
 * Gruppierschlüssel für Fehlerberichte. Gleiche Ursache muss denselben Wert
 * ergeben, auch wenn IDs, URLs oder Zeilennummern im Text schwanken.
 */
import type { ErrorKind } from '../../types/ErrorReport';

const URL_PATTERN = /https?:\/\/[^\s)'"]+/g;
const HEX_PATTERN = /\b[0-9a-f]{8,}\b/gi;
const UUID_PATTERN = /\b[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/gi;
const NUMBER_PATTERN = /\d+/g;
const QUOTED_PATTERN = /(['"`])(?:(?!\1).){0,200}\1/g;

/**
 * Entfernt alles Variable aus einer Fehlermeldung: URLs, IDs, Zahlen und
 * Zeichenketten in Anführungszeichen (dort stecken meist Nutzerdaten).
 */
export function normalizeMessage(message: string): string {
  return (message || '')
    .replace(UUID_PATTERN, '<id>')
    .replace(URL_PATTERN, '<url>')
    .replace(QUOTED_PATTERN, '<str>')
    .replace(HEX_PATTERN, '<hex>')
    .replace(NUMBER_PATTERN, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

/**
 * Erster aussagekräftiger Stack-Frame ohne Datei-Hash und Position — nach
 * einem Deploy heißt dieselbe Funktion sonst anders und die Gruppe zerfällt.
 */
export function topFrame(stack?: string): string {
  if (!stack) return '';
  const lines = stack.split('\n').map((l) => l.trim());
  const frame = lines.find((l) => l.startsWith('at ') || l.includes('@'));
  if (!frame) return '';
  return frame
    .replace(URL_PATTERN, '<url>')
    .replace(/:\d+:\d+/g, '')
    .replace(/-[0-9a-zA-Z_]{8}\.js/g, '.js')
    .slice(0, 160);
}

/** FNV-1a — deterministisch und synchron; crypto.subtle wäre async. */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function buildFingerprint(input: {
  kind: ErrorKind;
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
}): string {
  const component = (input.componentStack || '').split('\n')[1]?.trim().slice(0, 80) || '';
  const parts = [
    input.kind,
    input.name || 'Error',
    normalizeMessage(input.message),
    topFrame(input.stack),
    component,
  ];
  return hash(parts.join('|'));
}
