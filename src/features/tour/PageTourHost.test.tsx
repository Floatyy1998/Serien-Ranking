// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const { pathnameRef } = vi.hoisted(() => ({ pathnameRef: { current: '/' } }));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: pathnameRef.current }),
}));

vi.mock('./data/pageTours', () => ({
  PAGE_TOURS: [
    {
      path: '/',
      version: 1,
      title: 'Startseite',
      intro: 'Intro Startseite',
      actions: [{ icon: 'play', title: 'Weiterschauen', text: 'Zur nächsten Folge.' }],
    },
    {
      path: '/calendar',
      version: 1,
      title: 'Kalender',
      intro: 'Intro Kalender',
      actions: [{ icon: 'check', title: 'Direkt abhaken', text: 'Aus dem Kalender heraus.' }],
    },
  ],
}));

vi.mock('./PageTourSheet', () => ({
  PageTourSheet: ({ tour, onClose }: { tour: { title: string } | null; onClose: () => void }) =>
    tour ? (
      <div>
        <span>{tour.title}</span>
        <button onClick={onClose}>schliessen</button>
      </div>
    ) : null,
}));

import { PageTourHost } from './PageTourHost';

const advancePastDelay = () => act(() => void vi.advanceTimersByTime(1300));

beforeEach(() => {
  pathnameRef.current = '/';
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('PageTourHost', () => {
  it('zeigt die Hilfe zur Seite nach kurzer Verzögerung', () => {
    render(<PageTourHost />);
    expect(screen.queryByText('Startseite')).toBeNull();

    advancePastDelay();

    expect(screen.getByText('Startseite')).toBeInTheDocument();
  });

  it('zeigt sie beim zweiten Besuch derselben Seite nicht mehr', () => {
    const first = render(<PageTourHost />);
    advancePastDelay();
    fireEvent.click(screen.getByText('schliessen'));
    first.unmount();

    render(<PageTourHost />);
    advancePastDelay();

    expect(screen.queryByText('Startseite')).toBeNull();
  });

  it('zeigt auf einer anderen Seite deren eigene Hilfe', () => {
    pathnameRef.current = '/calendar';
    render(<PageTourHost />);

    advancePastDelay();

    expect(screen.getByText('Kalender')).toBeInTheDocument();
  });

  it('zeigt nichts auf einer Seite ohne Hilfe', () => {
    pathnameRef.current = '/settings';
    render(<PageTourHost />);

    advancePastDelay();

    expect(screen.queryByText('Startseite')).toBeNull();
    expect(screen.queryByText('Kalender')).toBeNull();
  });

  it('öffnet nichts, wenn der Nutzer vor Ablauf weiterklickt', () => {
    const view = render(<PageTourHost />);
    act(() => void vi.advanceTimersByTime(600));

    pathnameRef.current = '/settings';
    view.rerender(<PageTourHost />);
    advancePastDelay();

    expect(screen.queryByText('Startseite')).toBeNull();
  });
});
