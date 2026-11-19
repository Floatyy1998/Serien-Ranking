// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { logAppStartMock } = vi.hoisted(() => ({ logAppStartMock: vi.fn() }));

vi.mock('../firebase/analytics', () => ({ logAppStart: logAppStartMock }));
vi.mock('../errorReporting/context', () => ({ detectPlatform: () => 'ios' }));

type Entry = Record<string, unknown>;

function stubTimings(navigation: Entry[], resources: Entry[]): void {
  vi.spyOn(performance, 'getEntriesByType').mockImplementation(((type: string) =>
    type === 'navigation'
      ? navigation
      : resources) as unknown as typeof performance.getEntriesByType);
}

const asset = (file: string, over: Entry): Entry => ({
  name: `${window.location.origin}/assets/${file}`,
  fetchStart: 0,
  requestStart: 0,
  responseEnd: 1000,
  transferSize: 0,
  decodedBodySize: 0,
  ...over,
});

async function load() {
  vi.resetModules();
  return import('./startupMetrics');
}

beforeEach(() => {
  logAppStartMock.mockClear();
  localStorage.clear();
  vi.stubEnv('DEV', false);
  vi.stubGlobal('__APP_BUILD__', 'test-build');
  vi.spyOn(performance, 'now').mockReturnValue(4321.4);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('measureNetwork', () => {
  it('misst Rate, Cache-Anteil und Antwortzeit an den eigenen App-Dateien', async () => {
    stubTimings(
      [{ requestStart: 10, responseStart: 130 }],
      [
        asset('a.js', { responseEnd: 1000, transferSize: 125_000, decodedBodySize: 400_000 }),
        asset('b.js', { transferSize: 0, decodedBodySize: 90_000 }),
        { name: 'https://image.tmdb.org/poster.jpg', transferSize: 900_000, responseEnd: 50 },
      ]
    );
    const { measureNetwork } = await load();
    expect(measureNetwork()).toEqual({ ttfb: 120, kb: 125, hit: 50, kbps: 1000 });
  });

  it('lässt die Rate weg, wenn alles aus dem Cache kam', async () => {
    stubTimings(
      [{ requestStart: 10, responseStart: 60 }],
      [asset('a.js', { transferSize: 0, decodedBodySize: 400_000 })]
    );
    const { measureNetwork } = await load();
    expect(measureNetwork()).toEqual({ ttfb: 50, kb: 0, hit: 100, kbps: undefined });
  });
});

describe('recordStartup', () => {
  it('meldet genau einen Start mit Dauer, Plattform und Verbindung', async () => {
    stubTimings([{ requestStart: 10, responseStart: 130 }], []);
    const { recordStartup } = await load();
    recordStartup();
    recordStartup();
    expect(logAppStartMock).toHaveBeenCalledTimes(1);
    expect(logAppStartMock.mock.calls[0][0]).toMatchObject({
      t: 4321,
      p: 'ios',
      b: 'test-build',
      ttfb: 120,
    });
  });

  it('meldet nichts, wenn die App beim Start im Hintergrund war', async () => {
    stubTimings([], []);
    const { recordStartup } = await load();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    recordStartup();
    expect(logAppStartMock).not.toHaveBeenCalled();
  });

  it('hört nach zehn Starts am Tag auf', async () => {
    stubTimings([], []);
    localStorage.setItem('startupLogDay', `${new Date().toISOString().slice(0, 10)}:10`);
    const { recordStartup } = await load();
    recordStartup();
    expect(logAppStartMock).not.toHaveBeenCalled();
  });
});
