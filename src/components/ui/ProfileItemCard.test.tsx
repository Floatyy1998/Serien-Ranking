// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileItemCard } from './ProfileItemCard';

const currentTheme = {
  primary: '#00d123',
  secondary: '#123456',
  accent: '#008a6e',
  background: { default: '#000000', surface: '#0f0f0f' },
  text: { primary: '#ffffff', muted: '#9aa0a6', secondary: '#cccccc' },
  status: { success: '#10b981', warning: '#ffc107' },
};

const providers = [
  { id: 1, name: 'Netflix', logo: 'https://x/netflix.png' },
  { id: 2, name: 'Disney+', logo: 'https://x/disney.png' },
];

afterEach(cleanup);

describe('ProfileItemCard', () => {
  it('renders the title and rating (smoke)', () => {
    render(
      <ProfileItemCard
        title="Breaking Bad"
        posterUrl="https://x/poster.jpg"
        isMovie={false}
        rating={9.4}
        providers={providers}
        currentTheme={currentTheme}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: 'Breaking Bad' })).toBeInTheDocument();
    expect(screen.getByText('9.4')).toBeInTheDocument();
  });

  it('renders the progress badge for a partially watched series', () => {
    render(
      <ProfileItemCard
        title="In Progress"
        posterUrl=""
        isMovie={false}
        rating={0}
        progress={100}
        providers={[]}
        currentTheme={currentTheme}
        onClick={() => {}}
      />
    );
    expect(screen.getByText('Fertig')).toBeInTheDocument();
  });

  it('fires onClick when the card is pressed', () => {
    const onClick = vi.fn();
    render(
      <ProfileItemCard
        title="Clickable"
        posterUrl="https://x/poster.jpg"
        isMovie
        rating={5}
        providers={[]}
        currentTheme={currentTheme}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByRole('heading', { name: 'Clickable' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('opens the provider popup on badge click', () => {
    render(
      <ProfileItemCard
        title="Providers"
        posterUrl="https://x/poster.jpg"
        isMovie={false}
        rating={7}
        providers={providers}
        currentTheme={currentTheme}
        onClick={() => {}}
      />
    );
    // "+1" overflow indicator shown on the primary badge for >1 provider
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
