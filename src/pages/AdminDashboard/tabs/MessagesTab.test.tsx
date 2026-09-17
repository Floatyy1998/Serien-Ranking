// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesTab } from './MessagesTab';

const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const snap = (path: string) => ({
    val: () => (path in store ? store[path] : null),
    exists: () => path in store && store[path] != null,
  });
  return {
    store,
    database: () => ({
      ref: (path: string) => ({
        once: () => Promise.resolve(snap(path)),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
      }),
    }),
  };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const backendFetch = vi.hoisted(() =>
  vi.fn((_path: string, _init: { body: string }) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ sent: 1, results: [] }) })
  )
);

/** Body des ersten Aufrufs — die Sprach-Maps sind genau das, was hier zählt. */
const sentBody = (): Record<string, unknown> => {
  const call = backendFetch.mock.calls[0];
  if (!call) throw new Error('backendFetch wurde nicht aufgerufen');
  return JSON.parse(call[1].body) as Record<string, unknown>;
};
vi.mock('../../../services/api/backendApi', () => ({ backendFetch }));

const theme = {
  primary: '#00d123',
  text: { secondary: '#ccc', muted: '#888' },
  background: { surface: '#111', default: '#000' },
  status: { success: '#0f0', error: '#f00' },
};

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
  backendFetch.mockClear();
});

afterEach(cleanup);

describe('MessagesTab', () => {
  it('renders the composer and empty active-messages state (smoke)', () => {
    render(<MessagesTab theme={theme} />);
    expect(screen.getByText('Neue Nachricht senden')).toBeInTheDocument();
    expect(screen.getByText('Aktive Nachrichten (0)')).toBeInTheDocument();
    expect(screen.getByText('Keine aktiven Nachrichten')).toBeInTheDocument();
    // Send disabled without a recipient/text
    expect(screen.getByRole('button', { name: /Senden/ })).toBeDisabled();
  });

  it('lists active messages loaded from firebase', async () => {
    fb.store['admin/userMessages'] = {
      u1: { text: 'Hallo Welt', displayName: 'Max', createdAt: new Date().toISOString() },
    };
    render(<MessagesTab theme={theme} />);
    expect(await screen.findByText('Hallo Welt')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Aktive Nachrichten (1)')).toBeInTheDocument();
  });

  it('sends per-language texts as maps and drops empty ones', async () => {
    fb.store['users'] = { u1: { displayName: 'Max', username: 'max', language: 'es' } };
    render(<MessagesTab theme={theme} />);

    // Empfaenger waehlen
    fireEvent.click(await screen.findByRole('button', { name: /Alle auswählen/ }));

    fireEvent.change(screen.getByPlaceholderText('Titel (Deutsch)...'), {
      target: { value: 'Neu: Favoriten' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nachricht (Deutsch)...'), {
      target: { value: 'Markiere Freunde als Favorit.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Übersetzungen/ }));
    fireEvent.change(screen.getByPlaceholderText('Titel (Español)...'), {
      target: { value: 'Nuevo: favoritos' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nachricht (Español)...'), {
      target: { value: 'Marca amigos como favoritos.' },
    });
    // Franzoesisch bleibt leer und darf nicht mitgeschickt werden.

    fireEvent.click(screen.getByRole('button', { name: /Notification senden/ }));

    await waitFor(() => expect(backendFetch).toHaveBeenCalled());
    const body = sentBody() as { title: string; titleL: Record<string, string>; messageL: unknown };
    expect(body.title).toBe('Neu: Favoriten');
    expect(body.titleL).toEqual({ es: 'Nuevo: favoritos' });
    expect(body.messageL).toEqual({ es: 'Marca amigos como favoritos.' });
    expect(body.titleL.fr).toBeUndefined();
  });

  it('omits the language maps entirely when nothing is translated', async () => {
    fb.store['users'] = { u1: { displayName: 'Max', username: 'max', language: 'de' } };
    render(<MessagesTab theme={theme} />);
    fireEvent.click(await screen.findByRole('button', { name: /Alle auswählen/ }));
    fireEvent.change(screen.getByPlaceholderText('Titel (Deutsch)...'), {
      target: { value: 'Nur Deutsch' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nachricht (Deutsch)...'), {
      target: { value: 'Text' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Notification senden/ }));

    await waitFor(() => expect(backendFetch).toHaveBeenCalled());
    const body = sentBody();
    expect(body).not.toHaveProperty('titleL');
    expect(body).not.toHaveProperty('messageL');
  });
});
