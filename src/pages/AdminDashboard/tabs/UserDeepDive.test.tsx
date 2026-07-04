// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import { UserDeepDive } from './UserDeepDive';

const theme = generateDynamicTheme(defaultThemeConfig);
const userProfiles: Record<string, { displayName: string; photoURL: string; username: string }> = {
  'user-1': { displayName: 'Alice', photoURL: '', username: 'alice' },
};

interface Ev {
  e: string;
  p?: Record<string, unknown>;
  t: number;
}

function baseProps() {
  return {
    selectedUser: 'user-1',
    userProfiles,
    theme,
    onClose: vi.fn<() => void>(),
  };
}

afterEach(cleanup);

describe('UserDeepDive', () => {
  it('shows a loading placeholder and calls onClose when closed', () => {
    const props = baseProps();
    render(<UserDeepDive userEvents={[]} loadingUser {...props} />);
    expect(screen.getByText('Lade User-Daten...')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when the user has no events today', () => {
    render(<UserDeepDive userEvents={[]} loadingUser={false} {...baseProps()} />);
    expect(screen.getByText('Keine Events heute')).toBeInTheDocument();
  });

  it('renders analysis (series, stats, event log) for watched episodes', () => {
    const events: Ev[] = [
      {
        e: 'episode_watched',
        p: { series_name: 'Lost', season: 1, genres: 'Drama' },
        t: Date.now(),
      },
      {
        e: 'episode_watched',
        p: { series_name: 'Lost', season: 1, genres: 'Drama' },
        t: Date.now(),
      },
      { e: 'rating_saved', p: { rating: 9, item_type: 'series' }, t: Date.now() },
    ];
    render(<UserDeepDive userEvents={events} loadingUser={false} {...baseProps()} />);
    expect(screen.getByText('Geschaute Serien')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByText('Genre-Vorlieben')).toBeInTheDocument();
    expect(screen.getByText(/Event-Log \(3\)/)).toBeInTheDocument();
  });
});
