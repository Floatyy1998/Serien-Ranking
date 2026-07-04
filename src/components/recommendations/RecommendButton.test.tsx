// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecommendButton } from './RecommendButton';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({ currentTheme: { primary: '#00d123' } }),
}));

// RecommendSheet würde useRecommendSheet + Firebase laden -> Stub.
vi.mock('./RecommendSheet', () => ({
  RecommendSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="recommend-sheet">offen</div> : null,
}));

const media = { id: 5, type: 'series' as const, title: 'Alpha' };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('RecommendButton', () => {
  it('rendert den Empfehlen-Button', () => {
    render(<RecommendButton media={media} />);
    expect(screen.getByRole('button', { name: 'An Freund empfehlen' })).toBeInTheDocument();
  });

  it('öffnet das Sheet beim Klick', () => {
    render(<RecommendButton media={media} />);
    expect(screen.queryByTestId('recommend-sheet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'An Freund empfehlen' }));
    expect(screen.getByTestId('recommend-sheet')).toBeInTheDocument();
  });
});
