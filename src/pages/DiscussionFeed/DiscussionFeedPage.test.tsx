// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { useDiscussionFeedMock, navigateMock } = vi.hoisted(() => ({
  useDiscussionFeedMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition', 'whileTap'].includes(k))
          clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: { children: React.ReactNode }) => <>{props.children}</>,
  };
});

vi.mock('@mui/icons-material', () => {
  const Stub = () => <span />;
  return {
    AutoStories: Stub,
    ChatBubbleOutlined: Stub,
    MenuBook: Stub,
    Movie: Stub,
    Reply: Stub,
    Tv: Stub,
  };
});
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#333', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#333';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../components/ui', () => ({
  NameBadges: () => null,
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  SkeletonListRow: () => <div data-testid="skeleton-row" />,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('../../hooks/social/useDiscussionFeed', () => ({
  useDiscussionFeed: useDiscussionFeedMock,
}));
vi.mock('../../components/Discussion/utils', () => ({ formatRelativeTime: () => 'vor 1 Std' }));
vi.mock('../../lib/motion', () => ({ tapScale: {}, tapScaleSmall: {} }));

import { DiscussionFeedPage } from './DiscussionFeedPage';

beforeEach(() => {
  useDiscussionFeedMock.mockReset();
  navigateMock.mockReset();
});

afterEach(() => cleanup());

describe('DiscussionFeedPage', () => {
  it('renders skeleton rows while loading', () => {
    useDiscussionFeedMock.mockReturnValue({ entries: [], loading: true, error: null });
    render(<DiscussionFeedPage />);
    expect(screen.getByText('Diskussions-Feed')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-row').length).toBeGreaterThan(0);
  });

  it('renders an error message', () => {
    useDiscussionFeedMock.mockReturnValue({ entries: [], loading: false, error: 'Kaputt' });
    render(<DiscussionFeedPage />);
    expect(screen.getByText('Kaputt')).toBeInTheDocument();
  });

  it('renders an empty state when there are no entries', () => {
    useDiscussionFeedMock.mockReturnValue({ entries: [], loading: false, error: null });
    render(<DiscussionFeedPage />);
    expect(screen.getByText('Noch keine Diskussionen')).toBeInTheDocument();
  });

  it('renders feed entries and navigates on card click', () => {
    useDiscussionFeedMock.mockReturnValue({
      entries: [
        {
          id: 'e1',
          type: 'discussion_created',
          itemType: 'series',
          itemTitle: 'Lost',
          itemId: 99,
          username: 'Bob',
          discussionTitle: 'Theorie',
          createdAt: 123,
        },
      ],
      loading: false,
      error: null,
    });
    render(<DiscussionFeedPage />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Lost'));
    expect(navigateMock).toHaveBeenCalledWith('/series/99');
  });

  it('öffnet Buch-, Manga- und Folgen-Einträge auf ihrer eigenen Seite', () => {
    const entry = (id: string, rest: Record<string, unknown>) => ({
      id,
      type: 'discussion_created',
      username: 'Bob',
      discussionTitle: 'Theorie',
      createdAt: 123,
      ...rest,
    });
    useDiscussionFeedMock.mockReturnValue({
      entries: [
        entry('b', { itemType: 'book', itemTitle: 'Dune', itemId: 'ol-OL893414W' }),
        entry('m', { itemType: 'manga', itemTitle: 'Vagabond', itemId: 30656 }),
        entry('e', {
          itemType: 'episode',
          itemTitle: 'Lost',
          itemId: 99,
          seasonNumber: 2,
          episodeNumber: 5,
        }),
      ],
      loading: false,
      error: null,
    });
    render(<DiscussionFeedPage />);
    fireEvent.click(screen.getByText('Dune'));
    expect(navigateMock).toHaveBeenLastCalledWith('/books/ol-OL893414W');
    fireEvent.click(screen.getByText('Vagabond'));
    expect(navigateMock).toHaveBeenLastCalledWith('/manga/30656');
    fireEvent.click(screen.getByText('Lost S2E5'));
    expect(navigateMock).toHaveBeenLastCalledWith('/episode/99/s/2/e/5');
    expect(screen.getByText('Dune').closest('[data-media-id]')).toBeNull();
  });
});
