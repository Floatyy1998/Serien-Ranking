// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { OnboardingItem } from '../hooks/useOnboardingSearch';
import type { WatchTarget } from '../hooks/useApplyWatchProgress';

vi.mock('../components/CoverWall', () => ({ CoverWall: () => <div>cover-wall</div> }));
vi.mock('../components/WatchStatusSheet', () => ({ WatchStatusSheet: () => <div>sheet</div> }));

import { DiscoveryStep } from './DiscoveryStep';

const seriesItem: OnboardingItem = {
  id: 3,
  title: 'Fargo',
  poster_path: '/fargo.jpg',
  vote_average: 8.9,
  first_air_date: '2014-04-15',
  type: 'series',
};

function baseProps(overrides: Partial<React.ComponentProps<typeof DiscoveryStep>> = {}) {
  return {
    contentType: 'series' as const,
    stepNumber: 2 as const,
    suggestions: [] as OnboardingItem[],
    searchResults: [] as OnboardingItem[],
    loading: false,
    searchLoading: false,
    pendingMap: new Map<string, OnboardingItem>(),
    pendingId: null,
    watchTargets: new Map<number, WatchTarget>(),
    onSearchChange: vi.fn<(q: string) => void>(),
    onTogglePending: vi.fn<(it: OnboardingItem) => void>(),
    onRemovePending: vi.fn<(it: OnboardingItem) => void>(),
    onSetWatchTarget: vi.fn<(id: number, t: WatchTarget) => void>(),
    onClearSearch: vi.fn<() => void>(),
    onNext: vi.fn<() => void>(),
    onBack: vi.fn<() => void>(),
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('DiscoveryStep', () => {
  it('renders the empty state when there are no suggestions', () => {
    render(<DiscoveryStep {...baseProps()} />);
    expect(screen.getByText('leer.')).toBeInTheDocument();
    expect(screen.getByText('nutze die suche, um etwas hinzuzufügen')).toBeInTheDocument();
  });

  it('renders suggestion cards and fires onNext from the CTA', () => {
    const onNext = vi.fn<() => void>();
    render(<DiscoveryStep {...baseProps({ suggestions: [seriesItem], onNext })} />);
    expect(screen.getByText('Fargo')).toBeInTheDocument();
    fireEvent.click(screen.getByText('weiter zu filmen'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onBack from the back link', () => {
    const onBack = vi.fn<() => void>();
    render(<DiscoveryStep {...baseProps({ onBack })} />);
    fireEvent.click(screen.getByText('← zurück'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
