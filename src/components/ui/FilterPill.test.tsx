// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilterPill } from './FilterPill';

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

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      background: { surface: '#111' },
      text: { secondary: '#ddd', muted: '#999' },
      border: { default: '#333' },
    },
  }),
}));

afterEach(() => cleanup());

describe('FilterPill', () => {
  it('renders the label', () => {
    render(<FilterPill label="Alle" active={false} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Alle/ })).toBeInTheDocument();
  });

  it('calls onClick when pressed', () => {
    const onClick = vi.fn();
    render(<FilterPill label="Filme" active onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /Filme/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a badge when badge > 0', () => {
    render(<FilterPill label="Serien" active={false} onClick={vi.fn()} badge={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('omits the badge when badge is 0', () => {
    render(<FilterPill label="Serien" active={false} onClick={vi.fn()} badge={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
