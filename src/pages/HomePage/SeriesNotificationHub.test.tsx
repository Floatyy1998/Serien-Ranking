// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SeriesNotificationHub } from './SeriesNotificationHub';
import type { Series } from '../../types/Series';

vi.mock('../../contexts/ThemeContext', async () => {
  const actual = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: actual.defaultDynamicTheme }) };
});

vi.mock('./ProactiveRecapCard', () => ({
  ProactiveRecapCard: () => <div data-testid="recap-card" />,
}));
vi.mock('../../components/ui/ProviderChangeNotification', () => ({
  ProviderChangeNotification: () => <div data-testid="provider-card" />,
}));
vi.mock('../../components/ui/UnsubscribedNewSeasonNotification', () => ({
  UnsubscribedNewSeasonNotification: () => <div data-testid="unsub-card" />,
}));
vi.mock('../../components/ui/CarouselNotification', () => ({
  CarouselNotification: ({ variant }: { variant: string }) => (
    <div data-testid="carousel">{variant}</div>
  ),
}));

const S = (id: number): Series => ({ id, title: `S${id}` }) as unknown as Series;
const noop = (): void => {};

function baseProps(): React.ComponentProps<typeof SeriesNotificationHub> {
  return {
    proactiveRecaps: { recaps: [], dismiss: noop, fetchRecap: async () => {} },
    unsubscribedNewSeasons: [],
    onDismissUnsubscribed: noop,
    providerChanges: [],
    onDismissProvider: noop,
    seriesWithNewSeasons: [],
    onDismissNewSeasons: noop,
    inactiveSeries: [],
    onDismissInactive: noop,
    inactiveRewatches: [],
    onDismissInactiveRewatch: noop,
    completedSeries: [],
    onDismissCompleted: noop,
    unratedSeries: [],
    onDismissUnrated: noop,
    animeMangaHandoffs: [],
    onDismissAnimeManga: noop,
  };
}

afterEach(() => cleanup());

/** Expandiert den Hub, falls er als Mini-Banner startet. */
function expandIfMini() {
  const mini = screen.queryByRole('button', { name: /Hinweis/ });
  if (mini) fireEvent.click(mini);
}

describe('SeriesNotificationHub', () => {
  it('renders nothing when no category has content', () => {
    const { container } = render(<SeriesNotificationHub {...baseProps()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a small single category directly without tab bar or mini banner', () => {
    render(<SeriesNotificationHub {...baseProps()} completedSeries={[S(1)]} />);
    expect(screen.getByTestId('carousel')).toHaveTextContent('completed');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hinweis/ })).not.toBeInTheDocument();
  });

  it('starts as mini banner when multiple categories are pending and expands on tap', () => {
    render(
      <SeriesNotificationHub {...baseProps()} completedSeries={[S(1)]} unratedSeries={[S(2)]} />
    );
    // Rückstau → nur das schmale Banner, keine Karte
    const mini = screen.getByRole('button', { name: /2 Hinweise zu deinen Serien/ });
    expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
    fireEvent.click(mini);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByTestId('carousel')).toBeInTheDocument();
  });

  it('starts as mini banner for a single category with a big backlog', () => {
    render(<SeriesNotificationHub {...baseProps()} unratedSeries={[S(1), S(2), S(3), S(4)]} />);
    expect(screen.getByRole('button', { name: /4 Hinweise zu deinen Serien/ })).toBeInTheDocument();
    expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
  });

  it('collapses back to the mini banner via the collapse button', () => {
    render(
      <SeriesNotificationHub {...baseProps()} completedSeries={[S(1)]} unratedSeries={[S(2)]} />
    );
    expandIfMini();
    fireEvent.click(screen.getByRole('button', { name: 'Einklappen' }));
    expect(screen.getByRole('button', { name: /2 Hinweise zu deinen Serien/ })).toBeInTheDocument();
    expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
  });

  it('keeps the shown category when a higher-priority one arrives later', () => {
    const { rerender } = render(
      <SeriesNotificationHub {...baseProps()} completedSeries={[S(1)]} />
    );
    expect(screen.getByTestId('carousel')).toHaveTextContent('completed');
    rerender(
      <SeriesNotificationHub
        {...baseProps()}
        completedSeries={[S(1)]}
        seriesWithNewSeasons={[S(2)]}
      />
    );
    expandIfMini();
    expect(screen.getByRole('tab', { name: /Fertig/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Neu/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('shows a tab bar and switches the active category on tab click', () => {
    render(
      <SeriesNotificationHub {...baseProps()} completedSeries={[S(1)]} unratedSeries={[S(2)]} />
    );
    expandIfMini();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    // default = first active category (completed) is selected
    expect(screen.getByRole('tab', { name: /Fertig/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Bewerten/ })).toHaveAttribute('aria-selected', 'false');
    fireEvent.click(screen.getByRole('tab', { name: /Bewerten/ }));
    expect(screen.getByRole('tab', { name: /Bewerten/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Fertig/ })).toHaveAttribute('aria-selected', 'false');
  });
});
