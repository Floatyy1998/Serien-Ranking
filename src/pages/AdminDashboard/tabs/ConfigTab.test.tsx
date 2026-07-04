// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigTab } from './ConfigTab';

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

describe('ConfigTab', () => {
  it('renders the pet-drop config with default values after loading', async () => {
    render(<ConfigTab theme={theme} />);
    expect(await screen.findByText('Pet Accessory Drops')).toBeInTheDocument();
    expect(screen.getByText('Rarity Weights')).toBeInTheDocument();
    expect(screen.getByText('Gewöhnlich')).toBeInTheDocument();
    // Default drop chance 0.045 -> 4.5%
    expect(screen.getByText('= 4.5%')).toBeInTheDocument();
  });

  it('applies stored config values from firebase', async () => {
    fb.store['admin/config/petDrops'] = { dropChance: 0.1, rarityWeights: { common: 50 } };
    render(<ConfigTab theme={theme} />);
    expect(await screen.findByText('= 10.0%')).toBeInTheDocument();
  });

  it('shows the saved confirmation after clicking Speichern', async () => {
    render(<ConfigTab theme={theme} />);
    await screen.findByText('Pet Accessory Drops');
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(await screen.findByText('Gespeichert!')).toBeInTheDocument();
  });
});
