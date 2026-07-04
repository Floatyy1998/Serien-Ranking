// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import { ExtensionSessionsList } from './ExtensionSessionsList';

const theme = generateDynamicTheme(defaultThemeConfig);

interface Session {
  uid: string;
  platform: string;
  seriesName: string;
  season: number;
  episode: number;
  startTime: number;
  endTime: number;
  durationSec: number;
  progressPercent: number;
  abandoned: boolean;
  milestones: number[];
}

function session(overrides?: Partial<Session>): Session {
  return {
    uid: 'undefined',
    platform: 'netflix',
    seriesName: 'Lost',
    season: 1,
    episode: 2,
    startTime: Date.now(),
    endTime: Date.now(),
    durationSec: 1800,
    progressPercent: 90,
    abandoned: false,
    milestones: [],
    ...overrides,
  };
}

afterEach(cleanup);

describe('ExtensionSessionsList', () => {
  it('renders the session count header and session rows (smoke)', () => {
    render(
      <ExtensionSessionsList
        sessions={[session()]}
        userProfiles={{}}
        cardBg="#111"
        borderColor="#333"
        theme={theme}
      />
    );
    expect(screen.getByText('Sessions (1)')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByText('netflix')).toBeInTheDocument();
    expect(screen.getByText('S1E2')).toBeInTheDocument();
    // uid 'undefined' resolves to Unbekannt
    expect(screen.getByText('Unbekannt')).toBeInTheDocument();
  });

  it('shows the abandoned badge for abandoned sessions', () => {
    render(
      <ExtensionSessionsList
        sessions={[session({ abandoned: true, seriesName: 'Dark' })]}
        userProfiles={{}}
        cardBg="#111"
        borderColor="#333"
        theme={theme}
      />
    );
    expect(screen.getByText('ABBRUCH')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });
});
