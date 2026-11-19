// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probeNetwork } from './netProbe';

let clock = 0;

/** Antwort, deren Lesen je Stück eine feste Zeit „dauert". */
function streamResponse(chunks: number[], msPerChunk: number): Response {
  let i = 0;
  const reader = {
    read: async () => {
      if (i >= chunks.length) return { done: true, value: undefined };
      clock += msPerChunk;
      return { done: false, value: new Uint8Array(chunks[i++]) };
    },
  };
  return { ok: true, body: { getReader: () => reader } } as unknown as Response;
}

beforeEach(() => {
  clock = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('probeNetwork', () => {
  it('misst Latenz bis zur Antwort und die Rate über das Lesen der Datei', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        clock += 80;
        return streamResponse([125_000, 125_000], 500);
      })
    );
    // 250 kB in 1 s = 2000 kbit/s
    expect(await probeNetwork()).toEqual({ lat: 80, dn: 2000 });
  });

  it('fragt ohne Browser-Cache und ohne Anmeldedaten', async () => {
    const fetchMock = vi.fn(async () => streamResponse([20_000], 100));
    vi.stubGlobal('fetch', fetchMock);
    await probeNetwork();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/catalog\/net-probe\.bin$/);
    expect(init).toMatchObject({ cache: 'no-store', credentials: 'omit' });
  });

  it('wertet bei Abbruch, was bis dahin ankam', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        clock += 300;
        let sent = false;
        const reader = {
          read: async () => {
            if (sent) throw new DOMException('aborted', 'AbortError');
            sent = true;
            clock += 2000;
            return { done: false, value: new Uint8Array(50_000) };
          },
        };
        return { ok: true, body: { getReader: () => reader } } as unknown as Response;
      })
    );
    // 50 kB in 2 s = 200 kbit/s
    expect(await probeNetwork()).toEqual({ lat: 300, dn: 200 });
  });

  it('liefert nichts, wenn der Abruf scheitert', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );
    expect(await probeNetwork()).toEqual({});
  });

  it('nennt keine Rate, wenn zu wenig ankam', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        clock += 40;
        return streamResponse([2_000], 10);
      })
    );
    expect(await probeNetwork()).toEqual({ lat: 40 });
  });
});
