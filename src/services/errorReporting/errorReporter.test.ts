// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb: { sets: { path: string; value: Record<string, unknown> }[] } = { sets: [] };
let pushCounter = 0;

vi.mock('../db/ref', () => ({
  serverTimestamp: () => 1234,
  dbRef: vi.fn((path: string) => ({
    push: () => {
      pushCounter += 1;
      const key = `key${pushCounter}`;
      return {
        key,
        set: (value: Record<string, unknown>) => {
          fb.sets.push({ path: `${path}/${key}`, value });
          return Promise.resolve();
        },
      };
    },
  })),
}));

vi.mock('./breadcrumbs', () => ({
  addBreadcrumb: vi.fn(),
  getBreadcrumbs: () => [{ t: 5, type: 'click', label: 'button#x' }],
  installBreadcrumbs: vi.fn(),
}));

vi.mock('./context', () => ({
  collectEnvironment: (count: number) => ({ route: '/home', sessionErrorCount: count }),
  primeErrorContext: vi.fn(async () => {}),
}));

import {
  captureError,
  installErrorReporting,
  reportRenderError,
  resetErrorReporter,
  setErrorReporterUser,
} from './errorReporter';

// Einmalig — resetErrorReporter setzt zwar das Flag zurueck, die Listener
// blieben bei einem zweiten Aufruf aber doppelt haengen.
installErrorReporting();

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  fb.sets = [];
  pushCounter = 0;
  localStorage.clear();
  resetErrorReporter();
});

describe('captureError', () => {
  it('puffert ohne Nutzer und schreibt nach der Anmeldung', async () => {
    captureError({ kind: 'error', name: 'TypeError', message: 'kaputt' });
    expect(fb.sets).toHaveLength(0);

    setErrorReporterUser('u1');
    await flush();

    expect(fb.sets).toHaveLength(1);
    expect(fb.sets[0].value).toMatchObject({ uid: 'u1', kind: 'error', name: 'TypeError' });
  });

  it('schreibt sofort, wenn der Nutzer bekannt ist', async () => {
    setErrorReporterUser('u1');
    captureError({ kind: 'error', name: 'Error', message: 'x' });
    await flush();
    expect(fb.sets).toHaveLength(1);
    expect(fb.sets[0].path).toContain('clientErrors/');
  });

  it('haengt Umgebung und Breadcrumbs an', async () => {
    setErrorReporterUser('u1');
    captureError({ kind: 'error', name: 'Error', message: 'x' });
    await flush();
    const value = fb.sets[0].value as { env: unknown; breadcrumbs: unknown[] };
    expect(value.env).toMatchObject({ route: '/home' });
    expect(value.breadcrumbs).toHaveLength(1);
  });

  it('drosselt Wiederholungen und zaehlt sie in suppressed', async () => {
    setErrorReporterUser('u1');
    captureError({ kind: 'error', name: 'Error', message: 'gleich' });
    captureError({ kind: 'error', name: 'Error', message: 'gleich' });
    captureError({ kind: 'error', name: 'Error', message: 'gleich' });
    await flush();
    expect(fb.sets).toHaveLength(1);
    expect(fb.sets[0].value.suppressed).toBe(0);

    const stored = JSON.parse(localStorage.getItem('errorReportThrottle') ?? '{}');
    expect(Object.values(stored.suppressed as Record<string, number>)[0]).toBe(2);
  });

  it('kuerzt ueberlange Meldungen', async () => {
    setErrorReporterUser('u1');
    captureError({ kind: 'error', name: 'Error', message: 'x'.repeat(900) });
    await flush();
    expect(String(fb.sets[0].value.message).length).toBeLessThanOrEqual(500);
  });

  it('meldet vollen Geraetespeicher nicht — Zustand des Geraets, kein Defekt', async () => {
    setErrorReporterUser('u1');
    captureError({
      kind: 'error',
      name: 'QuotaExceededError',
      message: 'Encountered full disk while opening backing store for indexedDB.open.',
    });
    captureError({ kind: 'promise', name: 'DOMException', message: 'The storage is full.' });
    await flush();
    expect(fb.sets).toHaveLength(0);
  });

  it('meldet andere DOMExceptions weiterhin', async () => {
    setErrorReporterUser('u1');
    captureError({ kind: 'error', name: 'DOMException', message: 'Zugriff verweigert' });
    await flush();
    expect(fb.sets).toHaveLength(1);
  });

  it('wirft nie, auch bei kaputter Eingabe', () => {
    setErrorReporterUser('u1');
    expect(() =>
      captureError({ kind: 'error', name: undefined as unknown as string, message: '' })
    ).not.toThrow();
  });

  it('puffert hoechstens zehn Berichte', async () => {
    for (let i = 0; i < 15; i++) {
      localStorage.clear();
      captureError({ kind: 'error', name: 'Error', message: `unterschiedlich ${i}` });
    }
    setErrorReporterUser('u1');
    await flush();
    expect(fb.sets.length).toBeLessThanOrEqual(10);
  });
});

