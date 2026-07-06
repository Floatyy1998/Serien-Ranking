// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecommendationCard } from './RecommendationCard';
import type { UnifiedNotification } from '../useUnifiedNotifications';

vi.mock('../../../contexts/ThemeContext', async () => {
  const actual = await import('../../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: actual.defaultDynamicTheme }) };
});

vi.mock('../useUnifiedNotifications', () => ({
  formatNotificationTime: () => 'vor 2 Std',
}));

function makeRec(overrides: Partial<UnifiedNotification> = {}): UnifiedNotification {
  return {
    id: 'rec1',
    kind: 'recommendation',
    title: 'Max',
    message: 'empfiehlt dir "Dark"',
    timestamp: Date.now(),
    read: false,
    icon: 'recommendation',
    recommendationData: {
      recId: 'r-1',
      mediaId: 42,
      mediaType: 'series',
      mediaTitle: 'Dark',
      senderName: 'Max',
      message: 'Musst du sehen!',
    },
    ...overrides,
  };
}

const noop = (): void => {};

afterEach(() => cleanup());

describe('RecommendationCard', () => {
  it('renders nothing when the item has no recommendationData', () => {
    const { container } = render(
      <RecommendationCard
        item={makeRec({ recommendationData: undefined })}
        isLast
        onAccept={noop}
        onDecline={noop}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders sender, media title, type label and the message quote', () => {
    render(<RecommendationCard item={makeRec()} isLast onAccept={noop} onDecline={noop} />);
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('Serie')).toBeInTheDocument();
    expect(screen.getByText(/Musst du sehen!/)).toBeInTheDocument();
  });

  it('fires onAccept and onDecline with the recId', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    render(
      <RecommendationCard item={makeRec()} isLast onAccept={onAccept} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Anschauen/ }));
    expect(onAccept).toHaveBeenCalledWith('r-1');
    fireEvent.click(screen.getByRole('button', { name: /Nope/ }));
    expect(onDecline).toHaveBeenCalledWith('r-1');
  });
});
