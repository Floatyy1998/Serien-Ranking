// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpoilerReveal } from './SpoilerReveal';

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

describe('SpoilerReveal', () => {
  it('renders the reveal button (smoke)', () => {
    render(<SpoilerReveal onReveal={() => {}} />);
    expect(screen.getByRole('button', { name: /Spoiler anzeigen/ })).toBeInTheDocument();
  });

  it('calls onReveal when pressed', () => {
    const onReveal = vi.fn();
    render(<SpoilerReveal onReveal={onReveal} />);
    fireEvent.click(screen.getByRole('button', { name: /Spoiler anzeigen/ }));
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('renders in compact mode', () => {
    render(<SpoilerReveal onReveal={() => {}} compact />);
    const btn = screen.getByRole('button', { name: /Spoiler anzeigen/ });
    expect(btn).toHaveStyle({ padding: '10px 14px' });
  });
});
