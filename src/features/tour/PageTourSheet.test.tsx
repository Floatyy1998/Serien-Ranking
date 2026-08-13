// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PageTour } from '../../lib/pageTour';

vi.mock('../../components/ui', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock('./tourIcons', () => ({ getTourIcon: () => () => null }));

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

vi.mock('../../theme/colorUtils', () => ({ getOptimalTextColor: () => '#000' }));

import { PageTourSheet } from './PageTourSheet';

const tour: PageTour = {
  path: '/calendar',
  version: 1,
  title: 'Kalender',
  intro: 'Wann welche Folge läuft.',
  actions: [
    { icon: 'check', title: 'Direkt abhaken', text: 'Aus dem Kalender heraus.' },
    { icon: 'filter', title: 'Nur Watchlist', text: 'Reduziert auf gemerkte Serien.' },
  ],
};

afterEach(() => cleanup());

describe('PageTourSheet', () => {
  it('rendert nichts ohne Hilfe', () => {
    const { container } = render(<PageTourSheet tour={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('zeigt Titel, Intro und jede Aktion', () => {
    render(<PageTourSheet tour={tour} onClose={vi.fn()} />);

    expect(screen.getByText('Kalender')).toBeInTheDocument();
    expect(screen.getByText('Wann welche Folge läuft.')).toBeInTheDocument();
    expect(screen.getByText('Direkt abhaken')).toBeInTheDocument();
    expect(screen.getByText('Aus dem Kalender heraus.')).toBeInTheDocument();
    expect(screen.getByText('Nur Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Reduziert auf gemerkte Serien.')).toBeInTheDocument();
  });

  it('schließt über den Bestätigen-Knopf', () => {
    const onClose = vi.fn();
    render(<PageTourSheet tour={tour} onClose={onClose} />);

    fireEvent.click(screen.getByText('Alles klar'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
