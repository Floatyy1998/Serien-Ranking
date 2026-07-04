// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

vi.mock('@mui/icons-material', () => ({ Gavel: () => <span /> }));
vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#333', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#333';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../components/ui', () => ({
  LoadingSpinner: () => <div data-testid="spinner" />,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

import { ImpressumPage } from './ImpressumPage';

const impressum = {
  title: 'Impressum',
  sections: {
    contact: {
      title: 'Kontaktdaten',
      name: 'Max Mustermann',
      address: 'Straße 1',
      city: '12345 Stadt',
      country: 'Deutschland',
      email: 'max@example.com',
    },
    liability: {
      title: 'Haftung',
      content: { title: 'Haftungsausschluss', text: 'Kein Anspruch.' },
    },
    links: { title: 'Links', text: 'Externe Links.' },
    copyright: { title: 'Urheberrecht', text: 'Alle Rechte.' },
  },
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ImpressumPage', () => {
  it('shows a spinner while loading', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<ImpressumPage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows an error state when the fetch fails', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
    render(<ImpressumPage />);
    await waitFor(() =>
      expect(
        screen.getByText('Rechtliche Informationen konnten nicht geladen werden.')
      ).toBeInTheDocument()
    );
  });

  it('renders the impressum content on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve(impressum),
    });
    render(<ImpressumPage />);
    await waitFor(() => expect(screen.getByText('Impressum')).toBeInTheDocument());
    expect(screen.getByText('Kontaktdaten')).toBeInTheDocument();
    expect(screen.getByText('Haftungsausschluss')).toBeInTheDocument();
  });
});
