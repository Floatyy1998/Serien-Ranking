// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AnimeMangaHandoff } from '../../services/detection/animeMangaHandoffDetection';
import { AnimeMangaHandoffNotification } from './AnimeMangaHandoffNotification';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const MOTION_PROPS = new Set(['whileTap', 'initial', 'animate', 'exit', 'transition']);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clean = (props: any) =>
    Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.has(k)));
  const motion = new Proxy(
    {},
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: (_t, tag: string) => (props: any) =>
        React.createElement(tag, clean(props), props.children),
    }
  );
  return { motion };
});

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
const mangaState = vi.hoisted(() => ({ mangaList: [] as { anilistId: number }[] }));
vi.mock('../../contexts/MangaListContext', () => ({ useMangaList: () => mangaState }));
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));
const dismissMock = vi.hoisted(() => vi.fn());
vi.mock('../../services/detection/animeMangaHandoffDetection', () => ({
  markAnimeMangaHandoffDismissed: dismissMock,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mangaState.mangaList = [];
});

const handoff = (over: Partial<AnimeMangaHandoff> = {}): AnimeMangaHandoff =>
  ({
    // nur die vom Component gelesenen Felder
    series: { id: 10, title: 'Fairy Tail' },
    seasonNumber: 4,
    mangaId: 999,
    mangaTitle: 'Fairy Tail (Manga)',
    totalChapters: 545,
    estimatedChapter: 120,
    confidence: 'med',
    ...over,
  }) as AnimeMangaHandoff;

describe('AnimeMangaHandoffNotification', () => {
  it('shows the season, manga and estimated chapter with an AI caveat', () => {
    render(<AnimeMangaHandoffNotification handoffs={[handoff()]} onDismiss={() => {}} />);
    expect(screen.getByText(/Staffel 4 von Fairy Tail durch/)).toBeInTheDocument();
    expect(screen.getByText(/Fairy Tail \(Manga\)/)).toBeInTheDocument();
    expect(screen.getByText(/Kapitel 120/)).toBeInTheDocument();
    expect(screen.getByText(/KI-Schätzung/)).toBeInTheDocument();
  });

  it('navigates to the manga and persists the dismiss on the primary action', () => {
    render(<AnimeMangaHandoffNotification handoffs={[handoff()]} onDismiss={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Zum Manga/ }));
    expect(navigate).toHaveBeenCalledWith('/manga/999');
    expect(dismissMock).toHaveBeenCalledWith('u1', 10, 4);
  });

  it('labels the primary action "Weiterlesen" when the manga is already tracked', () => {
    mangaState.mangaList = [{ anilistId: 999 }];
    render(<AnimeMangaHandoffNotification handoffs={[handoff()]} onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: /Weiterlesen/ })).toBeInTheDocument();
  });

  it('advances to the next handoff on "Später", then closes the category', () => {
    const onDismiss = vi.fn();
    const two = [
      handoff({ series: { id: 1, title: 'A' } as AnimeMangaHandoff['series'] }),
      handoff({ series: { id: 2, title: 'B' } as AnimeMangaHandoff['series'] }),
    ];
    render(<AnimeMangaHandoffNotification handoffs={two} onDismiss={onDismiss} />);
    expect(screen.getByText(/Staffel 4 von A durch/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Später' }));
    expect(screen.getByText(/Staffel 4 von B durch/)).toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Später' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
