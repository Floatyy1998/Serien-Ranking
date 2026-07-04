// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import type { RawEvent } from './ActivityEventConfig';
import { toDateKey } from './ActivityEventConfig';
import { ActivityFeed } from './ActivityFeedItem';

const theme = generateDynamicTheme(defaultThemeConfig);
const userProfiles: Record<string, { displayName: string; photoURL: string; username: string }> =
  {};

function baseProps() {
  return {
    userProfiles,
    range: 1,
    cardBg: '#111',
    borderColor: '#333',
    theme,
  };
}

afterEach(cleanup);

describe('ActivityFeed', () => {
  it('shows a loading placeholder when loading', () => {
    render(<ActivityFeed groupedEvents={new Map()} filteredEvents={[]} loading {...baseProps()} />);
    expect(screen.getByText('Lade Activity-Feed...')).toBeInTheDocument();
  });

  it('shows the empty state when there are no events', () => {
    render(
      <ActivityFeed
        groupedEvents={new Map()}
        filteredEvents={[]}
        loading={false}
        {...baseProps()}
      />
    );
    expect(screen.getByText('Keine Events fuer diesen Zeitraum')).toBeInTheDocument();
  });

  it('renders a grouped event row with formatted detail and user name', () => {
    const ev: RawEvent = {
      e: 'episode_watched',
      p: { series_name: 'Lost', season: 1, episode: 2 },
      t: Date.now(),
      uid: 'undefined',
    };
    const dk = toDateKey(new Date(ev.t));
    render(
      <ActivityFeed
        groupedEvents={new Map([[dk, [ev]]])}
        filteredEvents={[ev]}
        loading={false}
        {...baseProps()}
      />
    );
    expect(screen.getByText('Lost — S1E2')).toBeInTheDocument();
    expect(screen.getByText('Episode geschaut')).toBeInTheDocument();
    expect(screen.getByText('Unbekannt')).toBeInTheDocument();
  });
});
