// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useWebWorker, type WebWorkerOptions } from './useWebWorker';

// ---------------------------------------------------------------------------
// Fake Worker: registriert message/error-Listener (der Hook nutzt
// addEventListener, nicht onmessage) und erlaubt das gezielte Auslösen von
// Events via emit(). postMessage/terminate sind Spies.
// ---------------------------------------------------------------------------
type Listener = (evt: unknown) => void;

class FakeWorker {
  postMessage = vi.fn();
  terminate = vi.fn();
  private listeners: Record<string, Listener[]> = {};
  addEventListener = vi.fn((type: string, cb: Listener) => {
    (this.listeners[type] ||= []).push(cb);
  });
  removeEventListener = vi.fn();
  emit(type: string, evt: unknown) {
    (this.listeners[type] || []).forEach((cb) => cb(evt));
  }
}

let lastWorker: FakeWorker | null = null;
const makeFactory = () => () => {
  lastWorker = new FakeWorker();
  return lastWorker as unknown as Worker;
};

function baseOptions<TInput>(
  over: Partial<WebWorkerOptions<TInput>> = {}
): WebWorkerOptions<TInput> {
  return {
    workerFactory: makeFactory(),
    messageType: 'CALC',
    resultType: 'RESULT',
    data: null,
    depsKey: '',
    ...over,
  } as WebWorkerOptions<TInput>;
}

beforeEach(() => {
  lastWorker = null;
  // rAF synchron ausführen, damit Ergebnis-Updates deterministisch sind.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useWebWorker — initial state', () => {
  it('startet mit initialData, loading=true, error=null', () => {
    const { result } = renderHook(() =>
      useWebWorker<number, string>('init', baseOptions<number>())
    );
    expect(result.current.data).toBe('init');
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('erstellt den Worker über die Factory und registriert message+error Listener', () => {
    renderHook(() => useWebWorker<number, string>('init', baseOptions<number>()));
    expect(lastWorker).not.toBeNull();
    const types = lastWorker!.addEventListener.mock.calls.map((c) => c[0]);
    expect(types).toContain('message');
    expect(types).toContain('error');
  });
});

describe('useWebWorker — posting input', () => {
  it('postet die Eingabe an den Worker sobald data+depsKey gesetzt sind', () => {
    renderHook(() =>
      useWebWorker<{ v: number }, string>(
        'init',
        baseOptions<{ v: number }>({ data: { v: 1 }, depsKey: 'a' })
      )
    );
    expect(lastWorker!.postMessage).toHaveBeenCalledWith({ type: 'CALC', data: { v: 1 } });
  });

  it('postet NICHT wenn enabled=false', () => {
    renderHook(() =>
      useWebWorker<{ v: number }, string>(
        'init',
        baseOptions<{ v: number }>({ data: { v: 1 }, depsKey: 'a', enabled: false })
      )
    );
    expect(lastWorker!.postMessage).not.toHaveBeenCalled();
  });

  it('postet NICHT wenn data=null', () => {
    renderHook(() =>
      useWebWorker<{ v: number }, string>(
        'init',
        baseOptions<{ v: number }>({ data: null, depsKey: 'a' })
      )
    );
    expect(lastWorker!.postMessage).not.toHaveBeenCalled();
  });

  it('dedupliziert: gleicher depsKey postet nicht erneut', () => {
    const { rerender } = renderHook(
      (props: { key: string }) =>
        useWebWorker<{ v: number }, string>(
          'init',
          baseOptions<{ v: number }>({ data: { v: 1 }, depsKey: props.key })
        ),
      { initialProps: { key: 'a' } }
    );
    expect(lastWorker!.postMessage).toHaveBeenCalledTimes(1);
    rerender({ key: 'a' });
    expect(lastWorker!.postMessage).toHaveBeenCalledTimes(1);
  });
});

describe('useWebWorker — receiving results', () => {
  it('setzt data + loading=false wenn eine passende Ergebnis-Nachricht kommt', async () => {
    const { result } = renderHook(() =>
      useWebWorker<{ v: number }, string>(
        'init',
        baseOptions<{ v: number }>({ data: { v: 1 }, depsKey: 'a' })
      )
    );
    act(() => {
      lastWorker!.emit('message', { data: { type: 'RESULT', data: 'done' } });
    });
    await waitFor(() => expect(result.current.data).toBe('done'));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ignoriert Nachrichten mit falschem resultType', () => {
    const { result } = renderHook(() =>
      useWebWorker<{ v: number }, string>(
        'init',
        baseOptions<{ v: number }>({ data: { v: 1 }, depsKey: 'a' })
      )
    );
    act(() => {
      lastWorker!.emit('message', { data: { type: 'OTHER', data: 'nope' } });
    });
    expect(result.current.data).toBe('init');
  });
});

describe('useWebWorker — error handling', () => {
  it('setzt error und loading=false bei einem error-Event', async () => {
    const { result } = renderHook(() =>
      useWebWorker<{ v: number }, string>(
        'init',
        baseOptions<{ v: number }>({ data: { v: 1 }, depsKey: 'a' })
      )
    );
    act(() => {
      lastWorker!.emit('error', { message: 'worker boom' });
    });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error?.message).toBe('worker boom');
    expect(result.current.loading).toBe(false);
  });
});

describe('useWebWorker — debounce', () => {
  it('verzögert postMessage um debounceMs', () => {
    vi.useFakeTimers();
    renderHook(() =>
      useWebWorker<{ v: number }, string>(
        'init',
        baseOptions<{ v: number }>({ data: { v: 1 }, depsKey: 'a', debounceMs: 300 })
      )
    );
    expect(lastWorker!.postMessage).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(lastWorker!.postMessage).toHaveBeenCalledWith({ type: 'CALC', data: { v: 1 } });
  });
});

describe('useWebWorker — cleanup', () => {
  it('terminiert den Worker beim Unmount', () => {
    const { unmount } = renderHook(() =>
      useWebWorker<{ v: number }, string>(
        'init',
        baseOptions<{ v: number }>({ data: { v: 1 }, depsKey: 'a' })
      )
    );
    const worker = lastWorker!;
    unmount();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
});
