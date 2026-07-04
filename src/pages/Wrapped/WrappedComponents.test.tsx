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
vi.mock('../../contexts/ThemeContextDef', () => {
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

  it('WrappedProgressBar shows the current slide number', () => {
    render(<WrappedProgressBar currentSlide={0} totalSlides={5} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('/ 5')).toBeInTheDocument();
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
        stats={{} as ComponentProps<typeof WrappedSlideRenderer>['stats']}
        year={2026}
        username="Alice"
        onShare={vi.fn<() => Promise<void>>()}
      />
    );
    expect(screen.getByText('INTRO_SLIDE')).toBeInTheDocument();
  });
});
