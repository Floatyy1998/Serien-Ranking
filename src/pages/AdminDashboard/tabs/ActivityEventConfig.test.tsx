// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  EVENT_CONFIG,
  FILTERS,
  formatDateLabel,
  formatDateTime,
  getSourceBadge,
  toDateKey,
  type RawEvent,
} from './ActivityEventConfig';

describe('ActivityEventConfig', () => {
  it('EVENT_CONFIG entries format their detail strings', () => {
    const watched = EVENT_CONFIG['episode_watched'];
    expect(watched.getDetail({ series_name: 'Lost', season: 1, episode: 2 })).toBe('Lost — S1E2');
    expect(EVENT_CONFIG['series_added'].getDetail({ series_name: 'Dark' })).toBe('Dark');
    expect(EVENT_CONFIG['rating_saved'].getDetail({ item_type: 'series', rating: 9 })).toBe(
      'series — 9/10'
    );
  });

  it('getSourceBadge distinguishes extension, app and untagged events', () => {
    const ext: RawEvent = { e: 'ext_episode_marked', p: { platform: 'netflix' }, t: 0, uid: 'x' };
    expect(getSourceBadge(ext)).toEqual({ label: 'Extension · netflix', color: '#e17055' });

    const app: RawEvent = { e: 'episode_watched', t: 0, uid: 'x' };
    expect(getSourceBadge(app)).toEqual({ label: 'App', color: '#0984e3' });

    const none: RawEvent = { e: 'page_view', t: 0, uid: 'x' };
    expect(getSourceBadge(none)).toBeNull();
  });

  it('toDateKey / formatDateLabel handle today and formatDateTime returns parts', () => {
    const today = toDateKey(new Date());
    expect(formatDateLabel(today)).toBe('Heute');
    const parts = formatDateTime(Date.now());
    expect(parts).toHaveProperty('date');
    expect(parts).toHaveProperty('time');
    expect(FILTERS[0]).toMatchObject({ id: 'all', label: 'Alle' });
  });
});
