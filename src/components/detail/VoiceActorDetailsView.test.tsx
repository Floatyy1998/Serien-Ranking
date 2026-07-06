// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

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

vi.mock('../ui', () => ({
  HorizontalScrollContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { VoiceActorDetailsView } from './VoiceActorDetailsView';
import type { VoiceActorDetailsData } from './CastCrew.types';

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

const details: VoiceActorDetailsData = {
  name: { full: 'Yuki Kaji', native: '梶裕貴' },
  image: { large: 'https://img/yuki.png' },
  dateOfBirth: { year: 1985, month: 9, day: 3 },
  characterMedia: {
    edges: [
      {
        node: {
          id: 7,
          title: { english: 'Attack Anime', romaji: 'Shingeki' },
          type: 'ANIME',
          coverImage: { large: 'https://img/c.png' },
          startDate: { year: 2013 },
          meanScore: 84,
        },
        characters: [{ id: 1, name: { full: 'Eren' } }],
        characterRole: 'MAIN',
      },
    ],
  },
};

describe('VoiceActorDetailsView', () => {
  it('shows a loading state while details are loading', () => {
    render(
      <VoiceActorDetailsView voiceActorDetails={details} voiceActorLoading onBack={vi.fn()} />
    );
    expect(screen.getByText('Lade Sprecher-Details...')).toBeInTheDocument();
  });

  it('renders the voice actor name and known-for media', () => {
    render(
      <VoiceActorDetailsView
        voiceActorDetails={details}
        voiceActorLoading={false}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByText('Yuki Kaji')).toBeInTheDocument();
    expect(screen.getByText('Attack Anime')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(
      <VoiceActorDetailsView
        voiceActorDetails={details}
        voiceActorLoading={false}
        onBack={onBack}
      />
    );
    fireEvent.click(screen.getByText('← Zurück'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('opens the AniList fallback when a media entry is clicked without a TMDB key', async () => {
    const openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);
    // Guard against a locally-present VITE_API_TMDB: force the fetch path to fail
    // so the component falls back to AniList in either branch.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response)
    );
    render(
      <VoiceActorDetailsView
        voiceActorDetails={details}
        voiceActorLoading={false}
        onBack={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Attack Anime'));
    await waitFor(() => expect(openSpy).toHaveBeenCalled());
    vi.unstubAllGlobals();
  });
});
