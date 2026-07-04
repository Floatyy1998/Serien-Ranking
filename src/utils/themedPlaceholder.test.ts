import { describe, expect, it } from 'vitest';
import { buildThemedPlaceholderDataUrl } from './themedPlaceholder';

// Hinweis: `useThemedPlaceholder` ist ein React-Hook (braucht ThemeContext +
// Renderer) und wird hier bewusst nicht getestet — node-env ohne jsdom/render.
// Die gesamte SVG-Erzeugung steckt in der reinen `buildThemedPlaceholderDataUrl`.

describe('buildThemedPlaceholderDataUrl', () => {
  it('gibt eine data:image/svg+xml;utf8-URL zurück', () => {
    const url = buildThemedPlaceholderDataUrl('#ff0000', '#00ff00');
    expect(url.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  });

  it('ist URI-encodiert (keine rohen spitzen Klammern im Payload)', () => {
    const url = buildThemedPlaceholderDataUrl('#ff0000', '#00ff00');
    const payload = url.slice('data:image/svg+xml;utf8,'.length);
    expect(payload).not.toContain('<');
    expect(payload).toContain('%3C'); // encodiertes '<'
  });

  it('das dekodierte SVG enthält die übergebenen Theme-Farben', () => {
    const url = buildThemedPlaceholderDataUrl('#123456', '#abcdef');
    const svg = decodeURIComponent(url.slice('data:image/svg+xml;utf8,'.length));
    expect(svg).toContain('#123456');
    expect(svg).toContain('#abcdef');
  });

  it('das dekodierte SVG enthält die Marken-Botschaft und ist ein <svg>', () => {
    const url = buildThemedPlaceholderDataUrl('#111', '#222');
    const svg = decodeURIComponent(url.slice('data:image/svg+xml;utf8,'.length));
    expect(svg).toContain('<svg');
    expect(svg).toContain('KEIN POSTER');
    expect(svg).toContain('TV·RANK');
  });

  it('unterschiedliche Farben ergeben unterschiedliche URLs', () => {
    const a = buildThemedPlaceholderDataUrl('#000000', '#ffffff');
    const b = buildThemedPlaceholderDataUrl('#ffffff', '#000000');
    expect(a).not.toBe(b);
  });

  it('ist für dieselben Eingaben stabil (deterministisch)', () => {
    expect(buildThemedPlaceholderDataUrl('#abc', '#def')).toBe(
      buildThemedPlaceholderDataUrl('#abc', '#def')
    );
  });
});
