import { describe, expect, it } from 'vitest';
import { internalPath, linkHost, linkifyText } from './linkify';

const links = (text: string) =>
  linkifyText(text)
    .filter((s) => s.kind === 'link')
    .map((s) => (s.kind === 'link' ? s.href : ''));

describe('linkifyText', () => {
  it('lässt Text ohne Links unverändert', () => {
    expect(linkifyText('Hallo du, z.B. heute?')).toEqual([
      { kind: 'text', text: 'Hallo du, z.B. heute?' },
    ]);
  });

  it('erkennt http(s)-Links mitten im Satz', () => {
    expect(linkifyText('Schau mal https://example.com/a?b=1 an')).toEqual([
      { kind: 'text', text: 'Schau mal ' },
      { kind: 'link', text: 'https://example.com/a?b=1', href: 'https://example.com/a?b=1' },
      { kind: 'text', text: ' an' },
    ]);
  });

  it('ergänzt https bei www-Links', () => {
    expect(links('www.youtube.com/watch?v=x')).toEqual(['https://www.youtube.com/watch?v=x']);
  });

  it('schneidet Satzzeichen am Ende ab', () => {
    const segments = linkifyText('Hier: https://example.com/folge. Krass!');
    expect(segments[1]).toEqual({
      kind: 'link',
      text: 'https://example.com/folge',
      href: 'https://example.com/folge',
    });
    expect(segments[2]).toEqual({ kind: 'text', text: '. Krass!' });
  });

  it('behält Klammern, die zum Link gehören, und entfernt umschließende', () => {
    expect(links('https://de.wikipedia.org/wiki/Lost_(Fernsehserie)')).toEqual([
      'https://de.wikipedia.org/wiki/Lost_(Fernsehserie)',
    ]);
    expect(links('(siehe https://example.com/x)')).toEqual(['https://example.com/x']);
  });

  it('ignoriert andere Schemata und Hosts ohne Punkt', () => {
    expect(links('javascript:alert(1) http://localhost:3000 ftp://example.com')).toEqual([]);
  });

  it('findet mehrere Links', () => {
    expect(links('https://a.de und www.b.com')).toEqual(['https://a.de/', 'https://www.b.com/']);
  });
});

describe('internalPath', () => {
  const hosts = ['tv-rank.de', 'www.tv-rank.de'];

  it('liefert den Pfad für eigene Links', () => {
    expect(internalPath('https://tv-rank.de/series/1399?tab=a#x', hosts)).toBe(
      '/series/1399?tab=a#x'
    );
    expect(internalPath('https://WWW.tv-rank.de/', hosts)).toBe('/');
  });

  it('liefert null für fremde Seiten', () => {
    expect(internalPath('https://tv-rank.de.evil.com/series/1', hosts)).toBeNull();
    expect(internalPath('https://example.com', hosts)).toBeNull();
  });
});

describe('linkHost', () => {
  it('zeigt internationale Domains als Punycode', () => {
    expect(linkHost('https://аpple.com/login')).toBe('xn--pple-43d.com');
  });
});
