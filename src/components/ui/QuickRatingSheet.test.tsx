// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickRatingSheet } from './QuickRatingSheet';

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

vi.mock('../../lib/haptics', () => ({
  hapticSelect: vi.fn(),
  hapticSuccess: vi.fn(),
}));

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

describe('QuickRatingSheet', () => {
  it('renders nothing visible when closed (smoke)', () => {
    render(
      <QuickRatingSheet isOpen={false} onClose={() => {}} seriesTitle="Dexter" onRate={() => {}} />
    );
    expect(screen.queryByText(/Dexter bewerten/)).not.toBeInTheDocument();
  });

  it('shows the series title when open', () => {
    render(<QuickRatingSheet isOpen onClose={() => {}} seriesTitle="Dexter" onRate={() => {}} />);
    expect(screen.getByText(/Dexter bewerten/)).toBeInTheDocument();
  });

  it('saves the selected rating', () => {
    const onRate = vi.fn<(rating: number) => void>();
    render(<QuickRatingSheet isOpen onClose={() => {}} seriesTitle="Dexter" onRate={onRate} />);
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(onRate).toHaveBeenCalledWith(8);
  });

  it('closes without rating via the "Später" button', () => {
    const onClose = vi.fn();
    render(<QuickRatingSheet isOpen onClose={onClose} seriesTitle="Dexter" onRate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Später' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
