// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TopProvidersSlide } from './TopProvidersSlide';
import type { TopProviderEntry } from '../../types/Wrapped';

afterEach(() => cleanup());

const provider = (name: string, extra: Partial<TopProviderEntry> = {}): TopProviderEntry => ({
  name,
  episodeCount: 30,
  movieCount: 3,
  totalCount: 33,
  minutesWatched: 125,
  percentage: 60,
  ...extra,
});

describe('TopProvidersSlide', () => {
  it('shows the empty state without streaming data', () => {
    render(<TopProvidersSlide topProviders={[]} />);
    expect(screen.getByText('Keine Streaming-Daten')).toBeInTheDocument();
  });

  it('renders the top provider with formatted minutes', () => {
    render(<TopProvidersSlide topProviders={[provider('Netflix')]} />);
    expect(screen.getByText('Dein Lieblings-Streaming-Dienst')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    // 125 minutes => "2 Std 5 Min"
    expect(screen.getByText('2 Std 5 Min')).toBeInTheDocument();
  });

  it('renders the runner-up providers', () => {
    render(
      <TopProvidersSlide
        topProviders={[provider('Netflix'), provider('Disney+', { percentage: 25 })]}
      />
    );
    expect(screen.getByText('Disney+')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });
});
