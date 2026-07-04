// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeaturesGrid } from './FeaturesGrid';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    ['Star', 'TrendingUp', 'People', 'EmojiEvents', 'Movie', 'Tv', 'AutoStories'].map((n) => [
      n,
      stub,
    ])
  );
});

afterEach(() => {
  cleanup();
});

describe('FeaturesGrid', () => {
  it('renders the section heading and subheading', () => {
    render(<FeaturesGrid />);
    expect(screen.getByText('Alles was du brauchst')).toBeInTheDocument();
    expect(screen.getByText('Features für das beste Tracking-Erlebnis')).toBeInTheDocument();
  });

  it('renders all seven feature titles', () => {
    render(<FeaturesGrid />);
    for (const title of [
      'Serien-Tracking',
      'Film-Bibliothek',
      'Bewertungssystem',
      'Badges & Erfolge',
      'Freunde-System',
      'Manga-Tracking',
      'Statistiken',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });
});
