// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeaturesGrid } from './FeaturesGrid';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    [
      'AutoStories',
      'Chat',
      'EmojiEvents',
      'Insights',
      'LocalLibrary',
      'Movie',
      'Tv',
      'Whatshot',
    ].map((n) => [n, stub])
  );
});

afterEach(() => {
  cleanup();
});

describe('FeaturesGrid', () => {
  it('renders the section heading and subheading', () => {
    render(<FeaturesGrid />);
    expect(screen.getByText('Alles was du brauchst')).toBeInTheDocument();
    expect(screen.getByText('Was TV-Rank alles kann')).toBeInTheDocument();
  });

  it('zeigt alle acht Bereiche, Anime und Bücher eingeschlossen', () => {
    render(<FeaturesGrid />);
    for (const title of [
      'Serien',
      'Filme',
      'Anime',
      'Manga',
      'Bücher',
      'Freunde & Chat',
      'Badges & Pets',
      'Wrapped & Statistiken',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });
});
