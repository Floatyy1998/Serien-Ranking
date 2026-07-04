// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      text: { primary: '#fff', secondary: '#ccc' },
      background: { default: '#000' },
    },
  }),
}));

import { WatchJourneyLoadingState } from './WatchJourneyLoadingState';

afterEach(() => cleanup());

describe('WatchJourneyLoadingState', () => {
  it('renders the loading copy', () => {
    render(<WatchJourneyLoadingState />);
    expect(screen.getByText('Analysiere Watch-History...')).toBeInTheDocument();
    expect(screen.getByText('Berechne deine persönlichen Trends')).toBeInTheDocument();
  });
});
