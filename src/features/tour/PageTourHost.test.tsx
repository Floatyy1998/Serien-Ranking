// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TOURS_START } from '../../lib/pageTour';

const { pathnameRef, authRef } = vi.hoisted(() => ({
  pathnameRef: { current: '/' },
  authRef: { current: null as { uid: string; metadata: { creationTime?: string } } | null },
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: pathnameRef.current }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authRef.current }),
}));

const { loadMock, writeMock } = vi.hoisted(() => ({
  loadMock: vi.fn(() => Promise.resolve({})),
  writeMock: vi.fn(),
}));

vi.mock('../../services/pageTour', () => ({
  readSeenTours: () => ({}),
  loadSeenTours: loadMock,
  writeSeenTours: writeMock,
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

const NEW_ACCOUNT = new Date(TOURS_START + 86_400_000).toUTCString();
const OLD_ACCOUNT = new Date(TOURS_START - 86_400_000).toUTCString();

const advancePastDelay = () => act(() => void vi.advanceTimersByTime(1300));

beforeEach(() => {
  pathnameRef.current = '/';
  authRef.current = { uid: 'u1', metadata: { creationTime: NEW_ACCOUNT } };
  loadMock.mockClear();
  loadMock.mockResolvedValue({});
  writeMock.mockClear();
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('Wer die Hilfe überhaupt bekommt', () => {
  it('zeigt sie einem frisch angelegten Konto', () => {
    render(<PageTourHost />);
    advancePastDelay();
    expect(screen.getByText('Startseite')).toBeInTheDocument();
  });

  it('zeigt sie Bestandsnutzern nie', () => {
    authRef.current = { uid: 'u1', metadata: { creationTime: OLD_ACCOUNT } };
    render(<PageTourHost />);
    advancePastDelay();
    expect(screen.queryByText('Startseite')).toBeNull();
  });

  it('zeigt sie nicht, wenn das Anlegedatum fehlt', () => {
    authRef.current = { uid: 'u1', metadata: {} };
    render(<PageTourHost />);
    advancePastDelay();
    expect(screen.queryByText('Startseite')).toBeNull();
  });

  it('zeigt sie ohne angemeldeten Nutzer nicht', () => {
    authRef.current = null;
    render(<PageTourHost />);
    advancePastDelay();
    expect(screen.queryByText('Startseite')).toBeNull();
  });

  it('fragt den Kontostand für Bestandsnutzer gar nicht erst ab', () => {
    authRef.current = { uid: 'u1', metadata: { creationTime: OLD_ACCOUNT } };
    render(<PageTourHost />);
    expect(loadMock).not.toHaveBeenCalled();
  });
});

describe('PageTourHost', () => {
  it('zeigt die Hilfe zur Seite nach kurzer Verzögerung', () => {
    render(<PageTourHost />);
    expect(screen.queryByText('Startseite')).toBeNull();

    advancePastDelay();

    expect(screen.getByText('Startseite')).toBeInTheDocument();
  });

  it('merkt den gesehenen Stand am Konto, nicht nur am Gerät', () => {
    render(<PageTourHost />);
    advancePastDelay();
    fireEvent.click(screen.getByText('schliessen'));

    expect(writeMock).toHaveBeenCalledWith({ '/': 1 }, 'u1');
  });

  it('zeigt nichts, was auf einem anderen Gerät schon gesehen wurde', async () => {
    loadMock.mockResolvedValue({ '/': 1 });
    render(<PageTourHost />);
    await act(async () => {});

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
