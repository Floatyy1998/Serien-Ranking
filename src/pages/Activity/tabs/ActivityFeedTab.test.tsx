// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

// framer-motion passthrough: the real lib throws on unmount in jsdom
// ("removeOnChange is not a function"). Strip motion-only props, render plain tags.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'layout',
    'layoutId',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragSnapToOrigin',
    'onDragEnd',
  ]);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
    useReducedMotion: () => true,
    useDragControls: () => ({ start: () => {} }),
  };
});
import type { FriendActivity } from '../../../types/Friend';
import type { ActivityFilterType } from '../types';

const { navigateMock, setFilterTypeMock, groupingRef } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  setFilterTypeMock: vi.fn(),
  groupingRef: {
    current: {
      filteredActivities: [] as FriendActivity[],
      filterType: 'all' as ActivityFilterType,
    },
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../../theme/colorUtils', () => ({ getOptimalTextColor: () => '#ffffff' }));
vi.mock('../../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../useActivityGrouping', () => ({
  useActivityGrouping: () => ({
    filteredActivities: groupingRef.current.filteredActivities,
    getItemDetails: () => ({ title: 'X' }),
    formatTimeAgo: () => 'vor 1 Min',
    filterType: groupingRef.current.filterType,
    setFilterType: setFilterTypeMock,
    getPosterUrl: () => 'https://img/p.jpg',
  }),
}));
vi.mock('../ActiveFriendsRow', () => ({ ActiveFriendsRow: () => <div>RAIL</div> }));
vi.mock('../ActivitySpotlight', () => ({ ActivitySpotlight: () => <div>SPOTLIGHT</div> }));
vi.mock('../ActivityEntryCard', () => ({
  ActivityEntryCard: ({ itemTitle }: { itemTitle: string }) => <div>ENTRY:{itemTitle}</div>,
}));
vi.mock('../CountUp', () => ({ CountUp: ({ value }: { value: number }) => <span>{value}</span> }));
vi.mock('../../../components/ui', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

import { ActivityFeedTab } from './ActivityFeedTab';

const activity = (id: string): FriendActivity => ({
  id,
  userId: 'u1',
  userName: 'Frank',
  type: 'series_added',
  itemTitle: `Item ${id}`,
  tmdbId: 42,
  timestamp: Date.now(),
});

beforeEach(() => {
  navigateMock.mockReset();
  setFilterTypeMock.mockReset();
  groupingRef.current = { filteredActivities: [], filterType: 'all' };
});

afterEach(() => cleanup());

const renderTab = () =>
  render(
    <ActivityFeedTab
      friendActivities={groupingRef.current.filteredActivities}
      friends={[]}
      friendProfiles={{}}
      saveScrollPosition={vi.fn()}
    />
  );

describe('ActivityFeedTab', () => {
  it('shows the empty state when there are no activities', () => {
    renderTab();
    expect(screen.getByText('Noch keine Aktivitäten')).toBeInTheDocument();
  });

  it('renders the spotlight and timeline entries when activities exist', () => {
    groupingRef.current = {
      filteredActivities: [activity('a'), activity('b')],
      filterType: 'all',
    };
    renderTab();
    expect(screen.getByText('SPOTLIGHT')).toBeInTheDocument();
    expect(screen.getByText('ENTRY:Item b')).toBeInTheDocument();
  });

  it('calls setFilterType when a segmented filter is chosen', () => {
    groupingRef.current = { filteredActivities: [activity('a')], filterType: 'all' };
    renderTab();
    fireEvent.click(screen.getByText('Serien'));
    expect(setFilterTypeMock).toHaveBeenCalledWith('series');
  });
});
