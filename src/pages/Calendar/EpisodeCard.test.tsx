// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { WeeklyEpisode } from '../../hooks/watch/useWeeklyEpisodes';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('@mui/icons-material', () => ({
  Add: () => <span data-testid="add-icon" />,
  PlaylistAddCheck: () => <span data-testid="inlist-icon" />,
  Check: () => null,
  ExpandMore: () => null,
  Star: () => <span data-testid="star-filled" />,
  StarBorder: () => <span data-testid="star-outline" />,
}));
// framer-motion stirbt in jsdom beim Abbauen des Spinners.
vi.mock('../../components/ui/feedback/LoadingSpinner', () => ({
  LoadingSpinner: () => <span data-testid="spinner" />,
}));
vi.mock('../../hooks/provider/useActiveSubscriptions', () => ({
  useActiveSubscriptions: () => ({
    activeProviders: new Set<string>(),
    getSeriesOverride: () => null,
    getKnownProviders: () => [],
  }),
}));
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

import { SingleEpisodeCard, EpisodeGroupCard } from './EpisodeCard';
import { CalendarViewModeContext } from './calendarViewMode';

const ep = (over: Partial<WeeklyEpisode> = {}): WeeklyEpisode => ({
  seriesId: 42,
  seriesTitle: 'Severance',
  poster: '/p.jpg',
  seasonNumber: 2,
  episodeNumber: 3,
  episodeName: 'Woe’s Hollow',
  airDate: '2026-07-01',
  watched: false,
  seasonIndex: 1,
  episodeIndex: 2,
  runtime: 45,
  providerNames: [],
  providers: [],
  userRating: 0,
  ...over,
});

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('SingleEpisodeCard', () => {
  it('renders the series title and episode code', () => {
    render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    expect(screen.getAllByText('Severance').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/S02E03/).length).toBeGreaterThan(0);
  });

  it('navigates to the episode route when the card is clicked', () => {
    const { container } = render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    const card = container.querySelector('.cal-ep') as HTMLElement;
    fireEvent.click(card);
    expect(navigateMock).toHaveBeenCalledWith('/episode/42/s/2/e/3');
  });

  it('shows the own series rating and opens the quick rating sheet', () => {
    const onRate = vi.fn();
    const { container } = render(
      <SingleEpisodeCard
        ep={ep({ userRating: 8.5 })}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={onRate}
      />
    );
    const chip = container.querySelector('.cal-ep-rate') as HTMLElement;
    expect(chip.textContent).toContain('8.5');
    expect(chip.className).toContain('is-rated');
    fireEvent.click(chip);
    expect(onRate).toHaveBeenCalledWith(42);
    // Der Klick darf die Karte nicht mit aufziehen
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('marks an unrated series with an outlined star instead of a value', () => {
    const { container } = render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    const chip = container.querySelector('.cal-ep-rate') as HTMLElement;
    expect(chip.textContent).not.toMatch(/\d/);
    expect(chip.querySelector('[data-testid="star-outline"]')).not.toBeNull();
    expect(chip.className).not.toContain('is-rated');
  });

  it('marks the episode watched via the mark button', () => {
    const onMark = vi.fn();
    const { container } = render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={onMark}
        onRateSeries={vi.fn()}
      />
    );
    const markBtn = container.querySelector('.cal-ep-mark') as HTMLElement;
    fireEvent.click(markBtn);
    expect(onMark).toHaveBeenCalledWith(42, 1, 2);
  });
});

