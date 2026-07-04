// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
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

const theme = {
  primary: '#00d123',
  text: { secondary: '#ccc', muted: '#888' },
  background: { surface: '#111', default: '#000' },
  status: { success: '#0f0', error: '#f00' },
};

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
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
});
