import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  dbGet: vi.fn(async () => ({ a: true, b: true })),
  dbUpdate: vi.fn(async () => {}),
  dbRef: vi.fn(() => ({ push: () => ({ key: 'm1' }), set: vi.fn(async () => {}) })),
}));

vi.mock('../db/ref', () => ({
  ...db,
  userPath: (uid: string, ...segments: string[]) => ['users', uid, ...segments].join('/'),
}));
const push = vi.hoisted(() => ({ queuePush: vi.fn() }));
vi.mock('../notifications/pushQueue', () => push);

import { sendMessage, type SharedEpisode } from './chatService';

const episode: SharedEpisode = {
  seriesId: 209867,
  season: 1,
  episode: 5,
  seriesTitle: 'Frieren',
  episodeTitle: 'Phantome der Toten',
  poster: '/dqZENchTd7lp5zht7BdlqM7RBhD.jpg',
};

const written = () => {
  const calls = db.dbUpdate.mock.calls as unknown as [Record<string, unknown>][];
  return calls[calls.length - 1][0];
};

describe('Folge im Chat teilen', () => {
  beforeEach(() => {
    db.dbUpdate.mockClear();
    push.queuePush.mockClear();
  });

  it('speichert die Folge kompakt und zeigt in Liste und Push keinen Folgentitel', async () => {
    await sendMessage('a', 'b', { kind: 'episode', episode, text: 'Krass!' }, 'Konrad');
    const update = written();
    const message = Object.entries(update).find(([path]) => path.includes('/messages/'))?.[1];
    expect(message).toMatchObject({
      s: 'a',
      t: 'Krass!',
      ep: { id: 209867, s: 1, e: 5, n: 'Frieren', et: 'Phantome der Toten', p: episode.poster },
    });
    const preview = Object.entries(update).find(([path]) => path.endsWith('summary/lastMessage'));
    expect(preview?.[1]).toBe('Frieren S1·E5 – Krass!');
    expect(push.queuePush).toHaveBeenCalledWith(
      'b',
      expect.objectContaining({ body: 'Frieren S1·E5 – Krass!' })
    );
  });

  it('hält einen Spoiler-Kommentar aus Vorschau und Push heraus', async () => {
    await sendMessage(
      'a',
      'b',
      { kind: 'episode', episode, text: 'Er stirbt', spoiler: true },
      'Konrad'
    );
    const update = written();
    const message = Object.entries(update).find(([path]) => path.includes('/messages/'))?.[1];
    expect(message).toMatchObject({ t: 'Er stirbt', sp: true });
    expect(JSON.stringify(push.queuePush.mock.calls)).not.toContain('Er stirbt');
    expect(Object.entries(update).find(([path]) => path.endsWith('summary/lastMessage'))?.[1]).toBe(
      'Frieren S1·E5'
    );
  });

  it('lässt fremde Poster-Pfade weg', async () => {
    await sendMessage(
      'a',
      'b',
      { kind: 'episode', episode: { ...episode, poster: 'https://evil.test/x.jpg' } },
      'Konrad'
    );
    const message = Object.entries(written()).find(([path]) => path.includes('/messages/'))?.[1];
    expect((message as { ep: Record<string, unknown> }).ep.p).toBeUndefined();
    expect((message as Record<string, unknown>).t).toBeUndefined();
  });
});
