import { describe, expect, it } from 'vitest';
import { buildFingerprint, normalizeMessage, topFrame } from './fingerprint';

describe('normalizeMessage', () => {
  it('ersetzt IDs, URLs, Zahlen und Zeichenketten', () => {
    const out = normalizeMessage(
      'Serie 1399 unter https://tv-rank.de/series/1399 fehlt, key "abc-def"'
    );
    expect(out).toContain('<url>');
    expect(out).toContain('<n>');
    expect(out).toContain('<str>');
    expect(out).not.toContain('1399');
  });

  it('ersetzt UUIDs', () => {
    expect(normalizeMessage('id 123e4567-e89b-12d3-a456-426614174000 weg')).toContain('<id>');
  });

  it('kommt mit leerer Eingabe klar', () => {
    expect(normalizeMessage('')).toBe('');
  });

  it('kuerzt sehr lange Meldungen', () => {
    expect(normalizeMessage('a'.repeat(500)).length).toBeLessThanOrEqual(300);
  });
});

describe('topFrame', () => {
  it('gibt leeren String ohne Stack', () => {
    expect(topFrame(undefined)).toBe('');
  });

  it('entfernt Position und Datei-Hash', () => {
    const frame = topFrame(
      'Error: x\n    at doThing (https://tv-rank.de/assets/app-a1b2c3d4.js:10:5)'
    );
    expect(frame).toContain('doThing');
    expect(frame).not.toContain(':10:5');
  });

  it('gibt leeren String, wenn kein Frame erkennbar ist', () => {
    expect(topFrame('nur eine Zeile')).toBe('');
  });
});

describe('buildFingerprint', () => {
  const base = { kind: 'error' as const, name: 'TypeError', message: 'x is not a function' };

  it('ist stabil fuer dieselbe Ursache', () => {
    expect(buildFingerprint(base)).toBe(buildFingerprint({ ...base }));
  });

  it('ignoriert schwankende Zahlen in der Meldung', () => {
    const a = buildFingerprint({ ...base, message: 'Folge 12 fehlt' });
    const b = buildFingerprint({ ...base, message: 'Folge 348 fehlt' });
    expect(a).toBe(b);
  });

  it('unterscheidet verschiedene Fehlerarten', () => {
    expect(buildFingerprint(base)).not.toBe(buildFingerprint({ ...base, kind: 'promise' }));
  });

  it('bezieht den Component-Stack ein', () => {
    const withStack = buildFingerprint({ ...base, componentStack: '\n    at HomePage' });
    expect(withStack).not.toBe(buildFingerprint(base));
  });

  it('faellt ohne Namen auf Error zurueck', () => {
    expect(buildFingerprint({ ...base, name: '' })).toBeTruthy();
  });
});
