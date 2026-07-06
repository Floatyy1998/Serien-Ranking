// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageState } from './PageState';

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

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

describe('PageState', () => {
  it('renders a loading spinner with message (smoke)', () => {
    render(<PageState mode="loading" message="Lädt..." />);
    expect(screen.getByText('Lädt...')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    render(
      <PageState
        mode="empty"
        empty={{ icon: '📭', title: 'Nichts hier', description: 'Keine Einträge' }}
      />
    );
    expect(screen.getByText('Nichts hier')).toBeInTheDocument();
    expect(screen.getByText('Keine Einträge')).toBeInTheDocument();
  });

  it('renders the error state with a retry button', () => {
    const onRetry = vi.fn();
    render(<PageState mode="error" error={{ title: 'Fehler', onRetry }} />);
    expect(screen.getByText('Fehler')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Erneut versuchen/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for empty mode without empty data', () => {
    const { container } = render(<PageState mode="empty" />);
    expect(container).toBeEmptyDOMElement();
  });
});
