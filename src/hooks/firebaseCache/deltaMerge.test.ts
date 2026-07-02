import { describe, expect, it } from 'vitest';
import {
  collectChildPropKeys,
  collectKnownKeys,
  collectKnownSubKeys,
  mergeChildRemoval,
  mergeChildUpdate,
  mergePropRemoval,
  mergePropUpdate,
  mergeSubChildRemoval,
  mergeSubChildUpdate,
} from './deltaMerge';

type State = Record<string, Record<string, unknown>>;

describe('mergeSubChildUpdate', () => {
  it('aktualisiert einen Key in einer Objekt-Sub-Collection immutabel', () => {
    const prev: State = { s1: { seasons: { '0': { eps: 1 } }, rating: 5 } };
    const result = mergeSubChildUpdate<State>(prev, 's1', 'seasons', '1', { eps: 2 });
    expect(result).toEqual({
      s1: { seasons: { '0': { eps: 1 }, '1': { eps: 2 } }, rating: 5 },
    });
    expect(result).not.toBe(prev);
    // prev bleibt unangetastet
    expect(prev.s1.seasons).toEqual({ '0': { eps: 1 } });
  });

  it('setzt bei Array-Sub-Collections den numerischen Index', () => {
    const prev: State = { s1: { seasons: [{ eps: 1 }, { eps: 2 }] } };
    const result = mergeSubChildUpdate<State>(prev, 's1', 'seasons', '1', { eps: 99 });
    expect(result?.s1.seasons).toEqual([{ eps: 1 }, { eps: 99 }]);
    expect(Array.isArray(result?.s1.seasons)).toBe(true);
  });

  it('gibt dieselbe Referenz zurück, wenn das Child nicht im State existiert', () => {
    const prev: State = { s1: { seasons: {} } };
    const result = mergeSubChildUpdate<State>(prev, 'unknown', 'seasons', '0', {});
    expect(result).toBe(prev);
  });

  it('erzeugt die Sub-Collection, wenn sie noch nicht existiert (spread von undefined)', () => {
    const prev: State = { s1: { rating: 5 } };
    const result = mergeSubChildUpdate<State>(prev, 's1', 'seasons', '0', { eps: 1 });
    expect(result?.s1.seasons).toEqual({ '0': { eps: 1 } });
  });
});

describe('mergeSubChildRemoval', () => {
  it('entfernt einen Key aus einer Objekt-Sub-Collection', () => {
    const prev: State = { s1: { seasons: { '0': { eps: 1 }, '1': { eps: 2 } } } };
    const result = mergeSubChildRemoval<State>(prev, 's1', 'seasons', '1');
    expect(result?.s1.seasons).toEqual({ '0': { eps: 1 } });
    expect(prev.s1.seasons).toEqual({ '0': { eps: 1 }, '1': { eps: 2 } });
  });

  it('löscht bei Arrays den Index als Loch (Länge bleibt erhalten)', () => {
    const prev: State = { s1: { seasons: [{ eps: 1 }, { eps: 2 }] } };
    const result = mergeSubChildRemoval<State>(prev, 's1', 'seasons', '0');
    const seasons = result?.s1.seasons as unknown[];
    expect(seasons.length).toBe(2);
    expect(seasons[0]).toBeUndefined();
    expect(seasons[1]).toEqual({ eps: 2 });
  });

  it('gibt dieselbe Referenz zurück, wenn das Child fehlt', () => {
    const prev: State = { s1: { seasons: {} } };
    expect(mergeSubChildRemoval<State>(prev, 'unknown', 'seasons', '0')).toBe(prev);
  });

  it('gibt dieselbe Referenz zurück, wenn die Sub-Collection kein Objekt ist', () => {
    const prev: State = { s1: { seasons: 42 } };
    expect(mergeSubChildRemoval<State>(prev, 's1', 'seasons', '0')).toBe(prev);
  });
});

