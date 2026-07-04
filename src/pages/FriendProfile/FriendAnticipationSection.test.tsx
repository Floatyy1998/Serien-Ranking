// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FriendAnticipationItem } from './useFriendAnticipation';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'poster.jpg' }));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});
vi.mock('../../contexts/ThemeContextDef', () => {
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

import { FriendAnticipationSection } from './FriendAnticipationSection';

const item = (over: Partial<FriendAnticipationItem> = {}): FriendAnticipationItem => ({
  seriesId: 99,
  title: 'The Expanse',
  poster: '/p.jpg',
  airDate: '2026-07-10',
  daysUntil: 3,
  seasonNumber: 6,
  episodeNumber: 1,
  episodeTitle: 'Strange Dogs',
  bothWaiting: true,
  ...over,
});

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('FriendAnticipationSection', () => {
  it('renders nothing when there are no items', () => {
    const { container } = render(<FriendAnticipationSection friendName="Mia" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the header with the friend name and item details', () => {
    render(<FriendAnticipationSection friendName="Mia" items={[item()]} />);
    expect(screen.getByText('Worauf Mia wartet')).toBeInTheDocument();
    expect(screen.getByText('The Expanse')).toBeInTheDocument();
    expect(screen.getByText('in 3 Tagen')).toBeInTheDocument();
    expect(screen.getByText('Ihr beide')).toBeInTheDocument();
  });

  it('navigates to the series when an item is clicked', () => {
    render(<FriendAnticipationSection friendName="Mia" items={[item({ seriesId: 55 })]} />);
    fireEvent.click(screen.getByText('The Expanse'));
    expect(navigateMock).toHaveBeenCalledWith('/series/55');
  });
});