describe('EpisodeGroupCard', () => {
  const group = {
    seriesId: 42,
    seriesTitle: 'Severance',
    episodes: [ep({ episodeNumber: 3 }), ep({ episodeNumber: 4, episodeIndex: 3 })],
  };

  it('renders the group header with the episode count label', () => {
    render(
      <EpisodeGroupCard
        group={group}
        backdropSrc={undefined}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    expect(screen.getAllByText(/2 Folgen · 0 gesehen/).length).toBeGreaterThan(0);
  });

  it('shows the series rating in the group header', () => {
    const onRate = vi.fn();
    const { container } = render(
      <EpisodeGroupCard
        group={{ ...group, episodes: group.episodes.map((e) => ({ ...e, userRating: 7.25 })) }}
        backdropSrc={undefined}
        isExpanded={false}
        onToggle={vi.fn()}
        onMarkWatched={vi.fn()}
        onRateSeries={onRate}
      />
    );
    const chip = container.querySelector('.cal-ep-rate') as HTMLElement;
    expect(chip.textContent).toContain('7.3');
    fireEvent.click(chip);
    expect(onRate).toHaveBeenCalledWith(42);
  });

  it('toggles expansion when the header is clicked', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <EpisodeGroupCard
        group={group}
        backdropSrc={undefined}
        isExpanded={false}
        onToggle={onToggle}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    fireEvent.click(container.querySelector('.cal-ep-group-header') as HTMLElement);
    expect(onToggle).toHaveBeenCalled();
  });

  it('renders the expanded episode list when open', () => {
    render(
      <EpisodeGroupCard
        group={group}
        backdropSrc={undefined}
        isExpanded={true}
        onToggle={vi.fn()}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    expect(screen.getByText('E04')).toBeInTheDocument();
  });

  it('fragt nach Folge oder Serie, statt direkt zu springen', () => {
    // Wie bei „Heute neu" und „Weiterschauen": der Klick oeffnet erst die Wahl.
    const onEpisodeNav = vi.fn();
    const { container } = render(
      <CalendarViewModeContext.Provider value={{ readOnly: false, onEpisodeNav }}>
        <SingleEpisodeCard
          ep={ep()}
          backdropSrc={undefined}
          onMarkWatched={vi.fn()}
          onRateSeries={vi.fn()}
        />
      </CalendarViewModeContext.Provider>
    );
    fireEvent.click(container.querySelector('.cal-ep') as Element);
    expect(onEpisodeNav).toHaveBeenCalledWith(42, 'Severance', '/episode/42/s/2/e/3');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('springt ohne Handler weiterhin direkt zur Folge', () => {
    const { container } = render(
      <SingleEpisodeCard
        ep={ep()}
        backdropSrc={undefined}
        onMarkWatched={vi.fn()}
        onRateSeries={vi.fn()}
      />
    );
    fireEvent.click(container.querySelector('.cal-ep') as Element);
    expect(navigateMock).toHaveBeenCalledWith('/episode/42/s/2/e/3');
  });
});

describe('Zur eigenen Liste hinzufuegen', () => {
  const addToList = (over: Partial<{ inList: boolean; adding: boolean }> = {}) => ({
    inList: () => over.inList ?? false,
    adding: () => over.adding ?? false,
    add: vi.fn(),
  });

  const renderCard = (value: Parameters<typeof CalendarViewModeContext.Provider>[0]['value']) =>
    render(
      <CalendarViewModeContext.Provider value={value}>
        <SingleEpisodeCard
          ep={ep()}
          backdropSrc={undefined}
          onMarkWatched={vi.fn()}
          onRateSeries={vi.fn()}
        />
      </CalendarViewModeContext.Provider>
    );

  it('bleibt im eigenen Kalender unsichtbar', () => {
    const { container } = renderCard({ readOnly: false });
    expect(container.querySelector('.cal-ep-add')).toBeNull();
  });

  it('holt die Serie in die eigene Liste, ohne die Karte zu oeffnen', () => {
    const slot = addToList();
    const { container } = renderCard({ readOnly: true, addToList: slot });
    const btn = container.querySelector('button.cal-ep-add--inline') as HTMLElement;
    fireEvent.click(btn);
    expect(slot.add).toHaveBeenCalledWith(42, 'Severance');
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('zeigt statt des Knopfes einen Haken, wenn die Serie schon drin ist', () => {
    const slot = addToList({ inList: true });
    const { container } = renderCard({ readOnly: true, addToList: slot });
    expect(container.querySelector('button.cal-ep-add')).toBeNull();
    expect(container.querySelector('.cal-ep-add.is-in-list')).not.toBeNull();
  });

  it('sperrt den Knopf, solange das Hinzufuegen laeuft', () => {
    const slot = addToList({ adding: true });
    const { container } = renderCard({ readOnly: true, addToList: slot });
    const btn = container.querySelector('button.cal-ep-add--inline') as HTMLElement;
    expect(btn.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(btn);
    expect(slot.add).not.toHaveBeenCalled();
  });
});

describe('Fremder Kalender zeigt Fortschritt ohne Schaltflaechen', () => {
  const readOnly = (over: Partial<WeeklyEpisode> = {}) =>
    render(
      <CalendarViewModeContext.Provider value={{ readOnly: true }}>
        <SingleEpisodeCard
          ep={ep(over)}
          backdropSrc={undefined}
          onMarkWatched={vi.fn()}
          onRateSeries={vi.fn()}
        />
      </CalendarViewModeContext.Provider>
    );

  it('zeigt „offen" als Ecke am Poster statt als Knopf', () => {
    const { container } = readOnly();
    expect(container.querySelector('button.cal-ep-mark')).toBeNull();
    expect(container.querySelector('button.cal-ep-mark-overlay')).toBeNull();
    expect(container.querySelector('.cal-ep-poster-status.is-open')).not.toBeNull();
    expect(container.querySelector('.cal-ep-mark-overlay.is-static')).not.toBeNull();
  });

  it('zeigt den Haken, wenn der Freund die Folge gesehen hat', () => {
    const { container } = readOnly({ watched: true });
    expect(container.querySelector('.cal-ep-poster-status.is-watched')).not.toBeNull();
    expect(container.querySelector('.cal-ep-poster-status.is-open')).toBeNull();
  });

  it('zeigt die Bewertung des Freundes als reine Anzeige', () => {
    const { container } = readOnly({ userRating: 8.5 });
    expect(container.querySelector('button.cal-ep-rate')).toBeNull();
    const chip = container.querySelector('.cal-ep-rate.is-static') as HTMLElement;
    expect(chip.textContent).toContain('8.5');
  });
});
