import { beforeEach, describe, expect, it } from 'vitest';
import {
  getImageUrl,
  getPosterSrcSet,
  isPlaceholderUrl,
  setThemedPlaceholder,
  STATIC_PLACEHOLDER,
} from './imageUrl';

const TMDB_BASE = 'https://image.tmdb.org/t/p';

describe('imageUrl', () => {
  beforeEach(() => {
    // Modul-Level-State zwischen Tests zurücksetzen
    setThemedPlaceholder(null);
  });

  describe('isPlaceholderUrl', () => {
    it('true für null/undefined/leer', () => {
      expect(isPlaceholderUrl(undefined)).toBe(true);
      expect(isPlaceholderUrl(null)).toBe(true);
      expect(isPlaceholderUrl('')).toBe(true);
    });

    it('true für die bekannten statischen Placeholder', () => {
      expect(isPlaceholderUrl(STATIC_PLACEHOLDER)).toBe(true);
      expect(isPlaceholderUrl('/placeholder.jpg')).toBe(true);
    });

    it('true für themed data-URLs (SVG)', () => {
      expect(isPlaceholderUrl('data:image/svg+xml;utf8,<svg/>')).toBe(true);
    });

    it('false für echte Bild-URLs', () => {
      expect(isPlaceholderUrl('https://image.tmdb.org/t/p/w342/abc.jpg')).toBe(false);
    });
  });

  describe('getImageUrl', () => {
    it('kein posterObj → statischer Fallback (kein themed gesetzt)', () => {
      expect(getImageUrl(null)).toBe(STATIC_PLACEHOLDER);
      expect(getImageUrl(undefined)).toBe(STATIC_PLACEHOLDER);
    });

    it('nutzt den themed Placeholder als Default, wenn gesetzt', () => {
      setThemedPlaceholder('data:image/svg+xml;utf8,THEMED');
      expect(getImageUrl(null)).toBe('data:image/svg+xml;utf8,THEMED');
    });

    it('expliziter Fallback gewinnt über themed', () => {
      setThemedPlaceholder('data:themed');
      expect(getImageUrl(null, 'w342', '/custom.png')).toBe('/custom.png');
    });

    it('Fallback "" versteckt das Bild explizit', () => {
      expect(getImageUrl(null, 'w342', '')).toBe('');
    });

    it('baut die TMDB-URL aus einem relativen String-Pfad und der Größe', () => {
      expect(getImageUrl('/abc.jpg')).toBe(`${TMDB_BASE}/w342/abc.jpg`);
      expect(getImageUrl('/abc.jpg', 'w500')).toBe(`${TMDB_BASE}/w500/abc.jpg`);
    });

    it('liest den inneren poster-Pfad aus einem Wrapper-Objekt', () => {
      expect(getImageUrl({ poster: '/xyz.jpg' }, 'w185')).toBe(`${TMDB_BASE}/w185/xyz.jpg`);
    });

    it('Wrapper-Objekt ohne poster-Feld → Fallback', () => {
      expect(getImageUrl({})).toBe(STATIC_PLACEHOLDER);
    });

    it('gibt eine bereits vollständige http-URL unverändert zurück', () => {
      const url = 'https://cdn.example.com/poster.jpg';
      expect(getImageUrl(url)).toBe(url);
    });

    it('erkennt kaputte TMDB-URLs (…null / …undefined) und liefert Fallback', () => {
      expect(getImageUrl('https://image.tmdb.org/t/p/w342null')).toBe(STATIC_PLACEHOLDER);
      expect(getImageUrl('https://image.tmdb.org/t/p/w342undefined')).toBe(STATIC_PLACEHOLDER);
      expect(getImageUrl('https://image.tmdb.org/t/p/w342/null')).toBe(STATIC_PLACEHOLDER);
    });
  });

  describe('getPosterSrcSet', () => {
    it('leerer String für null/undefined', () => {
      expect(getPosterSrcSet(null)).toBe('');
      expect(getPosterSrcSet(undefined)).toBe('');
    });

    it('leerer String für Wrapper ohne poster-Feld', () => {
      expect(getPosterSrcSet({})).toBe('');
    });

    it('leerer String für externe/finale http-URLs (nicht skalierbar)', () => {
      expect(getPosterSrcSet('https://cdn.example.com/x.jpg')).toBe('');
    });

    it('baut ein srcset über 4 Größen aus einem relativen Pfad', () => {
      const result = getPosterSrcSet('/abc.jpg');
      expect(result).toBe(
        [
          `${TMDB_BASE}/w185/abc.jpg 185w`,
          `${TMDB_BASE}/w342/abc.jpg 342w`,
          `${TMDB_BASE}/w500/abc.jpg 500w`,
          `${TMDB_BASE}/w780/abc.jpg 780w`,
        ].join(', ')
      );
    });

    it('liest den poster-Pfad auch aus einem Wrapper-Objekt', () => {
      expect(getPosterSrcSet({ poster: '/y.jpg' })).toContain(`${TMDB_BASE}/w185/y.jpg 185w`);
    });
  });
});
