// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AchievementsSlide } from './AchievementsSlide';
import type { WrappedAchievement } from '../../types/Wrapped';

afterEach(() => cleanup());

const achievements: WrappedAchievement[] = [
  {
    id: 'night_owl',
    title: 'Nachteule',
    description: 'Mehr als 30% nachts geschaut',
    icon: 'moon',
    unlocked: true,
    value: '50',
  },
  {
    id: 'movie_lover',
    title: 'Cineast',
    description: '20+ Filme geschaut',
    icon: 'film',
    unlocked: true,
  },
  {
    id: 'consistent',
    title: 'Beständig',
    description: '30+ Tage Streak',
    icon: 'flame',
    unlocked: false,
  },
];

describe('AchievementsSlide', () => {
  it('renders the unlocked/total counter', () => {
    render(<AchievementsSlide achievements={achievements} />);
    expect(screen.getByText('Deine Achievements')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('renders unlocked achievement cards', () => {
    render(<AchievementsSlide achievements={achievements} />);
    expect(screen.getByText('Nachteule')).toBeInTheDocument();
    expect(screen.getByText('Cineast')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('shows the locked section hint', () => {
    render(<AchievementsSlide achievements={achievements} />);
    expect(screen.getByText('Nächstes Jahr freischalten:')).toBeInTheDocument();
  });
});