describe('mergePropUpdate', () => {
  it('setzt eine Metadaten-Property immutabel', () => {
    const prev: State = { s1: { rating: 5, hidden: false } };
    const result = mergePropUpdate<State>(prev, 's1', 'rating', 9);
    expect(result?.s1).toEqual({ rating: 9, hidden: false });
    expect(prev.s1.rating).toBe(5);
  });

  it('fügt eine neue Property hinzu', () => {
    const prev: State = { s1: { rating: 5 } };
    const result = mergePropUpdate<State>(prev, 's1', 'watchlist', true);
    expect(result?.s1).toEqual({ rating: 5, watchlist: true });
  });

  it('gibt dieselbe Referenz zurück, wenn das Child fehlt', () => {
    const prev: State = { s1: {} };
    expect(mergePropUpdate<State>(prev, 'unknown', 'rating', 9)).toBe(prev);
  });
});

describe('mergePropRemoval', () => {
  it('entfernt eine Property', () => {
    const prev: State = { s1: { rating: 5, hidden: true } };
    const result = mergePropRemoval<State>(prev, 's1', 'hidden');
    expect(result?.s1).toEqual({ rating: 5 });
    expect(prev.s1).toEqual({ rating: 5, hidden: true });
  });

  it('gibt dieselbe Referenz zurück, wenn das Child fehlt', () => {
    const prev: State = { s1: {} };
    expect(mergePropRemoval<State>(prev, 'unknown', 'rating')).toBe(prev);
  });
});

describe('mergeChildUpdate', () => {
  it('ersetzt/ergänzt ein Top-Level-Child immutabel', () => {
    const prev: State = { s1: { rating: 5 } };
    const result = mergeChildUpdate<State>(prev, 's2', { rating: 7 });
    expect(result).toEqual({ s1: { rating: 5 }, s2: { rating: 7 } });
    expect(result).not.toBe(prev);
  });

  it('funktioniert auch mit prev=null (erzeugt neues Objekt)', () => {
    const result = mergeChildUpdate<State>(null, 's1', { rating: 5 });
    expect(result).toEqual({ s1: { rating: 5 } });
  });
});

describe('mergeChildRemoval', () => {
  it('entfernt ein Top-Level-Child', () => {
    const prev: State = { s1: { rating: 5 }, s2: { rating: 7 } };
    const result = mergeChildRemoval<State>(prev, 's2');
    expect(result).toEqual({ s1: { rating: 5 } });
    expect(prev.s2).toEqual({ rating: 7 });
  });

  it('gibt null-prev unverändert zurück', () => {
    expect(mergeChildRemoval<State>(null, 's1')).toBe(null);
  });

  it('gibt Nicht-Objekt-prev unverändert zurück', () => {
    const prev = 'kein-objekt' as unknown as State;
    expect(mergeChildRemoval<State>(prev, 's1')).toBe(prev);
  });
});

describe('collectKnownKeys', () => {
  it('sammelt die Top-Level-Keys', () => {
    expect(collectKnownKeys({ a: 1, b: 2 })).toEqual(new Set(['a', 'b']));
  });

  it('null/undefined → leeres Set', () => {
    expect(collectKnownKeys(null)).toEqual(new Set());
    expect(collectKnownKeys(undefined)).toEqual(new Set());
  });

  it('Nicht-Objekt → leeres Set', () => {
    expect(collectKnownKeys('abc')).toEqual(new Set());
  });
});

describe('collectKnownSubKeys', () => {
  it('sammelt die Keys der Sub-Collection eines Childs', () => {
    const data = { s1: { seasons: { '0': {}, '1': {} } } };
    expect(collectKnownSubKeys(data, 's1', 'seasons')).toEqual(new Set(['0', '1']));
  });

  it('fehlendes Child → leeres Set', () => {
    expect(collectKnownSubKeys({}, 's1', 'seasons')).toEqual(new Set());
  });

  it('Sub-Collection kein Objekt → leeres Set', () => {
    expect(collectKnownSubKeys({ s1: { seasons: 3 } }, 's1', 'seasons')).toEqual(new Set());
  });
});

describe('collectChildPropKeys', () => {
  it('sammelt die Property-Keys eines Childs', () => {
    const data = { s1: { rating: 5, seasons: {} } };
    expect(collectChildPropKeys(data, 's1')).toEqual(new Set(['rating', 'seasons']));
  });

  it('fehlendes Child → leeres Set', () => {
    expect(collectChildPropKeys({}, 's1')).toEqual(new Set());
  });
});
