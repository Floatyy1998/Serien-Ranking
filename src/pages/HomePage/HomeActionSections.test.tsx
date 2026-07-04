// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QuickActionsSection, SecondaryActionsSection } from './HomeActionSections';

vi.mock('../../contexts/ThemeContextDef', async () => {
  const actual = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: actual.defaultDynamicTheme }) };
});

afterEach(() => cleanup());

describe('QuickActionsSection', () => {
  it('renders only the visible (non-hidden) actions and navigates on click', () => {
    const navigate = vi.fn<(path: string) => void>();
    render(
      <QuickActionsSection
        config={{
          quickActionsOrder: ['ratings', 'discover', 'history', 'friends'],
          hiddenQuickActions: ['history'],
        }}
        navigate={navigate}
      />
    );
    expect(screen.getByText('Ratings')).toBeInTheDocument();
    expect(screen.getByText('Entdecken')).toBeInTheDocument();
    expect(screen.getByText('Freunde')).toBeInTheDocument();
    expect(screen.queryByText('Verlauf')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Ratings'));
    expect(navigate).toHaveBeenCalledWith('/ratings');
  });

  it('renders nothing when every quick action is hidden', () => {
    const { container } = render(
      <QuickActionsSection
        config={{
          quickActionsOrder: ['ratings', 'discover'],
          hiddenQuickActions: ['ratings', 'discover'],
        }}
        navigate={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SecondaryActionsSection', () => {
  it('renders the secondary actions and navigates on click', () => {
    const navigate = vi.fn<(path: string) => void>();
    render(
      <SecondaryActionsSection
        config={{
          secondaryActionsOrder: ['leaderboard', 'badges', 'pets'],
          hiddenSecondaryActions: [],
        }}
        navigate={navigate}
      />
    );
    expect(screen.getByText('Rangliste')).toBeInTheDocument();
    expect(screen.getByText('Badges')).toBeInTheDocument();
    expect(screen.getByText('Pets')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Rangliste'));
    expect(navigate).toHaveBeenCalledWith('/leaderboard');
  });
});
