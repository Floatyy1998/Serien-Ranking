import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  updates: [] as Record<string, unknown>[],
  pushes: [] as unknown[],
}));

vi.mock('../db/ref', () => ({
  dbGet: vi.fn(async () => ({ u1: true, u2: true })),
  dbRef: vi.fn(() => ({
    push: () => ({ key: 'msg2' }),
    set: async () => {},
  })),
  dbUpdate: vi.fn(async (u: Record<string, unknown>) => {
    fb.updates.push(u);
  }),
  userPath: (uid: string, ...segments: string[]) => ['users', uid, ...segments].join('/'),
}));
vi.mock('../notifications/pushQueue', () => ({
  queuePush: vi.fn((_uid: string, payload: unknown) => {
    fb.pushes.push(payload);
  }),
}));

import { replyFromMessage, sendMessage, type ChatMessage } from './chatService';

const base: ChatMessage = { id: 'm1', senderId: 'u2', text: '', timestamp: 1 };

beforeEach(() => {
  fb.updates = [];
  fb.pushes = [];
});

describe('replyFromMessage', () => {
  it('übernimmt den Text einer normalen Nachricht', () => {
    expect(replyFromMessage({ ...base, text: 'Wer hat Lust auf Severance?' })).toEqual({
      id: 'm1',
      senderId: 'u2',
      text: 'Wer hat Lust auf Severance?',
    });
  });

  it('zitiert Spoiler nie im Klartext', () => {
    const reply = replyFromMessage({ ...base, text: 'Er stirbt in Folge 8', isSpoiler: true });
    expect(reply).toEqual({ id: 'm1', senderId: 'u2', kind: 'sp' });
  });

  it('lässt bei geteilten Folgen den Spoiler-Kommentar weg', () => {
    const episode = { seriesId: 1, season: 2, episode: 3, seriesTitle: 'Dark', episodeTitle: 'X' };
    expect(replyFromMessage({ ...base, episode, text: 'Das Ende!', isSpoiler: true }).text).toBe(
      'Dark S2·E3'
    );
    expect(replyFromMessage({ ...base, episode, text: 'Krass' }).text).toBe('Dark S2·E3 – Krass');
  });

  it('kennzeichnet Bilder und Sticker', () => {
    expect(replyFromMessage({ ...base, imageUrl: 'https://x/y.webp', text: 'Mein Setup' })).toEqual(
      { id: 'm1', senderId: 'u2', kind: 'img', text: 'Mein Setup' }
    );
    expect(replyFromMessage({ ...base, stickerId: 'cat-25' })).toEqual({
      id: 'm1',
      senderId: 'u2',
      kind: 'st',
      stickerId: 'cat-25',
    });
  });

  it('kürzt lange Texte ohne ein Emoji zu zerteilen', () => {
    const text = `${'a'.repeat(199)}😀 danach`;
    const reply = replyFromMessage({ ...base, text });
    expect(reply.text).toBe('a'.repeat(199));
  });
});

describe('sendMessage mit Zitat', () => {
  it('schreibt das Zitat kompakt unter re, Vorschau und Push bleiben die Antwort', async () => {
    await sendMessage(
      'u1',
      'u2',
      {
        kind: 'text',
        text: 'Ich!',
        replyTo: { id: 'm1', senderId: 'u2', text: 'Wer hat Lust auf Severance?' },
      },
      'Ich'
    );
    const update = fb.updates[0];
    const msgPath = Object.keys(update).find((k) => k.includes('/messages/'));
    expect(update[msgPath as string]).toMatchObject({
      t: 'Ich!',
      re: { id: 'm1', s: 'u2', t: 'Wer hat Lust auf Severance?' },
    });
    const summaryPath = Object.keys(update).find((k) => k.endsWith('lastMessage'));
    expect(update[summaryPath as string]).toBe('Ich!');
    expect(fb.pushes[0]).toMatchObject({ body: 'Ich!' });
  });

  it('schreibt ohne Zitat kein re-Feld', async () => {
    await sendMessage('u1', 'u2', { kind: 'sticker', stickerId: 'cat-25' }, 'Ich');
    const update = fb.updates[0];
    const msgPath = Object.keys(update).find((k) => k.includes('/messages/'));
    expect(update[msgPath as string]).not.toHaveProperty('re');
  });
});
