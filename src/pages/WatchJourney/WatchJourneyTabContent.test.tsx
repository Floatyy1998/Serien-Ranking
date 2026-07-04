// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { WatchJourneyData, MultiYearTrendsData } from '../../services/watchJourneyService';

vi.mock('./ActivityTab', () => ({ ActivityTab: () => <div>activity-tab</div> }));
vi.mock('./GenreTab', () => ({ GenreTab: () => <div>genre-tab</div> }));
vi.mock('./HeatmapTab', () => ({ HeatmapTab: () => <div>heatmap-tab</div> }));
vi.mock('./InsightsTab', () => ({ InsightsTab: () => <div>insights-tab</div> }));
vi.mock('./ProviderTab', () => ({ ProviderTab: () => <div>provider-tab</div> }));
vi.mock('./SerienTab', () => ({ SerienTab: () => <div>serien-tab</div> }));
vi.mock('./TrendsTab', () => ({ TrendsTab: () => <div>trends-tab</div> }));

import { WatchJourneyTabContent } from './WatchJourneyTabContent';

const data = {} as WatchJourneyData;
const trendsData = {} as MultiYearTrendsData;

afterEach(() => cleanup());

describe('WatchJourneyTabContent', () => {
  it('renders the activity tab when active', () => {
    render(
      <WatchJourneyTabContent
        activeTab="activity"
        data={data}
        trendsData={trendsData}
        chartWidth={400}
      />
    );
    expect(screen.getByText('activity-tab')).toBeInTheDocument();
    expect(screen.queryByText('genre-tab')).toBeNull();
  });

  it('renders the trends tab only when trendsData exists', () => {
    const { rerender } = render(
      <WatchJourneyTabContent activeTab="trends" data={data} trendsData={null} chartWidth={400} />
    );
    expect(screen.queryByText('trends-tab')).toBeNull();

    rerender(
      <WatchJourneyTabContent
        activeTab="trends"
        data={data}
        trendsData={trendsData}
        chartWidth={400}
      />
    );
    expect(screen.getByText('trends-tab')).toBeInTheDocument();
  });
});
