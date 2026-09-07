// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Trophy3D } from './Trophy3D';

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

afterEach(cleanup);

describe('Trophy3D', () => {
  it('renders a first-place trophy (smoke)', () => {
    const { container } = render(<Trophy3D place={1} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders name and month label when large enough', () => {
    render(<Trophy3D place={2} size={200} name="Konrad" monthLabel="Juli 2026" />);
    expect(screen.getByText('Konrad')).toBeInTheDocument();
    expect(screen.getByText('Juli 2026')).toBeInTheDocument();
  });

  it('hides text on small trophies', () => {
    render(<Trophy3D place={3} size={80} name="Hidden" monthLabel="Juli 2026" />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
