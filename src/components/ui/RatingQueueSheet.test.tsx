// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UnratedQueueItem } from '../../hooks/useUnratedQueue';
import { RatingQueueSheet } from './RatingQueueSheet';

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

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

const items: UnratedQueueItem[] = [
  { key: 'series-1', id: 1, type: 'series', title: 'Dexter', posterPath: '', genres: ['Drama'] },
  { key: 'movie-2', id: 2, type: 'movie', title: 'Heat', posterPath: '', genres: [] },
];

describe('RatingQueueSheet', () => {
  it('shows the front item and progress', () => {
    render(
      <RatingQueueSheet
        isOpen
        items={items}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    expect(screen.getByText('Dexter')).toBeInTheDocument();
    expect(screen.getByText(/1 von 2/)).toBeInTheDocument();
  });

  it('rates the front item with the selected value', () => {
    const onRate = vi.fn();
    render(
      <RatingQueueSheet isOpen items={items} onClose={() => {}} onRate={onRate} onSkip={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(onRate).toHaveBeenCalledWith(items[0], 9);
  });

  it('skips the front item', () => {
    const onSkip = vi.fn();
    render(
      <RatingQueueSheet isOpen items={items} onClose={() => {}} onRate={() => {}} onSkip={onSkip} />
    );
    fireEvent.click(screen.getByRole('button', { name: /überspringen/i }));
    expect(onSkip).toHaveBeenCalledWith(items[0]);
  });

  it('shows the done state when the queue is empty', () => {
    render(
      <RatingQueueSheet isOpen items={[]} onClose={() => {}} onRate={() => {}} onSkip={() => {}} />
    );
    expect(screen.getByText(/Alles bewertet/)).toBeInTheDocument();
  });
});
