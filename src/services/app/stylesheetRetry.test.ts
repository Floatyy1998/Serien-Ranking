// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installStylesheetRetry,
  resetStylesheetRetry,
  stylesheetRetriesSettled,
  willRetryStylesheet,
} from './stylesheetRetry';

let visibility: DocumentVisibilityState = 'visible';

const addLink = (rel: string, href: string) => {
  const link = document.createElement('link');
  link.setAttribute('rel', rel);
  link.setAttribute('href', href);
  link.setAttribute('crossorigin', '');
  document.head.appendChild(link);
  return link;
};

const linksFor = (href: string) =>
  Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[href="${href}"]`));

beforeEach(() => {
  vi.useFakeTimers();
  visibility = 'visible';
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  installStylesheetRetry();
});

afterEach(() => {
  resetStylesheetRetry();
  document.head.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('stylesheetRetry', () => {
  it('fordert ein gescheitertes Stylesheet an derselben Stelle neu an', async () => {
    const before = addLink('stylesheet', '/assets/before.css');
    const failed = addLink('stylesheet', '/assets/Discover-abc.css');
    const after = addLink('stylesheet', '/assets/after.css');

    failed.dispatchEvent(new Event('error'));
    await vi.advanceTimersByTimeAsync(1000);

    const [fresh] = linksFor('/assets/Discover-abc.css');
    expect(fresh).not.toBe(failed);
    expect(failed.isConnected).toBe(false);
    expect(fresh.getAttribute('data-css-retry')).toBe('1');
    expect(fresh.hasAttribute('crossorigin')).toBe(true);
    expect(before.nextElementSibling).toBe(fresh);
    expect(fresh.nextElementSibling).toBe(after);
  });

  it('gibt nach drei Neuversuchen auf', async () => {
    let link = addLink('stylesheet', '/assets/weg.css');
    for (const delay of [1000, 4000, 10000]) {
      expect(willRetryStylesheet(link)).toBe(true);
      link.dispatchEvent(new Event('error'));
      await vi.advanceTimersByTimeAsync(delay);
      link = linksFor('/assets/weg.css')[0];
    }
    expect(link.getAttribute('data-css-retry')).toBe('3');
    expect(willRetryStylesheet(link)).toBe(false);
  });

  it('wartet im Hintergrund, bis die App wieder sichtbar ist', async () => {
    const failed = addLink('stylesheet', '/assets/later.css');
    visibility = 'hidden';
    failed.dispatchEvent(new Event('error'));
    await vi.advanceTimersByTimeAsync(5000);
    expect(failed.isConnected).toBe(true);

    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(failed.isConnected).toBe(false);
    expect(linksFor('/assets/later.css')).toHaveLength(1);
  });

  it('laesst Modulepreloads in Ruhe', async () => {
    const preload = addLink('modulepreload', '/assets/chunk.js');
    preload.dispatchEvent(new Event('error'));
    await vi.advanceTimersByTimeAsync(20000);
    expect(preload.isConnected).toBe(true);
    expect(preload.hasAttribute('data-css-retry')).toBe(false);
  });

  it('stylesheetRetriesSettled wartet, bis der Neuversuch geladen ist', async () => {
    const failed = addLink('stylesheet', '/assets/wait.css');
    failed.dispatchEvent(new Event('error'));

    let settled = false;
    void stylesheetRetriesSettled().then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(settled).toBe(false);

    linksFor('/assets/wait.css')[0].dispatchEvent(new Event('load'));
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(true);
  });

  it('meldet ohne Installation keinen ausstehenden Neuversuch', () => {
    resetStylesheetRetry();
    expect(willRetryStylesheet(addLink('stylesheet', '/assets/x.css'))).toBe(false);
  });
});
