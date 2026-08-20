// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserAvatar } from './UserAvatar';

const navigate = vi.fn<(to: string) => void>();
/** Sammelt, welche Bilder gross angefordert wurden. */
const viewed: string[] = [];
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

const livePhotoURL = vi.fn<() => string | null>(() => null);
vi.mock('../../services/firebase/userDisplayData', () => ({
  fetchPublicUserFields: async () => ({
    username: null,
    displayName: null,
    photoURL: livePhotoURL(),
  }),
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

window.addEventListener('tvrank:view-avatar', (e) => {
  viewed.push((e as CustomEvent<{ url: string }>).detail.url);
});

/** Das Bild im Avatar-Knopf; wirft, wenn keins da ist. */
const avatarImg = (name: RegExp) => {
  const img = screen.getByRole('button', { name }).querySelector('img');
  if (!img) throw new Error(`Avatar ohne Bild: ${name}`);
  return img;
};

afterEach(() => {
  cleanup();
  navigate.mockReset();
  viewed.length = 0;
});

describe('UserAvatar', () => {
  it('renders an accessible button with the username (smoke)', () => {
    render(<UserAvatar userId="u1" username="Konrad" />);
    expect(screen.getByRole('button', { name: 'Profil von Konrad öffnen' })).toBeInTheDocument();
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

  it('uses the photoURL as image when provided', () => {
    render(<UserAvatar userId="u1" username="Photo" photoURL="https://x/p.jpg" />);
    expect(screen.getByRole('button', { name: /Photo/ }).querySelector('img')).toHaveAttribute(
      'src',
      'https://x/p.jpg'
    );
  });

  it('holt die aktuelle URL nach, wenn die gecachte nicht mehr laedt', async () => {
    livePhotoURL.mockReturnValue('https://x/neu.jpg');
    render(<UserAvatar userId="u7" username="Kat" photoURL="https://x/alt.jpg" />);

    fireEvent.error(avatarImg(/Kat/));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Kat/ }).querySelector('img')).toHaveAttribute(
        'src',
        'https://x/neu.jpg'
      )
    );
  });

  it('faellt auf die Initiale zurueck, wenn es gar kein Bild mehr gibt', async () => {
    livePhotoURL.mockReturnValue(null);
    render(<UserAvatar userId="u8" username="Bob" photoURL="https://x/tot.jpg" />);

    fireEvent.error(avatarImg(/Bob/));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Bob/ }).querySelector('img')).toBeNull()
    );
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('zeigt das Bild gross, wenn es nirgendwohin zu navigieren gibt', () => {
    render(<UserAvatar userId="u1" username="Bob" photoURL="https://x/p.jpg" navigable={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Profilbild von Bob' }));

    expect(navigate).not.toHaveBeenCalled();
    expect(viewed).toEqual(['https://x/p.jpg']);
  });
});
