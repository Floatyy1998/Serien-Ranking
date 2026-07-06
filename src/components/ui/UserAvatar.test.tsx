// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserAvatar } from './UserAvatar';

const navigate = vi.fn<(to: string) => void>();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('UserAvatar', () => {
  it('renders an accessible button with the username (smoke)', () => {
    render(<UserAvatar userId="u1" username="Konrad" />);
    expect(screen.getByRole('button', { name: 'Profil von Konrad anzeigen' })).toBeInTheDocument();
  });

  it('navigates to the friend profile when navigable', () => {
    render(<UserAvatar userId="u42" username="Alice" />);
    fireEvent.click(screen.getByRole('button', { name: /Alice/ }));
    expect(navigate).toHaveBeenCalledWith('/friend/u42');
  });

  it('does not navigate when navigable is false', () => {
    render(<UserAvatar userId="u42" username="Bob" navigable={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Bob/ }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('uses a background image when photoURL is provided', () => {
    render(<UserAvatar userId="u1" username="Photo" photoURL="https://x/p.jpg" />);
    const btn = screen.getByRole('button', { name: /Photo/ });
    expect(btn.style.backgroundImage).toContain('https://x/p.jpg');
  });
});
