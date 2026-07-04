// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff88',
      text: { secondary: '#ccc', muted: '#999' },
    },
  }),
}));

import { WatchJourneyTabs } from './WatchJourneyTabs';

afterEach(() => cleanup());

describe('WatchJourneyTabs', () => {
  it('renders all tab buttons and the active tab title', () => {
    render(<WatchJourneyTabs activeTab="activity" onTabChange={() => {}} />);
    // 7 tab buttons
    expect(screen.getAllByRole('button')).toHaveLength(7);
    // Active tab label rendered in the title heading
    expect(screen.getByRole('heading', { name: 'Aktivität' })).toBeInTheDocument();
  });

  it('invokes onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn<(tab: string) => void>();
    render(<WatchJourneyTabs activeTab="trends" onTabChange={onTabChange} />);
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });
});
