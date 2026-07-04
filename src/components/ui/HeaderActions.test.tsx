// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HeaderActions } from './HeaderActions';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const navigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      text: { primary: '#fff' },
      status: { error: '#ef4444' },
    },
  }),
}));

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('HeaderActions', () => {
  it('renders the notifications bell with a plain label when nothing is unread', () => {
    render(<HeaderActions totalUnreadBadge={0} onNotificationsOpen={vi.fn()} photoURL={null} />);
    expect(screen.getByRole('button', { name: 'Benachrichtigungen öffnen' })).toBeInTheDocument();
  });

  it('shows the unread count in the label and badge', () => {
    render(<HeaderActions totalUnreadBadge={3} onNotificationsOpen={vi.fn()} photoURL={null} />);
    expect(screen.getByRole('button', { name: /3 ungelesen/ })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onNotificationsOpen when the bell is clicked', () => {
    const onOpen = vi.fn();
    render(<HeaderActions totalUnreadBadge={0} onNotificationsOpen={onOpen} photoURL={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Benachrichtigungen öffnen' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('navigates to the profile when the avatar is clicked', () => {
    render(<HeaderActions totalUnreadBadge={0} onNotificationsOpen={vi.fn()} photoURL={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Profil und weitere Bereiche öffnen' }));
    expect(navigate).toHaveBeenCalledWith('/profile');
  });
});
