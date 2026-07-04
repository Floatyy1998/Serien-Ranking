// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NowPlayingIndicator } from './NowPlayingIndicator';

vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

afterEach(cleanup);

describe('NowPlayingIndicator', () => {
  it('renders a status region with the default label (smoke)', () => {
    render(<NowPlayingIndicator />);
    expect(screen.getByRole('status', { name: 'Aktuell am Schauen' })).toBeInTheDocument();
  });

  it('honours a custom label', () => {
    render(<NowPlayingIndicator label="Jetzt läuft" />);
    expect(screen.getByRole('status', { name: 'Jetzt läuft' })).toBeInTheDocument();
  });

  it('renders three equalizer bars', () => {
    const { container } = render(<NowPlayingIndicator size="md" position="bottom-right" />);
    const status = container.querySelector('[role="status"]') as HTMLElement;
    expect(status.querySelectorAll('span').length).toBe(3);
  });
});
