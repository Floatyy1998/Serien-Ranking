// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { NotificationSheet } from './NotificationSheet';
import type { UnifiedNotification } from './useUnifiedNotifications';

const navigate = vi.fn<(to: string) => void>();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../contexts/ThemeContextDef', async () => {
  const actual = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: actual.defaultDynamicTheme }) };
});

// BottomSheet renders children only while open — stub it to a plain wrapper.
vi.mock('../../components/ui', () => ({
  BottomSheet: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div data-testid="bottom-sheet">{children}</div> : null,
}));

vi.mock('./notifications/NotificationItem', () => ({
  NotificationItem: ({ item }: { item: UnifiedNotification }) => (
    <div data-testid="notification-item">{item.title}</div>
  ),
}));

vi.mock('./notifications/RecommendationCard', () => ({
  RecommendationCard: ({ item }: { item: UnifiedNotification }) => (
    <div data-testid="recommendation-card">{item.title}</div>
  ),
}));

function makeNotif(overrides: Partial<UnifiedNotification> = {}): UnifiedNotification {
  return {
    id: 'n1',
    kind: 'activity',
    title: 'Test Notif',
    message: 'hat etwas getan',
    timestamp: Date.now(),
    read: false,
    navigateTo: '/series/1',
    icon: 'tv',
    ...overrides,
  };
}

const noop = (): void => {};

function renderSheet(props: Partial<React.ComponentProps<typeof NotificationSheet>> = {}) {
  return render(
    <NotificationSheet
      isOpen
      onClose={noop}
      notifications={[]}
      onMarkAllRead={noop}
      onMarkAsRead={noop}
      onDismissAnnouncement={noop}
      onAcceptRequest={noop}
      onDeclineRequest={noop}
      onAcceptRecommendation={noop}
      onDeclineRecommendation={noop}
      {...props}
    />
  );
}

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('NotificationSheet', () => {
  it('shows the empty state when there are no notifications', () => {
    renderSheet({ notifications: [] });
    expect(screen.getByText('Alles ruhig hier')).toBeInTheDocument();
    expect(screen.getByText('Keine neuen Benachrichtigungen')).toBeInTheDocument();
  });

  it('renders items and the unread count, and fires onMarkAllRead', () => {
    const onMarkAllRead = vi.fn();
    renderSheet({ notifications: [makeNotif()], onMarkAllRead });
    expect(screen.getByText('1 ungelesen')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item')).toHaveTextContent('Test Notif');
    // header mark-all button is the first button in the DOM
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('navigates to the activity feed via the footer button', () => {
    const onClose = vi.fn();
    renderSheet({ notifications: [makeNotif({ read: true })], onClose });
    fireEvent.click(screen.getByRole('button', { name: /Alle Aktivitäten anzeigen/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/activity');
  });

  it('renders a recommendation card for recommendation notifications', () => {
    renderSheet({
      notifications: [
        makeNotif({
          id: 'rec1',
          kind: 'recommendation',
          title: 'Freund',
          recommendationData: {
            recId: 'r1',
            mediaId: 5,
            mediaType: 'series',
            mediaTitle: 'Dark',
            senderName: 'Freund',
          },
        }),
      ],
    });
    expect(screen.getByTestId('recommendation-card')).toHaveTextContent('Freund');
  });
});
