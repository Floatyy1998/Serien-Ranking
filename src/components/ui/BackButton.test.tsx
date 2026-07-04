// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackButton } from './BackButton';

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
  useLocation: () => ({ pathname: '/series/42' }),
}));

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      background: { surface: '#111' },
      text: { secondary: '#ddd' },
      border: { default: '#333' },
    },
  }),
}));

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('BackButton', () => {
  it('renders the back and home buttons by default', () => {
    render(<BackButton />);
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zur Startseite' })).toBeInTheDocument();
  });

  it('hides the home button when showHome is false', () => {
    render(<BackButton showHome={false} />);
    expect(screen.queryByRole('button', { name: 'Zur Startseite' })).not.toBeInTheDocument();
  });

  it('navigates home when there is no in-app history', () => {
    render(<BackButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('navigates home when the home button is clicked', () => {
    render(<BackButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Zur Startseite' }));
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
