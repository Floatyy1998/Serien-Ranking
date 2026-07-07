// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CaseOpeningOverlay } from './CaseOpeningOverlay';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: { text: { primary: '#fff', secondary: '#eee' } },
  }),
}));

const claimAccessoryDrop = vi.hoisted(() => vi.fn());
vi.mock('../../services/petService', () => ({
  petService: { claimAccessoryDrop },
}));

// Drop existiert nicht mehr in Firebase -> Endscreen (alreadyClaimed) statt Spin.
vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({
        once: () => Promise.resolve({ exists: () => false }),
      }),
    }),
  },
}));

class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  createBuffer() {
    return { getChannelData: () => new Float32Array(1) };
  }
  createBufferSource() {
    return { connect() {}, start() {}, stop() {}, buffer: null };
  }
  createBiquadFilter() {
    return { type: '', frequency: { value: 0 }, Q: { value: 0 }, connect() {} };
  }
  createWaveShaper() {
    return { curve: null, connect() {} };
  }
  createGain() {
    return {
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
    };
  }
  close() {
    return Promise.resolve();
  }
}

beforeEach(() => {
  claimAccessoryDrop.mockReset();
  vi.stubGlobal('AudioContext', MockAudioContext as unknown as typeof AudioContext);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CaseOpeningOverlay', () => {
  it('rendert nichts ohne dropData', () => {
    const { container } = render(<CaseOpeningOverlay dropData={null} onClose={vi.fn()} />);
    expect(container.querySelector('.case-opening-backdrop')).toBeNull();
  });

  it('zeigt den Endscreen wenn der Drop bereits eingesammelt wurde', async () => {
    render(
      <CaseOpeningOverlay
        dropData={{ dropId: 'abc', accessoryId: 'brille', rarity: 'rare' }}
        onClose={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByText('Schließen')).toBeInTheDocument());
  });

  it('ruft onClose beim Klick auf den Schließen-Button', async () => {
    const onClose = vi.fn();
    render(
      <CaseOpeningOverlay
        dropData={{ dropId: 'abc', accessoryId: 'brille', rarity: 'rare' }}
        onClose={onClose}
      />
    );
    const btn = await screen.findByText('Schließen');
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
