// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RatingsStateProvider } from './RatingsStateProvider';
import { useRatingsState } from './RatingsStateContext';

const Consumer = () => {
  const { getRatingsState, updateRatingsState } = useRatingsState();
  const state = getRatingsState();
  return (
    <button onClick={() => updateRatingsState({ activeTab: 'movies' })}>
      tab:{state.activeTab}
    </button>
  );
};

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('RatingsStateProvider', () => {
  it('exposes the default ratings state to consumers', () => {
    render(
      <RatingsStateProvider>
        <Consumer />
      </RatingsStateProvider>
    );
    expect(screen.getByText('tab:series')).toBeInTheDocument();
  });

  it('persists state updates to sessionStorage', () => {
    render(
      <RatingsStateProvider>
        <Consumer />
      </RatingsStateProvider>
    );

    fireEvent.click(screen.getByText('tab:series'));

    const stored = JSON.parse(sessionStorage.getItem('ratingsPageState') || '{}');
    expect(stored.activeTab).toBe('movies');
  });
});
