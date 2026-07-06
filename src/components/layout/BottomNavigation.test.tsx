// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BottomNavigation } from './BottomNavigation';

const routerState = vi.hoisted(() => ({ pathname: '/' }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: routerState.pathname }),
}));

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ currentTheme: {} }) }));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({ useOptimizedFriends: () => ({}) }));
vi.mock('../../contexts/NotificationContext', () => ({ useNotifications: () => ({}) }));
vi.mock('../../hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: () => ({ onKeyDown: vi.fn() }),
}));

const todayEpisodes = vi.hoisted(() => ({ value: [] as Array<{ watched: boolean }> }));
vi.mock('../../hooks/useTodayEpisodes', () => ({
  useTodayEpisodes: () => todayEpisodes.value,
}));

// PetWidget lädt Firebase/Pet-Services -> Stub.
vi.mock('../pet', () => ({ PetWidget: () => null }));

beforeEach(() => {
  routerState.pathname = '/';
  navigate.mockReset();
  todayEpisodes.value = [];
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('BottomNavigation', () => {
  it('rendert alle Navigations-Labels', () => {
    render(<BottomNavigation />);
    ['Home', 'Weiter', 'Kalender', 'Bewertungen', 'Manga', 'Mehr'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('navigiert beim Klick auf einen inaktiven Tab', () => {
    render(<BottomNavigation />);
    fireEvent.click(screen.getByText('Manga'));
    expect(navigate).toHaveBeenCalledWith('/manga');
  });

  it('versteckt sich auf Detail-Seiten', () => {
    routerState.pathname = '/series/123';
    const { container } = render(<BottomNavigation />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt ein Badge für ungesehene Episoden heute', () => {
    todayEpisodes.value = [{ watched: false }, { watched: true }];
    render(<BottomNavigation />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
