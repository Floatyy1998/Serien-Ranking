// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../components/wrapped', () => {
  const stub = (label: string) => () => <div>{label}</div>;
  return {
    IntroSlide: stub('INTRO_SLIDE'),
    TotalTimeSlide: stub('TOTAL_TIME'),
    TopSeriesSlide: stub('TOP_SERIES'),
    TopMoviesSlide: stub('TOP_MOVIES'),
    TopGenresSlide: stub('TOP_GENRES'),
    TopProvidersSlide: stub('TOP_PROVIDERS'),
    TimePatternSlide: stub('TIME_PATTERN'),
    BingeStatsSlide: stub('BINGE'),
    AchievementsSlide: stub('ACHIEVEMENTS'),
    MonthlyBreakdownSlide: stub('MONTHLY'),
    SummarySlide: stub('SUMMARY'),
    FirstLastSlide: stub('FIRST_LAST'),
    RecordDaySlide: stub('RECORD_DAY'),
    LateNightSlide: stub('LATE_NIGHT'),
    HeatmapSlide: stub('HEATMAP'),
  };
});
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#333', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#333';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import {
  WrappedLoadingState,
  WrappedErrorState,
  WrappedProgressBar,
  WrappedCloseButton,
  WrappedSlideRenderer,
} from './WrappedComponents';

afterEach(() => cleanup());

describe('WrappedComponents', () => {
  it('WrappedLoadingState shows the year', () => {
    render(<WrappedLoadingState year={2026} />);
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('Lade deinen Jahresrückblick...')).toBeInTheDocument();
  });

  it('WrappedProgressBar zeigt ein Segment je Folie und markiert den Stand', () => {
    const { container } = render(<WrappedProgressBar currentSlide={1} totalSlides={5} />);
    expect(screen.getByRole('progressbar', { name: 'Folie 2 von 5' })).toBeInTheDocument();
    expect(container.querySelectorAll('.wrapped-progress-seg')).toHaveLength(5);
    expect(container.querySelectorAll('.wrapped-progress-seg.is-done')).toHaveLength(1);
    expect(container.querySelectorAll('.wrapped-progress-seg.is-current')).toHaveLength(1);
  });

  it('WrappedCloseButton invokes its click handler', () => {
    const onClick = vi.fn();
    render(<WrappedCloseButton onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Schließen'));
    expect(onClick).toHaveBeenCalled();
  });

  it('WrappedErrorState shows the error and calls back', () => {
    const onBack = vi.fn();
    render(<WrappedErrorState error="Fehler!" onBack={onBack} />);
    expect(screen.getByText('Fehler!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Zurück zur Startseite'));
    expect(onBack).toHaveBeenCalled();
  });

  it('WrappedSlideRenderer renders the intro slide for the intro type', () => {
    render(
      <WrappedSlideRenderer
        slideType="intro"
        stats={
          { topSeries: [], topMovies: [] } as unknown as ComponentProps<
            typeof WrappedSlideRenderer
          >['stats']
        }
        year={2026}
        username="Alice"
      />
    );
    expect(screen.getByText('INTRO_SLIDE')).toBeInTheDocument();
  });
});
