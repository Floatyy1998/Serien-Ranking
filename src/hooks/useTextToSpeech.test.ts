// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTextToSpeech } from './useTextToSpeech';
import { backendFetch } from '../services/backendApi';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('../services/backendApi', () => ({
  backendFetch: vi.fn(),
}));

const mockedBackendFetch = vi.mocked(backendFetch);

// Minimaler Audio-Stub: play() feuert onplay (wie eine echte Wiedergabe) und
// resolved. onended/onerror werden vom Test manuell getriggert.
class MockAudio {
  static instances: MockAudio[] = [];
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string;
  play = vi.fn(async () => {
    this.onplay?.();
  });
  pause = vi.fn();
  constructor(src: string) {
    this.src = src;
    MockAudio.instances.push(this);
  }
}

function makeResponse(init: { ok: boolean; status?: number }): Response {
  return {
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    blob: async () => new Blob(['audio']),
  } as unknown as Response;
}

beforeEach(() => {
  MockAudio.instances = [];
  mockedBackendFetch.mockReset();
  vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
  // URL.createObjectURL existiert in jsdom nicht zuverlässig — stubben.
  (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = vi.fn(
    () => 'blob:mock-url'
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTextToSpeech', () => {
  it('startet im idle-Zustand', () => {
    const { result } = renderHook(() => useTextToSpeech());
    expect(result.current.state).toBe('idle');
  });

  it('lädt TTS vom Backend, spielt das Audio ab und wechselt zu speaking', async () => {
    mockedBackendFetch.mockResolvedValue(makeResponse({ ok: true }));
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Hallo Welt eins');
    });

    expect(mockedBackendFetch).toHaveBeenCalledTimes(1);
    const [path, init] = mockedBackendFetch.mock.calls[0];
    expect(path).toBe('/ai/tts');
    expect(String((init as RequestInit).body)).toContain('user-1');
    expect(MockAudio.instances).toHaveLength(1);
    expect(MockAudio.instances[0].play).toHaveBeenCalled();
    await waitFor(() => expect(result.current.state).toBe('speaking'));
  });

  it('togglet beim zweiten speak-Aufruf wieder aus (idle) und pausiert das Audio', async () => {
    mockedBackendFetch.mockResolvedValue(makeResponse({ ok: true }));
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Toggle Text');
    });
    await waitFor(() => expect(result.current.state).toBe('speaking'));

    await act(async () => {
      await result.current.speak('Toggle Text');
    });

    expect(result.current.state).toBe('idle');
    expect(MockAudio.instances[0].pause).toHaveBeenCalled();
    // Kein zweiter Backend-Call — der zweite Aufruf ist ein reines Stop.
    expect(mockedBackendFetch).toHaveBeenCalledTimes(1);
  });

  it('nutzt beim zweiten Abspielen desselben Textes den Cache statt eines neuen Fetch', async () => {
    mockedBackendFetch.mockResolvedValue(makeResponse({ ok: true }));
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Cached Line unique');
    });
    await waitFor(() => expect(result.current.state).toBe('speaking'));

    // Wiedergabe beenden → idle, damit der nächste speak nicht togglet.
    act(() => {
      MockAudio.instances[0].onended?.();
    });
    expect(result.current.state).toBe('idle');

    await act(async () => {
      await result.current.speak('Cached Line unique');
    });

    // Zweiter Play, aber nur EIN Backend-Fetch (Cache-Treffer).
    expect(mockedBackendFetch).toHaveBeenCalledTimes(1);
    expect(MockAudio.instances).toHaveLength(2);
  });

  it('bleibt idle, wenn das Backend einen Fehler liefert', async () => {
    mockedBackendFetch.mockResolvedValue(makeResponse({ ok: false, status: 500 }));
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Fehlerfall Text');
    });

    expect(result.current.state).toBe('idle');
    expect(MockAudio.instances).toHaveLength(0);
  });

  it('macht bei leerem/whitespace Text keinen Backend-Call', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('   ');
    });

    expect(mockedBackendFetch).not.toHaveBeenCalled();
    expect(result.current.state).toBe('idle');
  });

  it('stop() setzt den Zustand auf idle und pausiert das aktive Audio', async () => {
    mockedBackendFetch.mockResolvedValue(makeResponse({ ok: true }));
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Stopbarer Text');
    });
    await waitFor(() => expect(result.current.state).toBe('speaking'));

    act(() => {
      result.current.stop();
    });

    expect(result.current.state).toBe('idle');
    expect(MockAudio.instances[0].pause).toHaveBeenCalled();
  });

  it('pausiert das Audio beim Unmount (Cleanup)', async () => {
    mockedBackendFetch.mockResolvedValue(makeResponse({ ok: true }));
    const { result, unmount } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Unmount Text');
    });
    await waitFor(() => expect(result.current.state).toBe('speaking'));

    unmount();
    expect(MockAudio.instances[0].pause).toHaveBeenCalled();
  });
});
