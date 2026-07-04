// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecommendSheetMedia } from './useRecommendSheet';

interface FbSnap {
  exists: () => boolean;
}

const fb = vi.hoisted(() => {
  const state = { existsForUids: new Set<string>() };
  const ref = vi.fn((path: string) => ({
    once: async (): Promise<FbSnap> => {
      const matched = [...state.existsForUids].some((uid) => path.includes(uid));
      return { exists: () => matched };
    },
  }));
  const database = Object.assign(() => ({ ref }), {});
  return { state, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const friendsState = vi.hoisted(() => ({
  friends: [] as Array<{ uid: string; displayName?: string; username?: string }>,
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({ friends: friendsState.friends }),
}));

const sendMock = vi.hoisted(() => vi.fn<(input: unknown) => Promise<number>>());
vi.mock('../../hooks/useRecommendations', () => ({
  useRecommendations: () => ({ send: sendMock }),
}));

const toast = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock('../../lib/toast', () => ({ showToast: toast.showToast }));

import { useRecommendSheet } from './useRecommendSheet';

const MEDIA: RecommendSheetMedia = { id: 5, type: 'series', title: 'Alpha' };

function setup(isOpen = true) {
  const onClose = vi.fn();
  const view = renderHook(() => useRecommendSheet({ isOpen, onClose, media: MEDIA }));
  return { ...view, onClose };
}

beforeEach(() => {
  fb.state.existsForUids = new Set();
  friendsState.friends = [
    { uid: 'f1', displayName: 'Bea' },
    { uid: 'f2', displayName: 'Ada' },
  ];
  sendMock.mockReset();
  sendMock.mockResolvedValue(2);
  toast.showToast.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useRecommendSheet – library check', () => {
  it('markiert Freunde die das Medium schon besitzen und sortiert verfügbare zuerst', async () => {
    fb.state.existsForUids = new Set(['f1']);
    const { result } = setup(true);
    await waitFor(() => expect(result.current.checkingLibrary).toBe(false));
    expect(result.current.friendsWithMedia.has('f1')).toBe(true);
    expect(result.current.availableCount).toBe(1);
    // Ada (verfügbar) vor Bea (besitzt es schon)
    expect(result.current.sortedFriends.map((f) => f.uid)).toEqual(['f2', 'f1']);
  });

  it('bleibt leer wenn das Sheet geschlossen ist', async () => {
    const { result } = setup(false);
    await waitFor(() => expect(result.current.checkingLibrary).toBe(false));
    expect(result.current.friendsWithMedia.size).toBe(0);
  });
});

describe('useRecommendSheet – selection & send', () => {
  it('toggelt nur verfügbare Freunde', async () => {
    fb.state.existsForUids = new Set(['f1']);
    const { result } = setup(true);
    await waitFor(() => expect(result.current.checkingLibrary).toBe(false));
    act(() => result.current.toggleFriend('f1')); // Besitzer -> ignoriert
    expect(result.current.selected.size).toBe(0);
    act(() => result.current.toggleFriend('f2'));
    expect(result.current.selected.has('f2')).toBe(true);
    act(() => result.current.toggleFriend('f2'));
    expect(result.current.selected.size).toBe(0);
  });

  it('sendet Empfehlungen und zeigt Toast', async () => {
    const { result, onClose } = setup(true);
    await waitFor(() => expect(result.current.checkingLibrary).toBe(false));
    act(() => result.current.toggleFriend('f1'));
    act(() => result.current.setMessage('Schau das!'));
    await act(async () => {
      await result.current.handleSend();
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(toast.showToast).toHaveBeenCalledWith('An 2 Freunde gesendet', 1800);
    expect(onClose).toHaveBeenCalled();
    expect(result.current.selected.size).toBe(0);
  });

  it('handleSend ohne Auswahl macht nichts', async () => {
    const { result } = setup(true);
    await waitFor(() => expect(result.current.checkingLibrary).toBe(false));
    await act(async () => {
      await result.current.handleSend();
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('handleClose resettet Auswahl und Nachricht', async () => {
    const { result, onClose } = setup(true);
    await waitFor(() => expect(result.current.checkingLibrary).toBe(false));
    act(() => result.current.toggleFriend('f1'));
    act(() => result.current.setMessage('Hi'));
    act(() => result.current.handleClose());
    expect(result.current.selected.size).toBe(0);
    expect(result.current.message).toBe('');
    expect(onClose).toHaveBeenCalled();
  });
});
