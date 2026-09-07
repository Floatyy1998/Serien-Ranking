import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getProviderSearchUrl,
  getProviderTitleUrl,
  handleProviderLinkClick,
  providerNeedsClipboardCopy,
} from './providerLinks';

function makeEvent() {
  return {
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
  } as unknown as React.MouseEvent & { stopPropagation: ReturnType<typeof vi.fn> };
}

describe('providerNeedsClipboardCopy', () => {
  it('true nur fuer Disney Plus', () => {
    expect(providerNeedsClipboardCopy('Disney Plus')).toBe(true);
  });

  it('false fuer andere Provider', () => {
    expect(providerNeedsClipboardCopy('Netflix')).toBe(false);
    expect(providerNeedsClipboardCopy('Amazon Prime Video')).toBe(false);
    expect(providerNeedsClipboardCopy('')).toBe(false);
    expect(providerNeedsClipboardCopy('disney plus')).toBe(false); // case-sensitiv
  });
});

describe('getProviderSearchUrl', () => {
  it('Netflix: q-encodierter Titel', () => {
    expect(getProviderSearchUrl('Netflix', 'Breaking Bad')).toBe(
      'https://www.netflix.com/search?q=Breaking%20Bad'
    );
  });

  it('Amazon Prime Video: k + instant-video', () => {
    expect(getProviderSearchUrl('Amazon Prime Video', 'Dexter')).toBe(
      'https://www.amazon.de/s?k=Dexter&i=instant-video'
    );
  });

  it('Disney Plus: statische Browse-Search-Seite ohne Query', () => {
    expect(getProviderSearchUrl('Disney Plus', 'Loki')).toBe(
      'https://www.disneyplus.com/de-de/browse/search'
    );
  });

  it('Apple TV Plus: term-Query', () => {
    expect(getProviderSearchUrl('Apple TV Plus', 'Severance')).toBe(
      'https://tv.apple.com/de/search?term=Severance'
    );
  });

  it('Paramount Plus / WOW / Crunchyroll / RTL+ / Joyn Plus / MagentaTV / ADN / HBO Max', () => {
    expect(getProviderSearchUrl('Paramount Plus', 'X')).toBe(
      'https://www.paramountplus.com/de/search/?q=X'
    );
    expect(getProviderSearchUrl('WOW', 'X')).toBe('https://www.wowtv.de/suche?search=X');
    expect(getProviderSearchUrl('Crunchyroll', 'X')).toBe(
      'https://www.crunchyroll.com/de/search?q=X'
    );
    expect(getProviderSearchUrl('RTL+', 'X')).toBe('https://plus.rtl.de/suche?term=X');
    expect(getProviderSearchUrl('Joyn Plus', 'X')).toBe('https://www.joyn.de/search?q=X');
    expect(getProviderSearchUrl('MagentaTV', 'X')).toBe('https://web.magentatv.de/search?q=X');
    expect(getProviderSearchUrl('Animation Digital Network', 'X')).toBe(
      'https://animationdigitalnetwork.de/search/X'
    );
    expect(getProviderSearchUrl('HBO Max', 'X')).toBe('https://play.hbomax.com/search/result?q=X');
  });

  it('unbekannter Provider → null', () => {
    expect(getProviderSearchUrl('Sky Ticket', 'X')).toBeNull();
    expect(getProviderSearchUrl('', 'X')).toBeNull();
  });

  it('encodiert Sonderzeichen im Titel korrekt (Query-Provider)', () => {
    const url = getProviderSearchUrl('Netflix', 'Tom & Jerry: A/B?');
    expect(url).toBe('https://www.netflix.com/search?q=Tom%20%26%20Jerry%3A%20A%2FB%3F');
  });
});

