// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { redactUrl, selectorFor, shortStack, truncate } from './redact';

describe('truncate', () => {
  it('laesst kurze Werte unveraendert', () => {
    expect(truncate('kurz', 10)).toBe('kurz');
  });

  it('kuerzt und haengt Auslassung an', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
  });

  it('vertraegt null', () => {
    expect(truncate(null as unknown as string, 5)).toBe('');
  });
});

describe('redactUrl', () => {
  it('behaelt Pfad und Parameternamen, ersetzt aber Werte', () => {
    expect(redactUrl('/search?q=tom&token=geheim')).toBe('/search?q=~&token=~');
  });

  it('behaelt den Pfad ohne Query', () => {
    expect(redactUrl('/series/1399')).toBe('/series/1399');
  });

  it('behaelt fremde Origins', () => {
    expect(redactUrl('https://api.themoviedb.org/3/tv/1?api_key=x')).toBe(
      'https://api.themoviedb.org/3/tv/1?api_key=~'
    );
  });

  it('ersetzt den Hash-Inhalt', () => {
    expect(redactUrl('/profil#geheim')).toBe('/profil#~');
  });

  it('gibt bei leerer Eingabe leer zurueck', () => {
    expect(redactUrl('')).toBe('');
  });
});

describe('selectorFor', () => {
  const el = (html: string): Element => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild as Element;
  };

  it('baut Tag, Id und Klassen', () => {
    expect(selectorFor(el('<button id="save" class="a b c">Text</button>'))).toBe(
      'button#save.a.b'
    );
  });

  it('nimmt data-testid mit', () => {
    expect(selectorFor(el('<a data-testid="link"></a>'))).toBe('a[data-testid=link]');
  });

  it('enthaelt keinen Textinhalt', () => {
    expect(selectorFor(el('<button>Geheimer Serientitel</button>'))).not.toContain('Geheimer');
  });

  it('vertraegt null', () => {
    expect(selectorFor(null)).toBe('');
  });
});

describe('shortStack', () => {
  it('gibt undefined ohne Stack', () => {
    expect(shortStack(undefined, 3)).toBeUndefined();
  });

  it('kuerzt auf die gewuenschte Zeilenzahl', () => {
    const stack = ['a', 'b', 'c', 'd'].join('\n');
    expect(shortStack(stack, 2)).toBe('a\nb');
  });
});
