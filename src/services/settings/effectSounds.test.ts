// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const load = async () => {
  vi.resetModules();
  return import('./effectSounds');
};

class MockAudio {
  static created: MockAudio[] = [];
  volume = 1;
  playbackRate = 1;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  constructor(public src: string) {
    MockAudio.created.push(this);
  }
}

beforeEach(() => {
  localStorage.clear();
  MockAudio.created = [];
  vi.stubGlobal('Audio', MockAudio);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('effectSounds', () => {
  it('ist standardmäßig an und merkt sich das Ausschalten', async () => {
    const mod = await load();
    expect(mod.readEffectSounds()).toBe(true);
    mod.setEffectSounds(false);
    expect(mod.readEffectSounds()).toBe(false);
    expect(localStorage.getItem('effectSounds')).toBe('0');
    expect((await load()).readEffectSounds()).toBe(false);
  });

  it('spielt den Reveal-Ton nur wenn Töne an sind', async () => {
    const mod = await load();
    mod.setEffectSounds(false);
    mod.playRevealSound(0.8, 5000);
    expect(MockAudio.created).toHaveLength(0);
    mod.setEffectSounds(true);
    mod.playRevealSound(0.8, 5000);
    expect(MockAudio.created).toHaveLength(1);
    expect(MockAudio.created[0].play).toHaveBeenCalled();
  });

  it('stoppt laufende Töne sofort beim Ausschalten', async () => {
    const mod = await load();
    mod.playRevealSound(0.6, 3000);
    const audio = MockAudio.created[0];
    mod.setEffectSounds(false);
    expect(audio.pause).toHaveBeenCalled();
  });

  it('stellt die Audio-Session auf ambient, damit der Stummschalter greift', async () => {
    const session = { type: 'auto' };
    Object.defineProperty(navigator, 'audioSession', { value: session, configurable: true });
    const mod = await load();
    mod.playRevealSound(0.8, 5000);
    expect(session.type).toBe('ambient');
    mod.applyPlaybackAudioSession();
    expect(session.type).toBe('playback');
  });
});
