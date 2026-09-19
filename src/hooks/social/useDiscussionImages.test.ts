// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const upload = vi.hoisted(() => vi.fn(async () => 'https://store/bild.gif'));
const toast = vi.hoisted(() => vi.fn());
const clipboard = vi.hoisted(() => ({
  extracted: { file: null as File | null, gifUrl: null as string | null },
  resolved: null as File | null,
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../lib/interaction/toast', () => ({ showToast: toast }));
vi.mock('../../services/discussion/discussionImages', () => ({ uploadDiscussionImage: upload }));
vi.mock('../../services/media/clipboardImage', () => ({
  extractClipboardImage: () => clipboard.extracted,
  resolveClipboardImage: async () => clipboard.resolved,
}));

import { useDiscussionImages } from './useDiscussionImages';

const gif = () => new File(['g'], 'clipboard.gif', { type: 'image/gif' });
const pasteEvent = () =>
  ({ clipboardData: {}, preventDefault: vi.fn() }) as unknown as React.ClipboardEvent & {
    preventDefault: ReturnType<typeof vi.fn>;
  };

beforeEach(() => {
  upload.mockClear();
  upload.mockResolvedValue('https://store/bild.gif');
  toast.mockClear();
  clipboard.extracted = { file: null, gifUrl: null };
  clipboard.resolved = null;
});

describe('useDiscussionImages', () => {
  it('lädt ein eingefügtes GIF hoch und hängt es an', async () => {
    clipboard.extracted = { file: null, gifUrl: 'https://x/a.gif' };
    clipboard.resolved = gif();
    const { result } = renderHook(() => useDiscussionImages());
    const event = pasteEvent();

    act(() => result.current.handlePaste(event));

    expect(event.preventDefault).toHaveBeenCalled();
    await waitFor(() => expect(result.current.images).toEqual(['https://store/bild.gif']));
    expect(upload).toHaveBeenCalledWith('u1', expect.any(File));
  });

  it('lässt Text-Einfügen unangetastet', () => {
    const { result } = renderHook(() => useDiscussionImages());
    const event = pasteEvent();

    act(() => result.current.handlePaste(event));

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
  });

  it('meldet zu große Bilder', async () => {
    upload.mockRejectedValueOnce(new Error('too-large'));
    clipboard.extracted = { file: gif(), gifUrl: null };
    clipboard.resolved = gif();
    const { result } = renderHook(() => useDiscussionImages());

    act(() => result.current.handlePaste(pasteEvent()));

    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(toast.mock.calls[0][0]).toContain('8 MB');
    expect(result.current.images).toEqual([]);
  });

  it('entfernt und leert Anhänge', async () => {
    clipboard.extracted = { file: gif(), gifUrl: null };
    clipboard.resolved = gif();
    const { result } = renderHook(() => useDiscussionImages());

    act(() => result.current.handlePaste(pasteEvent()));
    await waitFor(() => expect(result.current.images).toHaveLength(1));

    act(() => result.current.removeImage('https://store/bild.gif'));
    expect(result.current.images).toEqual([]);

    act(() => result.current.reset());
    expect(result.current.images).toEqual([]);
  });
});
