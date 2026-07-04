// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecapSheet } from './RecapSheet';
import type { RecapEpisode } from '../../hooks/useRecapData';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({ state: 'idle', speak: vi.fn(), stop: vi.fn() }),
}));

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

const episodes: RecapEpisode[] = [
  {
    seasonNumber: 1,
    episodeNumber: 1,
    name: 'Pilot',
    overview: 'The beginning.',
    stillPath: null,
  },
];

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    onDismissPermanent: vi.fn(),
    seriesTitle: 'Dexter',
    daysSinceLastWatch: 42,
    recapEpisodes: episodes,
    aiRecap: null as string | null,
    aiLoading: false,
    aiError: null as string | null,
    onGenerateAiRecap: vi.fn(),
    loading: false,
    onAskQuestion: vi.fn<(q: string) => Promise<void>>(async () => {}),
    questionAnswer: null as string | null,
    questionLoading: false,
  };
}

afterEach(cleanup);

describe('RecapSheet', () => {
  it('shows the series title and pause duration (smoke)', () => {
    render(<RecapSheet {...baseProps()} />);
    expect(screen.getByRole('heading', { name: 'Dexter' })).toBeInTheDocument();
    expect(screen.getByText('42 Tage pausiert')).toBeInTheDocument();
  });

  it('offers to generate an AI recap when none exists', () => {
    const props = baseProps();
    render(<RecapSheet {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /KI-Zusammenfassung generieren/ }));
    expect(props.onGenerateAiRecap).toHaveBeenCalledTimes(1);
  });

  it('renders the AI recap as bullet points', () => {
    render(<RecapSheet {...baseProps()} aiRecap={'- First point\n- Second point'} />);
    expect(screen.getByText('First point')).toBeInTheDocument();
    expect(screen.getByText('Second point')).toBeInTheDocument();
  });

  it('submits a question', () => {
    const props = baseProps();
    render(<RecapSheet {...props} />);
    const input = screen.getByPlaceholderText('Was ist nochmal passiert mit...?');
    fireEvent.change(input, { target: { value: 'Wer ist der Täter?' } });
    const sendBtn = input.parentElement?.querySelector('button') as HTMLButtonElement;
    fireEvent.click(sendBtn);
    expect(props.onAskQuestion).toHaveBeenCalledWith('Wer ist der Täter?');
  });
});
