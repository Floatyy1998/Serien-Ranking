// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', muted: '#999' },
    },
  }),
}));

afterEach(() => cleanup());

describe('EmptyState', () => {
  it('renders the title and icon', () => {
    render(<EmptyState icon={<span data-testid="icon">📺</span>} title="Nichts hier" />);
    expect(screen.getByRole('heading', { name: 'Nichts hier' })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState icon={<span>x</span>} title="Leer" description="Füge etwas hinzu" />);
    expect(screen.getByText('Füge etwas hinzu')).toBeInTheDocument();
  });

  it('renders no action button when action is omitted', () => {
    render(<EmptyState icon={<span>x</span>} title="Leer" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls the action handler when the action button is clicked', () => {
    const onClick = vi.fn();
    render(
      <EmptyState icon={<span>x</span>} title="Leer" action={{ label: 'Hinzufügen', onClick }} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
