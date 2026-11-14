// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CommunityTheme } from '../../services/theme/communityThemes';
import type { CommunityThemesState } from './useCommunityThemes';

vi.mock('../../services/db/ref', () => ({
  dbRef: vi.fn(),
  dbUpdate: vi.fn(),
  serverIncrement: vi.fn(),
}));
vi.mock('./ThemePreviewCard', () => ({
  ThemePreviewCard: ({
    preset,
    onApply,
    meta,
  }: {
    preset: { name: string };
    onApply: () => void;
    meta?: React.ReactNode;
  }) => (
    <button onClick={onApply}>
      {preset.name}
      {meta}
    </button>
  ),
}));

import { CommunitySection } from './CommunitySection';
import {
  cleanThemeName,
  isShareableColors,
  sortCommunityThemes,
} from '../../services/theme/communityThemes';

const colors = {
  primaryColor: '#111111',
  backgroundColor: '#222222',
  surfaceColor: '#333333',
  accentColor: '#444444',
  textColor: '#eeeeee',
};
const theme = (over: Partial<CommunityTheme>): CommunityTheme => ({
  id: 't1',
  name: 'Mitternacht',
  uid: 'other',
  author: 'Frank',
  createdAt: 1,
  uses: 3,
  ...colors,
  ...over,
});
const currentTheme = { text: { primary: '#fff', muted: '#999' } } as never;

const makeState = (over: Partial<CommunityThemesState> = {}): CommunityThemesState => ({
  themes: [],
  loading: false,
  failed: false,
  share: vi.fn(async () => true),
  rename: vi.fn(async () => true),
  remove: vi.fn(async () => undefined),
  setUse: vi.fn(),
  ...over,
});

const renderSection = (state: CommunityThemesState, ownColors: typeof colors | null = colors) => {
  const onPick = vi.fn();
  render(
    <CommunitySection
      state={state}
      uid="me"
      ownColors={ownColors}
      pickedId={undefined}
      currentTheme={currentTheme}
      isActive={() => false}
      onPick={onPick}
      onPreview={vi.fn()}
    />
  );
  return { onPick };
};

afterEach(() => cleanup());

describe('CommunitySection', () => {
  it('zeigt fremde Designs mit Urheber und Zahl der aktuellen Nutzer', () => {
    const { onPick } = renderSection(makeState({ themes: [theme({})] }));
    expect(screen.getByText('von Frank')).toBeInTheDocument();
    expect(screen.getByText('3 aktiv')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Mitternacht'));
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('summiert die aktuellen Nutzer der eigenen Designs', () => {
    renderSection(
      makeState({
        themes: [
          theme({ id: 'a', uid: 'me', uses: 4, primaryColor: '#abcdef' }),
          theme({ id: 'b', uid: 'me', uses: 2, primaryColor: '#fedcba' }),
        ],
      })
    );
    expect(screen.getByText('Deine Designs nutzen gerade 6 andere.')).toBeInTheDocument();
  });

  it('teilt das eigene Design mit bereinigtem Namen', async () => {
    const state = makeState();
    renderSection(state);
    fireEvent.click(screen.getByText('Mein Design teilen'));
    fireEvent.change(screen.getByPlaceholderText('Name deines Designs'), {
      target: { value: '  Mein   Abend  ' },
    });
    fireEvent.click(screen.getByText('Teilen'));
    await waitFor(() => expect(state.share).toHaveBeenCalledWith('Mein Abend', colors));
  });

  it('bietet das Teilen nicht an, wenn dieselben Farben schon geteilt sind', () => {
    renderSection(makeState({ themes: [theme({ uid: 'me' })] }));
    expect(screen.queryByText('Mein Design teilen')).not.toBeInTheDocument();
  });

  it('bietet das Teilen nicht an, solange die Farben unvollständig sind', () => {
    renderSection(makeState(), null);
    expect(screen.queryByText('Mein Design teilen')).not.toBeInTheDocument();
  });
});

describe('communityThemes', () => {
  it('kürzt und säubert Namen', () => {
    expect(cleanThemeName('  a   b  ')).toBe('a b');
    expect(cleanThemeName('x'.repeat(40))).toHaveLength(24);
  });

  it('erkennt unvollständige oder ungültige Farben', () => {
    expect(isShareableColors(colors)).toBe(true);
    expect(isShareableColors({ ...colors, textColor: 'rot' })).toBe(false);
    expect(isShareableColors({ ...colors, accentColor: undefined })).toBe(false);
  });

  it('sortiert nach Übernahmen, dann nach Alter', () => {
    const sorted = sortCommunityThemes([
      theme({ id: 'alt', uses: 2, createdAt: 1 }),
      theme({ id: 'top', uses: 9, createdAt: 1 }),
      theme({ id: 'neu', uses: 2, createdAt: 5 }),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(['top', 'neu', 'alt']);
  });
});