describe('reportRenderError', () => {
  it('meldet React-Fehler mit Component-Stack', async () => {
    setErrorReporterUser('u1');
    const error = new Error('Render kaputt');
    reportRenderError(error, '\n    at HomePage');
    await flush();
    expect(fb.sets[0].value).toMatchObject({ kind: 'render', name: 'Error' });
    expect(fb.sets[0].value.componentStack).toContain('HomePage');
  });
});

describe('setErrorReporterUser', () => {
  it('verwirft nichts, wenn der Nutzer abgemeldet wird', async () => {
    setErrorReporterUser(null);
    await flush();
    expect(fb.sets).toHaveLength(0);
  });
});

describe('globale Handler', () => {
  const fireResourceError = (tag: string, attr: string, value: string) => {
    const el = document.createElement(tag);
    el.setAttribute(attr, value);
    document.body.appendChild(el);
    el.dispatchEvent(new Event('error'));
    el.remove();
  };

  it('meldet fehlgeschlagene Skripte als Ressourcenfehler', async () => {
    setErrorReporterUser('u1');
    fireResourceError('script', 'src', '/assets/chunk.js');
    await flush();
    expect(fb.sets[0].value).toMatchObject({ kind: 'resource', source: '/assets/chunk.js' });
  });

  it('ignoriert fehlgeschlagene Bilder — Poster scheitern staendig', async () => {
    setErrorReporterUser('u1');
    fireResourceError('img', 'src', '/poster.jpg');
    await flush();
    expect(fb.sets).toHaveLength(0);
  });

  it('meldet fehlgeschlagene Stylesheets', async () => {
    setErrorReporterUser('u1');
    const el = document.createElement('link');
    el.setAttribute('rel', 'stylesheet');
    el.setAttribute('href', '/assets/app.css');
    document.body.appendChild(el);
    el.dispatchEvent(new Event('error'));
    el.remove();
    await flush();
    expect(fb.sets[0].value).toMatchObject({ kind: 'resource', source: '/assets/app.css' });
  });

  it('ignoriert fehlgeschlagene Modulepreloads — nur ein Hinweis, kein Fehler', async () => {
    setErrorReporterUser('u1');
    const el = document.createElement('link');
    el.setAttribute('rel', 'modulepreload');
    el.setAttribute('href', '/assets/MovieDetail-abc.js');
    document.body.appendChild(el);
    el.dispatchEvent(new Event('error'));
    el.remove();
    await flush();
    expect(fb.sets).toHaveLength(0);
  });

  it('meldet Laufzeitfehler mit Quelle', async () => {
    setErrorReporterUser('u1');
    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'kaputt',
        error: new TypeError('kaputt'),
        filename: 'app.js',
        lineno: 12,
        colno: 4,
      })
    );
    await flush();
    expect(fb.sets[0].value).toMatchObject({
      kind: 'error',
      name: 'TypeError',
      source: 'app.js:12:4',
    });
  });

  it('meldet unbehandelte Promise-Ablehnungen', async () => {
    setErrorReporterUser('u1');
    const event = new Event('unhandledrejection') as Event & { reason?: unknown };
    event.reason = new RangeError('zu gross');
    window.dispatchEvent(event);
    await flush();
    expect(fb.sets[0].value).toMatchObject({ kind: 'promise', name: 'RangeError' });
  });

  it('meldet auch Ablehnungen ohne Error-Objekt', async () => {
    setErrorReporterUser('u1');
    const event = new Event('unhandledrejection') as Event & { reason?: unknown };
    event.reason = 'blanker String';
    window.dispatchEvent(event);
    await flush();
    expect(fb.sets[0].value).toMatchObject({ kind: 'promise', name: 'UnhandledRejection' });
  });
});
