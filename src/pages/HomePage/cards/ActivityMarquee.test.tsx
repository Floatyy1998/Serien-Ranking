// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ActivityMarquee, naechstePosition } from './ActivityMarquee';
import type { FriendActivity } from '../../../types/Friend';

const { navigateMock, actsRef } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  actsRef: { value: [] as FriendActivity[] },
}));

vi.mock('../../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('../../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({ friendActivities: actsRef.value }),
}));

vi.mock('../../../hooks/ui/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../../../hooks/ui/useTransitionNavigate', () => ({
  useTransitionNavigate: () => navigateMock,
}));

function makeActivity(over: Partial<FriendActivity> = {}): FriendActivity {
  return {
    id: 'a1',
    userId: 'f1',
    userName: 'Alice',
    type: 'series_added',
    itemTitle: 'Show',
    timestamp: 1000,
    ...over,
  };
}

afterEach(() => {
  cleanup();
  actsRef.value = [];
});

describe('ActivityMarquee', () => {
  it('renders nothing when there are no activities', () => {
    actsRef.value = [];
    const { container } = render(<ActivityMarquee />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a formatted activity label (smoke)', () => {
    actsRef.value = [makeActivity()];
    render(<ActivityMarquee />);
    const matches = screen.getAllByText((c) => c.startsWith('Alice hat'));
    expect(matches.length).toBeGreaterThan(0);
  });

  it('navigates to the activity feed when clicked', () => {
    actsRef.value = [makeActivity()];
    render(<ActivityMarquee />);
    fireEvent.click(screen.getByRole('button', { name: 'Aktivitäten deiner Freunde anzeigen' }));
    expect(navigateMock).toHaveBeenCalledWith('/activity');
  });
});

describe('naechstePosition', () => {
  it('schiebt das Band nach links', () => {
    // 48 px/s, also 4.8 px in 100 ms
    expect(naechstePosition(0, 100, 1000)).toBeCloseTo(-4.8, 5);
  });

  it('setzt nach einer vollen Runde zurueck, ohne einen Sprung zu hinterlassen', () => {
    expect(naechstePosition(-999.9, 100, 1000)).toBeCloseTo(-4.7, 5);
  });

  it('holt mehrere Runden auf einmal auf, wenn die Liste kuerzer geworden ist', () => {
    // Stand aus einer langen Liste (-3000) trifft auf eine kurze Runde (1000)
    expect(naechstePosition(-3000, 100, 1000)).toBeCloseTo(-4.8, 5);
  });
});
