// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CharacterDescription } from '../../hooks/useCharacterDescriptions';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'layout',
    'layoutId',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragSnapToOrigin',
    'onDragEnd',
  ]);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
    useReducedMotion: () => true,
    useDragControls: () => ({ start: () => {} }),
  };
});
vi.mock('@mui/icons-material', () => ({ AutoAwesome: () => null, Send: () => null }));
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
vi.mock('../../hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({ state: 'idle', speak: vi.fn(), stop: vi.fn() }),
}));
vi.mock('../../components/ui/SpeakButton', () => ({ SpeakButton: () => <span /> }));

import { CharacterGuide } from './CharacterGuide';

const character: CharacterDescription = {
  name: 'Bryan Cranston',
  character: 'Walter White',
  description: 'Ein Chemielehrer, der zum Drogenboss wird.',
  profilePath: null,
  imageUrl: null,
};

const baseProps = {
  characters: [] as CharacterDescription[],
  loading: false,
  error: null as string | null,
  onGenerate: vi.fn(),
  userProgress: { season: 2, episode: 5 },
  isMobile: false,
  onAskQuestion: vi.fn<() => Promise<void>>(),
  questionAnswer: null as string | null,
  questionLoading: false,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CharacterGuide', () => {
  it('renders the not-generated prompt and triggers generation', () => {
    const onGenerate = vi.fn();
    render(<CharacterGuide {...baseProps} onGenerate={onGenerate} />);
    expect(screen.getByText('Wer war das nochmal?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Guide generieren'));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('renders the character list once descriptions exist', () => {
    render(<CharacterGuide {...baseProps} characters={[character]} />);
    expect(screen.getByText('Walter White')).toBeInTheDocument();
    expect(screen.getByText('Bryan Cranston')).toBeInTheDocument();
  });

  it('renders an error message', () => {
    render(<CharacterGuide {...baseProps} error="Etwas ging schief" />);
    expect(screen.getByText('Etwas ging schief')).toBeInTheDocument();
  });

  it('submits a question on Enter', () => {
    const onAskQuestion = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    render(<CharacterGuide {...baseProps} onAskQuestion={onAskQuestion} />);
    const input = screen.getByPlaceholderText('Was ist nochmal mit ... passiert?');
    fireEvent.change(input, { target: { value: 'Wer ist Gus?' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAskQuestion).toHaveBeenCalledWith('Wer ist Gus?');
  });
});
