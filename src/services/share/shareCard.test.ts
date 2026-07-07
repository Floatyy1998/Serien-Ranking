import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h2i = vi.hoisted(() => ({ toBlob: vi.fn() }));
const toastMod = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('html-to-image', () => ({ toBlob: h2i.toBlob }));
vi.mock('../../lib/toast', () => ({ showToast: toastMod.showToast }));

import { exportNodeAsImage, shareOrDownload } from './shareCard';

const fakeNode = {} as unknown as HTMLElement;
const makeBlob = () => new Blob(['x'], { type: 'image/png' });

beforeEach(() => {
  h2i.toBlob.mockReset();
  toastMod.showToast.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('exportNodeAsImage', () => {
  it('rendert das Node als Blob (pixelRatio 2, cacheBust)', async () => {
    const blob = makeBlob();
    h2i.toBlob.mockResolvedValueOnce(blob);
    const result = await exportNodeAsImage(fakeNode, 'card.png');
    expect(result).toBe(blob);
    const opts = h2i.toBlob.mock.calls[0][1];
    expect(opts.pixelRatio).toBe(2);
    expect(opts.cacheBust).toBe(true);
  });

  it('ohne document faellt der Hintergrund auf Schwarz zurueck', async () => {
    h2i.toBlob.mockResolvedValueOnce(makeBlob());
    await exportNodeAsImage(fakeNode, 'card.png');
    expect(h2i.toBlob.mock.calls[0][1].backgroundColor).toBe('#000000');
  });

  it('liest die Theme-Hintergrundfarbe aus der CSS-Variable, wenn document vorhanden', async () => {
    vi.stubGlobal('document', { documentElement: {} });
    vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '  #123456  ' }));
    h2i.toBlob.mockResolvedValueOnce(makeBlob());
    await exportNodeAsImage(fakeNode, 'card.png');
    expect(h2i.toBlob.mock.calls[0][1].backgroundColor).toBe('#123456');
  });

  it('leere CSS-Variable → Schwarz-Fallback', async () => {
    vi.stubGlobal('document', { documentElement: {} });
    vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '' }));
    h2i.toBlob.mockResolvedValueOnce(makeBlob());
    await exportNodeAsImage(fakeNode, 'card.png');
    expect(h2i.toBlob.mock.calls[0][1].backgroundColor).toBe('#000000');
  });

  it('bei Font-Einbettungsfehler: zweiter Versuch mit skipFonts', async () => {
    const blob = makeBlob();
    h2i.toBlob.mockRejectedValueOnce(new Error('cors font')).mockResolvedValueOnce(blob);
    const result = await exportNodeAsImage(fakeNode, 'card.png');
    expect(result).toBe(blob);
    expect(h2i.toBlob).toHaveBeenCalledTimes(2);
    expect(h2i.toBlob.mock.calls[1][1].skipFonts).toBe(true);
  });

  it('null-Blob → Fehler mit Dateiname', async () => {
    h2i.toBlob.mockResolvedValueOnce(null);
    await expect(exportNodeAsImage(fakeNode, 'story.png')).rejects.toThrow(
      'Bild-Export fehlgeschlagen (story.png)'
    );
  });

  it('null-Blob auch nach skipFonts-Retry → Fehler', async () => {
    h2i.toBlob.mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce(null);
    await expect(exportNodeAsImage(fakeNode, 'story.png')).rejects.toThrow(
      'Bild-Export fehlgeschlagen (story.png)'
    );
  });
});

describe('shareOrDownload', () => {
  function stubDownloadEnv() {
    const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    const doc = {
      createElement: vi.fn(() => link),
      body: { appendChild: vi.fn() },
    };
    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('document', doc);
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    return { link, doc, createObjectURL, revokeObjectURL };
  }

  it('teilt per nativem Share-Dialog, wenn Dateien unterstuetzt werden', async () => {
    const share = vi.fn(async (_data: ShareData) => undefined);
    const canShare = vi.fn(() => true);
    vi.stubGlobal('navigator', { canShare, share });
    const env = stubDownloadEnv();

    await shareOrDownload(makeBlob(), 'card.png', 'Schau dir das an');

    expect(canShare).toHaveBeenCalled();
    expect(share).toHaveBeenCalledTimes(1);
    const arg = share.mock.calls[0][0];
    expect(arg.text).toBe('Schau dir das an');
    expect(arg.title).toBe('TV-Rank');
    // Kein Download-Fallback
    expect(env.link.click).not.toHaveBeenCalled();
    expect(toastMod.showToast).not.toHaveBeenCalled();
  });

  it('User-Abbruch (AbortError) beendet still ohne Download', async () => {
    const abort = Object.assign(new Error('abort'), { name: 'AbortError' });
    const share = vi.fn(async () => {
      throw abort;
    });
    vi.stubGlobal('navigator', { canShare: () => true, share });
    const env = stubDownloadEnv();

    await shareOrDownload(makeBlob(), 'card.png', 'txt');

    expect(env.link.click).not.toHaveBeenCalled();
    expect(toastMod.showToast).not.toHaveBeenCalled();
  });

  it('anderer Share-Fehler faellt auf Download zurueck', async () => {
    vi.useFakeTimers();
    const share = vi.fn(async () => {
      throw new Error('share broke');
    });
    vi.stubGlobal('navigator', { canShare: () => true, share });
    const env = stubDownloadEnv();

    await shareOrDownload(makeBlob(), 'card.png', 'txt');

    expect(env.createObjectURL).toHaveBeenCalled();
    expect(env.link.download).toBe('card.png');
    expect(env.link.click).toHaveBeenCalledTimes(1);
    expect(env.link.remove).toHaveBeenCalledTimes(1);
    expect(toastMod.showToast).toHaveBeenCalledWith('Bild gespeichert', 2000, 'success');
    // revokeObjectURL erst nach dem Timeout
    expect(env.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(env.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    vi.useRealTimers();
  });

  it('ohne canShare-Support: direkter Download', async () => {
    vi.stubGlobal('navigator', {});
    const env = stubDownloadEnv();

    await shareOrDownload(makeBlob(), 'export.png', 'txt');

    expect(env.doc.createElement).toHaveBeenCalledWith('a');
    expect(env.link.href).toBe('blob:fake');
    expect(env.link.click).toHaveBeenCalledTimes(1);
    expect(toastMod.showToast).toHaveBeenCalledWith('Bild gespeichert', 2000, 'success');
  });

  it('canShare liefert false (Datei nicht teilbar) → Download', async () => {
    const share = vi.fn();
    vi.stubGlobal('navigator', { canShare: () => false, share });
    const env = stubDownloadEnv();

    await shareOrDownload(makeBlob(), 'export.png', 'txt');

    expect(share).not.toHaveBeenCalled();
    expect(env.link.click).toHaveBeenCalledTimes(1);
  });
});
