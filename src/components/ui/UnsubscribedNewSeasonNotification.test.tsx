// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnsubscribedNewSeasonNotification } from './UnsubscribedNewSeasonNotification';
import type { UnsubscribedNewSeasonEntry } from '../../hooks/useUnsubscribedNewSeasons';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const navigate = vi.fn<(to: string) => void>();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

function entries(): UnsubscribedNewSeasonEntry[] {
  return [
    {
      series: { id: 99, title: 'The Boys', poster: { poster: 'https://x/p.jpg' } },
      providers: ['Amazon Prime'],
    } as unknown as UnsubscribedNewSeasonEntry,
  ];
}

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('UnsubscribedNewSeasonNotification', () => {
  it('renders nothing without entries (smoke)', () => {
    const { container } = render(
      <UnsubscribedNewSeasonNotification entries={[]} onDismiss={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the heading, series title and provider message', () => {
    render(<UnsubscribedNewSeasonNotification entries={entries()} onDismiss={() => {}} />);
    expect(screen.getByText('Anbieter fehlt')).toBeInTheDocument();
    expect(screen.getByText('The Boys')).toBeInTheDocument();
    expect(screen.getByText('Neue Staffel auf Amazon Prime')).toBeInTheDocument();
  });

  it('dismisses via the close button', () => {
    const onDismiss = vi.fn();
    render(<UnsubscribedNewSeasonNotification entries={entries()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('navigates to the series detail on "Ansehen"', () => {
    render(<UnsubscribedNewSeasonNotification entries={entries()} onDismiss={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Ansehen/ }));
    expect(navigate).toHaveBeenCalledWith('/series/99');
  });
});
