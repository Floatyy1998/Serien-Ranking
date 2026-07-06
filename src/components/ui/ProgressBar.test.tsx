// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProgressBar } from './ProgressBar';

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

describe('ProgressBar', () => {
  it('renders a track and a fill (smoke)', () => {
    const { container } = render(<ProgressBar value={50} />);
    // outer track + inner motion fill + shimmer
    expect(container.querySelectorAll('div').length).toBeGreaterThanOrEqual(2);
  });

  it('renders a gradient fill element', () => {
    const { container } = render(<ProgressBar value={150} animated={false} />);
    const fill = container.querySelectorAll('div')[1] as HTMLElement;
    expect(fill).toBeInTheDocument();
    expect(fill.style.background).toContain('linear-gradient');
  });

  it('respects a custom height on the track', () => {
    const { container } = render(<ProgressBar value={20} height={12} />);
    const track = container.firstChild as HTMLElement;
    expect(track).toHaveStyle({ height: '12px' });
  });
});
