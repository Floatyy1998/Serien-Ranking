// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NotificationItem } from './NotificationItem';
import { defaultDynamicTheme } from '../../../theme/dynamicTheme';
import type { UnifiedNotification } from '../useUnifiedNotifications';

// useUnifiedNotifications pulls in firebase + contexts at module load — stub it.
vi.mock('../useUnifiedNotifications', () => ({
  formatNotificationTime: () => 'vor 1 Std',
}));

function makeNotif(overrides: Partial<UnifiedNotification> = {}): UnifiedNotification {
  return {
    id: 'n1',
    kind: 'activity',
    title: 'Lisa',
    message: 'hat "Dark" hinzugefügt',
    timestamp: Date.now(),
    read: false,
    navigateTo: '/series/1',
    icon: 'tv',
    ...overrides,
  };
}

const noop = (): void => {};

afterEach(() => cleanup());

describe('NotificationItem', () => {
  it('renders the title, message and formatted time', () => {
    render(
      <NotificationItem
        item={makeNotif()}
        isLast={false}
        theme={defaultDynamicTheme}
        onItemClick={noop}
        onAcceptRequest={noop}
        onDeclineRequest={noop}
      />
    );
    expect(screen.getByText('Lisa')).toBeInTheDocument();
    expect(screen.getByText('hat "Dark" hinzugefügt')).toBeInTheDocument();
    expect(screen.getByText('vor 1 Std')).toBeInTheDocument();
  });

  it('fires onItemClick when a non-request item is clicked', () => {
    const onItemClick = vi.fn();
    render(
      <NotificationItem
        item={makeNotif()}
        isLast
        theme={defaultDynamicTheme}
        onItemClick={onItemClick}
        onAcceptRequest={noop}
        onDeclineRequest={noop}
      />
    );
    fireEvent.click(screen.getByText('Lisa'));
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it('shows accept/decline actions for friend requests and fires the handlers', () => {
    const onAcceptRequest = vi.fn();
    const onDeclineRequest = vi.fn();
    render(
      <NotificationItem
        item={makeNotif({
          kind: 'request',
          title: 'Freundschaftsanfrage',
          requestId: 'req-9',
        })}
        isLast
        theme={defaultDynamicTheme}
        onItemClick={noop}
        onAcceptRequest={onAcceptRequest}
        onDeclineRequest={onDeclineRequest}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Annehmen/ }));
    expect(onAcceptRequest).toHaveBeenCalledWith('req-9');
    fireEvent.click(screen.getByRole('button', { name: /Ablehnen/ }));
    expect(onDeclineRequest).toHaveBeenCalledWith('req-9');
  });
});