describe('getProviderTitleUrl', () => {
  it('baut für unterstützte Anbieter (mit TMDB-ID + mediaType) einen nutzbaren Link', () => {
    const url = getProviderTitleUrl('Netflix', {
      tmdbId: 1396,
      mediaType: 'tv',
      title: 'Breaking Bad',
    });
    expect(url).not.toBeNull();
    // Solange kein Anbieter TMDB-adressierbare Titelseiten hat, ist der Link
    // die bewährte Anbieter-Suche über den Titel (dokumentierter Fallback).
    expect(url).toBe(getProviderSearchUrl('Netflix', 'Breaking Bad'));
  });

  it('fällt ohne TMDB-ID/mediaType auf die Titel-Suche zurück', () => {
    expect(getProviderTitleUrl('Amazon Prime Video', { title: 'Dexter' })).toBe(
      getProviderSearchUrl('Amazon Prime Video', 'Dexter')
    );
  });

  it('Disney Plus: statische Browse-Seite bleibt (Clipboard-Fallback intakt)', () => {
    const url = getProviderTitleUrl('Disney Plus', {
      tmdbId: 84958,
      mediaType: 'tv',
      title: 'Loki',
    });
    expect(url).toBe('https://www.disneyplus.com/de-de/browse/search');
    expect(providerNeedsClipboardCopy('Disney Plus')).toBe(true);
  });

  it('unbekannter Anbieter → null (kein Absturz)', () => {
    expect(getProviderTitleUrl('Sky Ticket', { title: 'X' })).toBeNull();
    expect(getProviderTitleUrl('', { tmdbId: 1, mediaType: 'movie', title: 'X' })).toBeNull();
  });
});

describe('handleProviderLinkClick', () => {
  let openMock: ReturnType<typeof vi.fn>;
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openMock = vi.fn();
    writeTextMock = vi.fn(() => Promise.resolve());
    vi.stubGlobal('window', { open: openMock });
    vi.stubGlobal('navigator', { clipboard: { writeText: writeTextMock } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('stoppt immer die Propagation', () => {
    const ev = makeEvent();
    handleProviderLinkClick(ev, 'Netflix', 'X', 'https://x');
    expect(ev.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('ohne url: nur stopPropagation, kein preventDefault/open/clipboard', () => {
    const ev = makeEvent();
    handleProviderLinkClick(ev, 'Disney Plus', 'Loki', null);
    expect(ev.preventDefault).not.toHaveBeenCalled();
    expect(openMock).not.toHaveBeenCalled();
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('Nicht-Clipboard-Provider mit url: <a href> uebernimmt, kein preventDefault/open', () => {
    const ev = makeEvent();
    handleProviderLinkClick(ev, 'Netflix', 'X', 'https://netflix.test/search?q=X');
    expect(ev.preventDefault).not.toHaveBeenCalled();
    expect(openMock).not.toHaveBeenCalled();
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('Disney Plus mit url: preventDefault, Titel in Clipboard, window.open', () => {
    const ev = makeEvent();
    const url = 'https://www.disneyplus.com/de-de/browse/search';
    handleProviderLinkClick(ev, 'Disney Plus', 'Loki', url);
    expect(ev.preventDefault).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('Loki');
    expect(openMock).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
  });

  it('Disney Plus: fehlende Clipboard-API → oeffnet trotzdem, kein Throw', () => {
    vi.stubGlobal('navigator', {});
    const ev = makeEvent();
    expect(() => handleProviderLinkClick(ev, 'Disney Plus', 'Loki', 'https://d')).not.toThrow();
    expect(openMock).toHaveBeenCalled();
    expect(ev.preventDefault).toHaveBeenCalled();
  });

  it('Disney Plus: fehlgeschlagenes writeText verhindert das Oeffnen nicht', async () => {
    writeTextMock.mockReturnValueOnce(Promise.reject(new Error('denied')));
    const ev = makeEvent();
    handleProviderLinkClick(ev, 'Disney Plus', 'Loki', 'https://d');
    expect(openMock).toHaveBeenCalled();
    // Rejection wird verschluckt (fire-and-forget) — kein unhandled rejection.
    await Promise.resolve();
  });
});
