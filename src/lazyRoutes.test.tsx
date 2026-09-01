// @vitest-environment jsdom
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { Suspense, type ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyWithRetry } from './lazyRoutes';

const Page = () => <div>page inhalt</div>;

const renderLazy = (Lazy: ComponentType) =>
  render(
    <Suspense fallback={<div>laedt</div>}>
      <Lazy />
    </Suspense>
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('lazyWithRetry', () => {
  it('rendert die Seite, wenn der Chunk laedt', async () => {
    const Lazy = lazyWithRetry(async () => ({ default: Page }));
    renderLazy(Lazy);
    expect(await screen.findByText('page inhalt')).toBeTruthy();
  });

  it('versucht es nach einem fehlgeschlagenen Chunk erneut', async () => {
    const factory = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk 404'))
      .mockResolvedValue({ default: Page });
    const Lazy = lazyWithRetry(factory);
    renderLazy(Lazy);
    expect(await screen.findByText('page inhalt', {}, { timeout: 5000 })).toBeTruthy();
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('behandelt einen Chunk ohne Komponente wie einen Ladefehler', async () => {
    // Der Fall aus der Praxis: das Modul laedt, der benannte Export fehlt.
    // Ohne Absicherung wirft React dafuer Fehler #306 und reisst die App mit.
    const factory = vi
      .fn()
      .mockResolvedValueOnce({ default: undefined })
      .mockResolvedValue({ default: Page });
    const Lazy = lazyWithRetry(factory as unknown as () => Promise<{ default: ComponentType }>);
    renderLazy(Lazy);
    expect(await screen.findByText('page inhalt', {}, { timeout: 5000 })).toBeTruthy();
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('zeigt die Fehlerseite, wenn auch der zweite Versuch nichts liefert', async () => {
    const factory = vi.fn().mockResolvedValue({ default: undefined });
    const Lazy = lazyWithRetry(factory as unknown as () => Promise<{ default: ComponentType }>);
    renderLazy(Lazy);
    await waitFor(
      () => expect(screen.getByRole('button', { name: /aktualisieren/i })).toBeTruthy(),
      { timeout: 5000 }
    );
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
