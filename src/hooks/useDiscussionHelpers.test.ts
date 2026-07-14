// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock: ref(path).push(entry). Aufrufe werden in state gesammelt.
const fb = vi.hoisted(() => {
  const state = {
    pushCalls: [] as Array<{ path: string; value: unknown }>,
    pushShouldReject: false,
  };
  const ref = (path: string) => ({
    push: async (value: unknown) => {
      if (state.pushShouldReject) throw new Error('permission denied');
      state.pushCalls.push({ path, value });
      return { key: 'notif-id' };
    },
  });
  return { state, ref };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import { getDiscussionPath, sendNotificationToUser } from './useDiscussionHelpers';

beforeEach(() => {
  fb.state.pushCalls = [];
  fb.state.pushShouldReject = false;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDiscussionPath', () => {
  it('baut den Serien-Pfad aus itemType + itemId', () => {
    expect(getDiscussionPath('series', 42)).toBe('discussions/series/42');
  });

  it('baut den Movie-Pfad aus itemType + itemId', () => {
    expect(getDiscussionPath('movie', 7)).toBe('discussions/movie/7');
  });

  it('baut den Episode-Pfad mit Season + Episode', () => {
    expect(getDiscussionPath('episode', 100, 2, 5)).toBe('discussions/episode/100_s2_e5');
  });

  it('fällt auf den generischen Pfad zurück, wenn Season/Episode fehlen', () => {
    // episode ohne season/episode → generischer discussions/episode/{id}
    expect(getDiscussionPath('episode', 100)).toBe('discussions/episode/100');
  });
});

describe('sendNotificationToUser', () => {
  it('pusht die Notification an den Ziel-User inkl. timestamp + read=false', async () => {
    await sendNotificationToUser('target-user', {
      type: 'discussion_like',
      title: 'Neue Reaktion',
      message: 'Hallo',
      data: { discussionId: 'd1' },
    });

    expect(fb.state.pushCalls).toHaveLength(1);
    const call = fb.state.pushCalls[0];
    expect(call?.path).toBe('users/target-user/notifications');
    const value = call?.value as Record<string, unknown>;
    expect(value.type).toBe('discussion_like');
    expect(value.read).toBe(false);
    expect(typeof value.timestamp).toBe('number');
  });

  it('fängt Push-Fehler ab (best-effort, kein Throw)', async () => {
    fb.state.pushShouldReject = true;
    await expect(
      sendNotificationToUser('target-user', {
        type: 'spoiler_flag',
        title: 't',
        message: 'm',
      })
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
