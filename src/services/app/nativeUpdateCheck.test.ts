// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = { value: true };
vi.mock('./nativeShell', () => ({ isNativeApp: () => native.value }));

const showUpdatePill = vi.fn();
vi.mock('./updatePill', () => ({ showUpdatePill: (cb: () => void) => showUpdatePill(cb) }));

import { PAGE_REPLACING_EVENT } from '../../lib/errorReport/pageReplacing';
import {
  entryScriptOf,
  installNativeUpdateCheck,
  resetNativeUpdateCheck,
} from './nativeUpdateCheck';

const MIN = 60 * 1000;
let visibility: DocumentVisibilityState = 'visible';
let deployedHtml = '';
let reloads = 0;
const fetchMock = vi.fn();
const onReplace = () => {
  reloads += 1;
};

const html = (entry: string) =>
  `<!doctype html><head><script type="module" crossorigin src="/assets/${entry}"></script>` +
  `<script id="vite-plugin-pwa:register-sw" src="/registerSW.js"></script></head>`;

const setVisibility = (next: DocumentVisibilityState) => {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => {
  vi.useFakeTimers();
  native.value = true;
  visibility = 'visible';
  reloads = 0;
  deployedHtml = html('index-ALT.js');
  showUpdatePill.mockReset();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => ({ ok: true, text: async () => deployedHtml }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  window.addEventListener(PAGE_REPLACING_EVENT, onReplace);
  const script = document.createElement('script');
  script.type = 'module';
  script.setAttribute('src', '/assets/index-ALT.js');
  document.head.appendChild(script);
});

afterEach(() => {
  resetNativeUpdateCheck();
  window.removeEventListener(PAGE_REPLACING_EVENT, onReplace);
  document.head.innerHTML = '';
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('entryScriptOf', () => {
  it('liest das Einstiegsskript aus der index.html', () => {
    expect(entryScriptOf(html('index-CWTIrIr0.js'))).toBe('/assets/index-CWTIrIr0.js');
  });

  it('liefert null ohne Einstiegsskript', () => {
    expect(entryScriptOf('<html><body>Wartung</body></html>')).toBeNull();
  });
});

describe('nativeUpdateCheck', () => {
  it('laedt nach langem Hintergrund sofort neu, wenn ein Deploy live ist', async () => {
    // Der gemeldete Fall: Start im Hintergrund, 18 Minuten spaeter sichtbar, Deploy dazwischen
    visibility = 'hidden';
    installNativeUpdateCheck();
    deployedHtml = html('index-NEU.js');
    vi.advanceTimersByTime(18 * MIN);

    setVisibility('visible');
    await vi.advanceTimersByTimeAsync(0);

    expect(reloads).toBe(1);
    expect(showUpdatePill).not.toHaveBeenCalled();
  });

  it('bleibt ohne neuen Deploy still', async () => {
    visibility = 'hidden';
    installNativeUpdateCheck();
    vi.advanceTimersByTime(18 * MIN);

    setVisibility('visible');
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reloads).toBe(0);
    expect(showUpdatePill).not.toHaveBeenCalled();
  });

  it('bietet die Pille an, wenn schon getippt wurde, und laedt beim Wegblenden neu', async () => {
    visibility = 'hidden';
    installNativeUpdateCheck();
    deployedHtml = html('index-NEU.js');
    vi.advanceTimersByTime(18 * MIN);
    fetchMock.mockImplementationOnce(async () => {
      document.dispatchEvent(new Event('pointerdown'));
      return { ok: true, text: async () => deployedHtml };
    });

    setVisibility('visible');
    await vi.advanceTimersByTimeAsync(0);
    expect(reloads).toBe(0);
    expect(showUpdatePill).toHaveBeenCalledTimes(1);

    setVisibility('hidden');
    expect(reloads).toBe(1);
  });

  it('prueft im Vordergrund regelmaessig und zeigt dann nur die Pille', async () => {
    installNativeUpdateCheck();
    deployedHtml = html('index-NEU.js');

    await vi.advanceTimersByTimeAsync(10 * MIN);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(showUpdatePill).toHaveBeenCalledTimes(1);
    expect(reloads).toBe(0);
  });

  it('versucht es nach einer gescheiterten Anfrage einmal erneut', async () => {
    visibility = 'hidden';
    installNativeUpdateCheck();
    deployedHtml = html('index-NEU.js');
    vi.advanceTimersByTime(18 * MIN);
    fetchMock.mockRejectedValueOnce(new TypeError('The network connection was lost.'));

    setVisibility('visible');
    await vi.advanceTimersByTimeAsync(3000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(reloads).toBe(1);
  });

  it('prueft bei kurzem Wegblenden hoechstens einmal pro Minute', async () => {
    installNativeUpdateCheck();
    for (let i = 0; i < 3; i += 1) {
      setVisibility('hidden');
      vi.advanceTimersByTime(10 * 1000);
      setVisibility('visible');
      await vi.advanceTimersByTimeAsync(0);
    }
    expect(fetchMock).not.toHaveBeenCalled();

    setVisibility('hidden');
    vi.advanceTimersByTime(MIN);
    setVisibility('visible');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('tut im Browser nichts', async () => {
    native.value = false;
    visibility = 'hidden';
    installNativeUpdateCheck();
    deployedHtml = html('index-NEU.js');
    vi.advanceTimersByTime(18 * MIN);

    setVisibility('visible');
    await vi.advanceTimersByTimeAsync(10 * MIN);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(reloads).toBe(0);
  });
});
