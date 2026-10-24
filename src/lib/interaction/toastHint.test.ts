// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { showHintBanner } from './toast';

const show = (onAction = vi.fn()) => {
  showHintBanner({ title: 'Titel', text: 'Text', actionLabel: 'Los', onAction });
  return onAction;
};

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('showHintBanner', () => {
  it('zeigt genau ein Banner, ein neues ersetzt das alte', () => {
    show();
    show();
    expect(document.querySelectorAll('.app-hint')).toHaveLength(1);
    expect(document.querySelector('.hint-title')?.textContent).toBe('Titel');
  });

  it('Aktion löst onAction aus und schließt das Banner', () => {
    vi.useFakeTimers();
    const onAction = show();
    (document.querySelector('.hint-action') as HTMLButtonElement).click();
    expect(onAction).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.app-hint')).toBeNull();
  });

  it('Schließen und Zeitablauf lösen keine Aktion aus', () => {
    vi.useFakeTimers();
    const onAction = show();
    (document.querySelector('.hint-close') as HTMLButtonElement).click();
    vi.advanceTimersByTime(400);
    expect(document.querySelector('.app-hint')).toBeNull();
    show(onAction);
    vi.advanceTimersByTime(13_000);
    expect(document.querySelector('.app-hint')).toBeNull();
    expect(onAction).not.toHaveBeenCalled();
  });
});
