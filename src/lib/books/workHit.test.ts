import { describe, expect, it } from 'vitest';
import type { BookSearchResult } from '../../types/Book';
import { pickWorkHit } from './workHit';

const hit = (title: string, position?: number, series?: string): BookSearchResult => ({
  id: title,
  title,
  authors: ['Suzanne Collins'],
  source: 'hardcover',
  ...(series ? { series: { name: series, position } } : {}),
});

describe('pickWorkHit', () => {
  it('nimmt bei einem Reihentitel den ersten Band', () => {
    const results = [
      hit('Flammender Zorn', 3, 'Die Tribute von Panem'),
      hit('Tödliche Spiele', 1, 'Die Tribute von Panem'),
      hit('Gefährliche Liebe', 2, 'Die Tribute von Panem'),
    ];
    expect(pickWorkHit(results, 'Die Tribute von Panem')?.title).toBe('Tödliche Spiele');
  });

  it('nimmt keinen späteren Band, der nur wie die Reihe heißt', () => {
    const results = [
      hit('Die Tribute von Panem', 3, 'Die Tribute von Panem'),
      hit('Die Tribute von Panem', 1, 'Die Tribute von Panem'),
    ];
    expect(pickWorkHit(results, 'Die Tribute von Panem')?.series?.position).toBe(1);
  });

  it('liest die Bandnummer aus dem Titel, wenn die Reihe fehlt', () => {
    const results = [
      hit('Die Tribute von Panem 3. Flammender Zorn'),
      hit('Die Tribute von Panem 1. Tödliche Spiele'),
    ];
    expect(pickWorkHit(results, 'Die Tribute von Panem')?.title).toBe(
      'Die Tribute von Panem 1. Tödliche Spiele'
    );
  });

  it('zieht den genauen Titel jedem Band vor', () => {
    const results = [hit('Der Hobbit oder Hin und zurück'), hit('Der Hobbit')];
    expect(pickWorkHit(results, 'Der Hobbit')?.title).toBe('Der Hobbit');
  });

  it('hält Anhänge nicht für das Werk selbst', () => {
    const results = [
      hit('Der Herr der Ringe - Anhänge und Register'),
      hit('Der Herr der Ringe. Bd. 3 - Die Rückkehr des Königs'),
      hit('Der Herr der Ringe. Bd. 1 - Die Gefährten'),
    ];
    expect(pickWorkHit(results, 'Der Herr der Ringe')?.title).toBe(
      'Der Herr der Ringe. Bd. 1 - Die Gefährten'
    );
  });

  it('fällt ohne Bezug zum Titel auf den ersten Treffer zurück', () => {
    const results = [hit('Etwas anderes'), hit('Noch etwas')];
    expect(pickWorkHit(results, 'Momo')?.title).toBe('Etwas anderes');
  });
});
