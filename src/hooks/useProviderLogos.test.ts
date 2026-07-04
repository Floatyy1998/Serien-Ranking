// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';

const listState = vi.hoisted(() => ({
  allSeriesList: [] as Series[],
  movieList: [] as Movie[],
}));
vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: listState.allSeriesList }),
}));
vi.mock('../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: listState.movieList }),
}));

import { useProviderLogos, tmdbLogoUrl } from './useProviderLogos';

type ProviderEntry = { logo: string; name: string };
const seriesWith = (providers: ProviderEntry[]): Series =>
  ({ provider: { provider: providers } }) as unknown as Series;
const movieWith = (providers: ProviderEntry[]): Movie =>
  ({ provider: { provider: providers } }) as unknown as Movie;

beforeEach(() => {
  listState.allSeriesList = [];
  listState.movieList = [];
});

describe('useProviderLogos', () => {
  it('gibt eine leere Map ohne Serien/Filme zurück', () => {
    const { result } = renderHook(() => useProviderLogos());
    expect(result.current).toEqual({});
  });

  it('mappt normalisierte Provider-Namen auf ihr Logo', () => {
    listState.allSeriesList = [seriesWith([{ name: 'Netflix', logo: '/nflx.png' }])];
    const { result } = renderHook(() => useProviderLogos());
    expect(result.current).toEqual({ Netflix: '/nflx.png' });
  });

  it('erster Treffer gewinnt (spätere Duplikate überschreiben nicht)', () => {
    listState.allSeriesList = [
      seriesWith([{ name: 'Netflix', logo: '/first.png' }]),
      seriesWith([{ name: 'Netflix Standard with Ads', logo: '/second.png' }]),
    ];
    const { result } = renderHook(() => useProviderLogos());
    expect(result.current.Netflix).toBe('/first.png');
  });

  it('bezieht auch Film-Provider ein', () => {
    listState.movieList = [movieWith([{ name: 'Disney+', logo: '/disney.png' }])];
    const { result } = renderHook(() => useProviderLogos());
    expect(result.current['Disney Plus']).toBe('/disney.png');
  });

  it('ignoriert Einträge ohne logo oder name und nicht-normalisierbare Namen', () => {
    listState.allSeriesList = [
      seriesWith([
        { name: '', logo: '/x.png' },
        { name: 'Some Unknown Channel', logo: '/y.png' },
        { name: 'Amazon Prime Video', logo: '/amz.png' },
      ]),
    ];
    const { result } = renderHook(() => useProviderLogos());
    expect(result.current).toEqual({ 'Amazon Prime Video': '/amz.png' });
  });

  it('verträgt fehlendes provider-Objekt', () => {
    listState.allSeriesList = [{} as unknown as Series];
    const { result } = renderHook(() => useProviderLogos());
    expect(result.current).toEqual({});
  });
});

describe('tmdbLogoUrl', () => {
  it('gibt null für undefined zurück', () => {
    expect(tmdbLogoUrl(undefined)).toBeNull();
  });

  it('lässt absolute http-URLs unverändert', () => {
    expect(tmdbLogoUrl('http://x/y.png')).toBe('http://x/y.png');
  });

  it('baut die TMDB-URL mit Default-Größe w92', () => {
    expect(tmdbLogoUrl('/logo.png')).toBe('https://image.tmdb.org/t/p/w92/logo.png');
  });

  it('respektiert eine explizite Größe', () => {
    expect(tmdbLogoUrl('/logo.png', 'w154')).toBe('https://image.tmdb.org/t/p/w154/logo.png');
  });
});
