// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnratedQueueItem } from '../../../hooks/rating/useUnratedQueue';
import { RatingQueueSheet } from './RatingQueueSheet';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../../lib/interaction/haptics', () => ({
  hapticSelect: vi.fn(),
  hapticSuccess: vi.fn(),
}));

vi.mock('../../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

const social = vi.hoisted(() => ({
  favoriteFriends: [] as { uid: string; displayName: string }[],
}));
vi.mock('../../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({ favoriteFriends: social.favoriteFriends }),
}));

vi.mock('../../social/FriendRatingsPanel', () => ({
  FriendRatingsPanel: ({ itemId }: { itemId?: number | string }) => (
    <div data-testid="friend-panel">{String(itemId)}</div>
  ),
}));

afterEach(cleanup);

const items: UnratedQueueItem[] = [
  {
    key: 'series-1',
    id: 1,
    type: 'series',
    title: 'Dexter',
    posterPath: '',
    genres: ['Drama', 'Crime'],
  },
  { key: 'movie-2', id: 2, type: 'movie', title: 'Heat', posterPath: '', genres: [] },
];

beforeEach(() => {
  social.favoriteFriends = [];
});

describe('RatingQueueSheet', () => {
  it('shows the front item and progress', () => {
    render(
      <RatingQueueSheet
        isOpen
        items={items}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    expect(screen.getByText('Dexter')).toBeInTheDocument();
    expect(screen.getByText(/1 von 2/)).toBeInTheDocument();
  });

  it('rates the front item with the selected value', () => {
    const onRate = vi.fn();
    render(
      <RatingQueueSheet isOpen items={items} onClose={() => {}} onRate={onRate} onSkip={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(onRate).toHaveBeenCalledWith(items[0], 9, undefined);
  });

  it('opens the genre stage and saves per-genre values', () => {
    const onRate = vi.fn();
    render(
      <RatingQueueSheet isOpen items={items} onClose={() => {}} onRate={onRate} onSkip={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alle Genres' }));
    fireEvent.change(screen.getByLabelText('Bewertung Crime'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(onRate).toHaveBeenCalledWith(items[0], 7, { Drama: 8, Crime: 6 });
  });

  it('uses the movie genre list for a movie card', () => {
    render(
      <RatingQueueSheet
        isOpen
        items={[items[1]]}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alle Genres' }));
    expect(screen.getByLabelText('Bewertung Science Fiction')).toBeInTheDocument();
  });

  it('starts the next card at zero but keeps the genre stage open', () => {
    const { rerender } = render(
      <RatingQueueSheet
        isOpen
        items={items}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alle Genres' }));

    rerender(
      <RatingQueueSheet
        isOpen
        items={[items[1]]}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Speichern/ })).toBeDisabled();
    // Aufgeklappt bleibt aufgeklappt — sonst achtmal neu aufklappen.
    expect(screen.getByRole('button', { name: 'Weniger' })).toBeInTheDocument();
  });

  it('skips the front item', () => {
    const onSkip = vi.fn();
    render(
      <RatingQueueSheet isOpen items={items} onClose={() => {}} onRate={() => {}} onSkip={onSkip} />
    );
    fireEvent.click(screen.getByRole('button', { name: /überspringen/i }));
    expect(onSkip).toHaveBeenCalledWith(items[0]);
  });

  it('shows the done state when the queue is empty', () => {
    render(
      <RatingQueueSheet isOpen items={[]} onClose={() => {}} onRate={() => {}} onSkip={() => {}} />
    );
    expect(screen.getByText(/Alles bewertet/)).toBeInTheDocument();
  });

  it('shows the friends tab for the front card only with favorites', () => {
    const { rerender } = render(
      <RatingQueueSheet
        isOpen
        items={items}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();

    social.favoriteFriends = [{ uid: 'f1', displayName: 'Flo' }];
    rerender(
      <RatingQueueSheet
        isOpen
        items={items}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: /Freunde/ }));
    expect(screen.getByTestId('friend-panel')).toHaveTextContent('1');
  });

  it('returns to the rating tab on the next card', () => {
    social.favoriteFriends = [{ uid: 'f1', displayName: 'Flo' }];
    const { rerender } = render(
      <RatingQueueSheet
        isOpen
        items={items}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: /Freunde/ }));
    expect(screen.getByTestId('friend-panel')).toBeInTheDocument();

    rerender(
      <RatingQueueSheet
        isOpen
        items={[items[1]]}
        onClose={() => {}}
        onRate={() => {}}
        onSkip={() => {}}
      />
    );
    // Jede Karte startet beim Bewerten.
    expect(screen.queryByTestId('friend-panel')).not.toBeInTheDocument();
  });
});
