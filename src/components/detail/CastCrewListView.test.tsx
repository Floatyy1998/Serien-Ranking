// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { CastCrewListView } from './CastCrewListView';
import type { AnimeCharacterData, CastMember } from './CastCrew.types';

afterEach(() => cleanup());

const cast: CastMember[] = [{ id: 1, name: 'Actor One', character: 'Hero' }];
const crew: CastMember[] = [{ id: 2, name: 'Director Two', job: 'Director' }];

const baseProps = {
  isAnime: false,
  animeCharacters: [] as AnimeCharacterData[],
  cast,
  crew,
  activeTab: 'cast' as const,
  setActiveTab: vi.fn(),
  onPersonClick: vi.fn(),
  onVoiceActorClick: vi.fn(),
};

describe('CastCrewListView', () => {
  it('renders tab labels with counts and the active cast list', () => {
    render(<CastCrewListView {...baseProps} />);
    expect(screen.getByText('Besetzung (1)')).toBeInTheDocument();
    expect(screen.getByText('Crew (1)')).toBeInTheDocument();
    expect(screen.getByText('Actor One')).toBeInTheDocument();
  });

  it('switches tab when the Crew button is clicked', () => {
    const setActiveTab = vi.fn();
    render(<CastCrewListView {...baseProps} setActiveTab={setActiveTab} />);
    fireEvent.click(screen.getByText('Crew (1)'));
    expect(setActiveTab).toHaveBeenCalledWith('crew');
  });

  it('invokes onPersonClick with the member id when a cast row is clicked', () => {
    const onPersonClick = vi.fn();
    render(<CastCrewListView {...baseProps} onPersonClick={onPersonClick} />);
    fireEvent.click(screen.getByText('Actor One'));
    expect(onPersonClick).toHaveBeenCalledWith(1);
  });

  it('renders anime characters and fires onVoiceActorClick on row click', () => {
    const onVoiceActorClick = vi.fn();
    const animeCharacters: AnimeCharacterData[] = [
      {
        character: { name: 'Naruto' },
        role: 'Hauptrolle',
        voice_actors: [{ person: { id: 9, name: 'Junko' }, language: 'Japanese' }],
      },
    ];
    render(
      <CastCrewListView
        {...baseProps}
        isAnime
        animeCharacters={animeCharacters}
        activeTab="characters"
        onVoiceActorClick={onVoiceActorClick}
      />
    );
    expect(screen.getByText('Naruto')).toBeInTheDocument();
    expect(screen.getByText('Junko')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Naruto'));
    expect(onVoiceActorClick).toHaveBeenCalledWith(animeCharacters[0].voice_actors?.[0]);
  });
});
