import { describe, expect, it } from 'vitest';
import {
  decideThrottle,
  emptyThrottleState,
  THROTTLE_LIMITS,
  type ThrottleState,
} from './throttle';

const TODAY = '2026-08-05';
const FP = 'abc123';

describe('decideThrottle', () => {
  it('laesst den ersten Bericht durch', () => {
    const d = decideThrottle(null, FP, 1000, TODAY);
    expect(d.allow).toBe(true);
    expect(d.reason).toBe('ok');
    expect(d.next.total).toBe(1);
  });

  it('blockt innerhalb des Mindestabstands', () => {
    const first = decideThrottle(null, FP, 1000, TODAY);
    const second = decideThrottle(first.next, 'anderer', 1500, TODAY);
    expect(second.allow).toBe(false);
    expect(second.reason).toBe('gap');
  });

  it('zaehlt unterdrueckte Wiederholungen und haengt sie an den naechsten Bericht', () => {
    const t0 = 1_700_000_000_000;
    let state = decideThrottle(null, FP, t0, TODAY).next;
    state = decideThrottle(state, FP, t0 + 100, TODAY).next;
    state = decideThrottle(state, FP, t0 + 200, TODAY).next;
    const next = decideThrottle(state, FP, t0 + 100_000, TODAY);
    expect(next.allow).toBe(true);
    expect(next.suppressed).toBe(2);
    expect(next.next.suppressed[FP]).toBeUndefined();
  });

  it('deckelt je Fingerprint pro Tag', () => {
    let state: ThrottleState | null = null;
    let time = 0;
    for (let i = 0; i < THROTTLE_LIMITS.perFingerprintPerDay; i++) {
      time += THROTTLE_LIMITS.minGapMs + 1;
      state = decideThrottle(state, FP, time, TODAY).next;
    }
    const blocked = decideThrottle(state, FP, time + 100000, TODAY);
    expect(blocked.allow).toBe(false);
    expect(blocked.reason).toBe('fingerprint-cap');
  });

  it('deckelt die Tagesmenge insgesamt', () => {
    const state: ThrottleState = { ...emptyThrottleState(TODAY), total: THROTTLE_LIMITS.perDay };
    const d = decideThrottle(state, FP, 999999, TODAY);
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('daily-cap');
  });

  it('setzt an einem neuen Tag zurueck', () => {
    const state: ThrottleState = {
      ...emptyThrottleState('2026-08-04'),
      total: THROTTLE_LIMITS.perDay,
    };
    const d = decideThrottle(state, FP, 999999, TODAY);
    expect(d.allow).toBe(true);
    expect(d.next.day).toBe(TODAY);
  });

  it('begrenzt die Zahl beobachteter Fingerprints', () => {
    let state: ThrottleState = emptyThrottleState(TODAY);
    for (let i = 0; i < THROTTLE_LIMITS.trackedFingerprints + 20; i++) {
      state = decideThrottle(state, `fp${i}`, 10, TODAY).next;
    }
    expect(Object.keys(state.suppressed).length).toBeLessThanOrEqual(
      THROTTLE_LIMITS.trackedFingerprints
    );
  });
});
