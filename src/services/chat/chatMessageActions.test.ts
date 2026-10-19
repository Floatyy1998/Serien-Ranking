import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  updates: [] as Record<string, unknown>[],
  storageDeletes: [] as string[],
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    storage: () => ({
      ref: (path: string) => ({
        delete: async () => {
          fb.storageDeletes.push(path);
        },
      }),
    }),
  },
}));
vi.mock('firebase/compat/storage', () => ({}));
vi.mock('../db/ref', () => ({
  dbGet: vi.fn(async () => ({ u1: true, u2: true })),
  dbRef: vi.fn(() => ({
    push: () => ({ key: 'msg9' }),
    set: async () => {},
  })),
  dbUpdate: vi.fn(async (u: Record<string, unknown>) => {
    fb.updates.push(u);
  }),
  userPath: (uid: string, ...segments: string[]) => ['users', uid, ...segments].join('/'),
}));
vi.mock('../notifications/pushQueue', () => ({ queuePush: vi.fn() }));

import {
  copyableText,
  deleteMessageForAll,
  editMessage,
  forwardMessages,
  setStarred,
} from './chatMessageActions';
import type { ChatMessage } from './chatService';
import { queuePush } from '../notifications/pushQueue';

const base: ChatMessage = { id: 'm1', senderId: 'u1', text: 'Hallo', timestamp: 100 };

beforeEach(() => {
  vi.mocked(queuePush).mockClear();
  fb.updates = [];
  fb.storageDeletes = [];
});

describe('copyableText', () => {
  it('kopiert Text, aber weder Sticker noch Gelöschtes', () => {
    expect(copyableText(base)).toBe('Hallo');
    expect(copyableText({ ...base, text: '', stickerId: 'fox-60' })).toBeNull();
    expect(copyableText({ ...base, text: '', deleted: true })).toBeNull();
  });

  it('nimmt bei geteilten Folgen Serie und Folge mit', () => {
    const episode = { seriesId: 1, season: 2, episode: 3, seriesTitle: 'Dark' };
    expect(copyableText({ ...base, text: 'Krass', episode })).toBe('Dark S2·E3\nKrass');
  });
});

describe('deleteMessageForAll', () => {
  it('ersetzt die Nachricht durch einen Grabstein mit gleichem Zeitstempel', async () => {
    await deleteMessageForAll('u1', 'u1_u2', base, null, null);
    expect(fb.updates[0]).toEqual({
      'chats/u1_u2/messages/m1': { s: 'u1', ts: 100, del: true },
      'chats/u1_u2/reactions/m1/u1': null,
    });
  });

  it('räumt Vorschau, Fixierung und das Bild im Storage mit ab', async () => {
    await deleteMessageForAll(
      'u1',
      'u1_u2',
      { ...base, imageUrl: 'https://firebasestorage.googleapis.com/x' },
      { lastMessageAt: 100, lastMessage: 'Hallo' },
      'm1'
    );
    expect(fb.updates[0]).toMatchObject({
      'chats/u1_u2/summary/lastMessage': 'Nachricht gelöscht',
      'chats/u1_u2/pinned': null,
    });
    expect(fb.storageDeletes).toEqual(['chat-images/u1_u2/m1']);
  });

  it('lässt fremde Nachrichten in Ruhe', async () => {
    await deleteMessageForAll('u1', 'u1_u2', { ...base, senderId: 'u2' }, null, null);
    expect(fb.updates).toEqual([]);
  });
});

describe('setStarred', () => {
  it('friert beim Markieren einen Auszug ein — Spoiler nie im Klartext', async () => {
    await setStarred('u1', 'u1_u2', [{ ...base, text: 'Er stirbt', isSpoiler: true }], true);
    expect(fb.updates[0]).toEqual({
      'users/u1/chatStars/u1_u2/m1': { id: 'm1', s: 'u1', k: 'sp', ts: 100 },
    });
  });
});

describe('forwardMessages', () => {
  it('schickt Texte als weitergeleitet und überspringt Gelöschtes', async () => {
    await forwardMessages(
      'u1',
      'u3',
      [base, { ...base, id: 'm2', deleted: true, text: '' }],
      'Konrad'
    );
    const written = fb.updates
      .flatMap((u) => Object.entries(u))
      .filter(([path]) => path.includes('/messages/'))
      .map(([, value]) => value);
    expect(written).toEqual([{ s: 'u1', ts: expect.any(Number), t: 'Hallo', fw: true }]);
  });
});

describe('editMessage', () => {
  const fresh = { ...base, timestamp: Date.now() - 60_000 };

  it('schreibt nur Text und Bearbeitungszeitpunkt', async () => {
    await editMessage('u1', 'u1_u2', fresh, '  Hallo zusammen ');
    expect(fb.updates[0]).toEqual({
      'chats/u1_u2/messages/m1/t': 'Hallo zusammen',
      'chats/u1_u2/messages/m1/ed': expect.any(Number),
    });
  });

  it('lässt abgelaufene, fremde und Bild-Nachrichten unverändert', async () => {
    await editMessage('u1', 'u1_u2', { ...fresh, timestamp: Date.now() - 16 * 60_000 }, 'x');
    await editMessage('u1', 'u1_u2', { ...fresh, senderId: 'u2' }, 'x');
    await editMessage('u1', 'u1_u2', { ...fresh, imageUrl: 'https://x' }, 'x');
    await editMessage('u1', 'u1_u2', fresh, 'Hallo');
    expect(fb.updates).toEqual([]);
  });
});

describe('Push beim Empfänger austauschen', () => {
  it('Löschen reiht einen Ersetzen-Push für die Nachricht ein', async () => {
    await deleteMessageForAll('u1', 'u1_u2', base, null, null);
    await vi.waitFor(() => expect(queuePush).toHaveBeenCalled());
    expect(queuePush).toHaveBeenCalledWith(
      'u2',
      expect.objectContaining({
        url: '/chat/u1',
        mid: 'm1',
        op: 'delete',
        body: 'Diese Nachricht wurde gelöscht.',
      })
    );
  });

  it('Bearbeiten schickt den neuen Text, bei Spoilern nur „Spoiler“', async () => {
    const fresh = { ...base, timestamp: Date.now() - 60_000 };
    await editMessage('u1', 'u1_u2', fresh, 'Neu');
    await editMessage('u1', 'u1_u2', { ...fresh, id: 'm2', isSpoiler: true }, 'Er stirbt');
    await vi.waitFor(() => expect(queuePush).toHaveBeenCalledTimes(2));
    expect(queuePush).toHaveBeenNthCalledWith(
      1,
      'u2',
      expect.objectContaining({ mid: 'm1', op: 'edit', body: 'Neu' })
    );
    expect(queuePush).toHaveBeenNthCalledWith(
      2,
      'u2',
      expect.objectContaining({ mid: 'm2', op: 'edit', body: 'Spoiler' })
    );
  });
});
