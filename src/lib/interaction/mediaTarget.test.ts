// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mediaTargetProps, readMediaTarget } from './mediaTarget';

const mount = (attrs: Record<string, string>, inner = '<span class="inner">x</span>') => {
  const el = document.createElement('div');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML = inner;
  document.body.appendChild(el);
  return el;
};

describe('mediaTargetProps', () => {
  it('markiert Serien und Filme, tv zählt als Serie', () => {
    expect(mediaTargetProps({ type: 'tv', id: 5, title: 'Loki' })).toEqual({
      'data-media-type': 'series',
      'data-media-id': '5',
      'data-media-title': 'Loki',
    });
    expect(mediaTargetProps({ type: 'movie', id: '7', poster: '/p.jpg' })).toEqual({
      'data-media-type': 'movie',
      'data-media-id': '7',
      'data-media-poster': '/p.jpg',
    });
  });

  it('lässt ungültige IDs unmarkiert', () => {
    expect(mediaTargetProps({ type: 'movie', id: undefined })).toEqual({});
    expect(mediaTargetProps({ type: 'movie', id: 'abc' })).toEqual({});
    expect(mediaTargetProps({ type: 'movie', id: 0 })).toEqual({});
  });
});

describe('readMediaTarget', () => {
  it('findet das markierte Element über Kindknoten', () => {
    const el = mount(mediaTargetProps({ type: 'movie', id: 3, title: 'Iron Man' }));
    expect(readMediaTarget(el.querySelector('.inner'))).toEqual({
      type: 'movie',
      id: 3,
      title: 'Iron Man',
      poster: undefined,
    });
  });

  it('respektiert abgeschaltete Bereiche', () => {
    const el = mount({ 'data-media-actions': 'off' });
    el.innerHTML = '<div data-media-id="4" data-media-type="series"><b>t</b></div>';
    expect(readMediaTarget(el.querySelector('b'))).toBeNull();
    expect(readMediaTarget(null)).toBeNull();
  });
});
