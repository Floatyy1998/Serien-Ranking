// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import type { BugContext } from '../../../types/ErrorReport';

vi.mock(
  '@mui/icons-material',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (_t, p) =>
          p === '__esModule'
            ? true
            : typeof p === 'symbol' || p === 'then'
              ? undefined
              : () => null,
        has: () => true,
      }
    )
);

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover']);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});

const makeTheme = (): ThemeContextType['currentTheme'] => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return make() as ThemeContextType['currentTheme'];
};
const theme = makeTheme();

import { NewTicketForm } from './NewTicketForm';

afterEach(() => cleanup());

describe('NewTicketForm', () => {
  it('renders the form fields with the bug placeholders', () => {
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={vi.fn(async () => true)}
        onCancel={vi.fn()}
        onUpload={vi.fn(async () => null)}
      />
    );
    expect(screen.getByText('Neues Ticket')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Kurze Beschreibung des Problems')).toBeInTheDocument();
  });

  it('calls onCancel when the abort button is pressed', () => {
    const onCancel = vi.fn();
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={vi.fn(async () => true)}
        onCancel={onCancel}
        onUpload={vi.fn(async () => null)}
      />
    );
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('submits with the entered title and description', () => {
    const onSubmit = vi.fn<
      (d: { ticketType: string; title: string; description: string }) => Promise<boolean>
    >(async () => true);
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onUpload={vi.fn(async () => null)}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Kurze Beschreibung des Problems'), {
      target: { value: 'Crash on login' },
    });
    fireEvent.change(screen.getByPlaceholderText('Was genau ist passiert? Was hast du erwartet?'), {
      target: { value: 'It crashes' },
    });
    fireEvent.click(screen.getByText('Absenden'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      title: 'Crash on login',
      description: 'It crashes',
      ticketType: 'bug',
    });
  });

  it('switches placeholders when the feature type is selected', () => {
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={vi.fn(async () => true)}
        onCancel={vi.fn()}
        onUpload={vi.fn(async () => null)}
      />
    );
    fireEvent.click(screen.getByText(/Feature/));
    expect(screen.getByPlaceholderText('Kurze Beschreibung des Features')).toBeInTheDocument();
  });

  it('sends the page context unless the checkbox is cleared', async () => {
    const context = {
      page: '/series/1396',
      capturedAt: '2026-11-07T10:00:00.000Z',
      env: { route: '/series/1396', sessionAgeMs: 1000 },
      breadcrumbs: [],
      network: [{ t: 1, method: 'GET', url: '/x', status: 500, ms: 5, via: 'fetch' }],
      console: [],
    } as unknown as BugContext;
    const onSubmit = vi.fn(async (_data: { context?: BugContext }) => false);
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onUpload={vi.fn(async () => null)}
        context={context}
      />
    );
    expect(screen.getByText(/\/series\/1396/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Kurze Beschreibung des Problems'), {
      target: { value: 'Titel' },
    });
    fireEvent.change(screen.getByPlaceholderText('Was genau ist passiert? Was hast du erwartet?'), {
      target: { value: 'Text' },
    });
    fireEvent.click(screen.getByText('Absenden'));
    expect(onSubmit.mock.calls[0]?.[0].context).toBe(context);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(await screen.findByText('Absenden'));
    expect(onSubmit.mock.calls[1]?.[0].context).toBeUndefined();
  });

  it('lädt das Bild der Seite beim Absenden als ersten Screenshot hoch', async () => {
    const shot = new Blob(['jpeg'], { type: 'image/jpeg' });
    const onUpload = vi.fn(async (_file: File) => 'https://storage/seite.jpg');
    const onSubmit = vi.fn(async (_data: { screenshots: string[] }) => false);
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onUpload={onUpload}
        pageShot={shot}
      />
    );
    expect(await screen.findByAltText('Bild dieser Seite')).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText('Kurze Beschreibung des Problems'), {
      target: { value: 'Titel' },
    });
    fireEvent.change(screen.getByPlaceholderText('Was genau ist passiert? Was hast du erwartet?'), {
      target: { value: 'Text' },
    });
    fireEvent.click(screen.getByText('Absenden'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onUpload.mock.calls[0]?.[0].type).toBe('image/jpeg');
    expect(onSubmit.mock.calls[0]?.[0].screenshots).toEqual(['https://storage/seite.jpg']);

    fireEvent.click(await screen.findByText('Absenden'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onUpload).toHaveBeenCalledTimes(1);
  });

  it('schickt das Bild der Seite nicht mit, wenn es entfernt wurde', async () => {
    const onUpload = vi.fn(async () => 'https://storage/seite.jpg');
    const onSubmit = vi.fn(async (_data: { screenshots: string[] }) => true);
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onUpload={onUpload}
        pageShot={new Blob(['jpeg'], { type: 'image/jpeg' })}
      />
    );
    await screen.findByAltText('Bild dieser Seite');
    fireEvent.click(screen.getByRole('button', { name: 'Bild entfernen' }));
    fireEvent.change(screen.getByPlaceholderText('Kurze Beschreibung des Problems'), {
      target: { value: 'Titel' },
    });
    fireEvent.change(screen.getByPlaceholderText('Was genau ist passiert? Was hast du erwartet?'), {
      target: { value: 'Text' },
    });
    fireEvent.click(screen.getByText('Absenden'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onUpload).not.toHaveBeenCalled();
    expect(onSubmit.mock.calls[0]?.[0].screenshots).toEqual([]);
  });
});
