/**
 * Drosselung der Fehlerberichte. Ohne sie schreibt ein Fehler in einer
 * Render-Schleife tausende Zeilen in die RTDB — das kostet Egress und macht
 * die Auswertung unbrauchbar. Reine Entscheidungslogik, der Zustand wird vom
 * Aufrufer gehalten und persistiert.
 */

export const THROTTLE_LIMITS = {
  /** Mindestabstand zwischen zwei geschriebenen Berichten. */
  minGapMs: 3000,
  /** Je Fehlerursache pro Tag — mehr bringt keinen Erkenntnisgewinn. */
  perFingerprintPerDay: 3,
  /** Harte Obergrenze pro Nutzer und Tag. */
  perDay: 25,
  /** Obergrenze der beobachteten Fingerprints, damit der Zustand klein bleibt. */
  trackedFingerprints: 50,
} as const;

export type ThrottleReason = 'ok' | 'gap' | 'fingerprint-cap' | 'daily-cap';

export interface ThrottleState {
  /** Tagesschlüssel `YYYY-MM-DD`; ein neuer Tag setzt die Zähler zurück. */
  day: string;
  total: number;
  written: Record<string, number>;
  /** Seit dem letzten geschriebenen Bericht unterdrückte Wiederholungen. */
  suppressed: Record<string, number>;
  lastWriteAt: number;
}

export const emptyThrottleState = (day: string): ThrottleState => ({
  day,
  total: 0,
  written: {},
  suppressed: {},
  lastWriteAt: 0,
});

/** Behält nur die häufigsten Einträge, damit der persistierte Zustand nicht wächst. */
function capEntries(map: Record<string, number>): Record<string, number> {
  const entries = Object.entries(map);
  if (entries.length <= THROTTLE_LIMITS.trackedFingerprints) return map;
  entries.sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(entries.slice(0, THROTTLE_LIMITS.trackedFingerprints));
}

export interface ThrottleDecision {
  allow: boolean;
  reason: ThrottleReason;
  /** Nur bei `allow`: wie viele Wiederholungen dieser Bericht mit abdeckt. */
  suppressed: number;
  next: ThrottleState;
}

export function decideThrottle(
  state: ThrottleState | null,
  fingerprint: string,
  now: number,
  today: string
): ThrottleDecision {
  const base =
    state && state.day === today
      ? { ...state, written: { ...state.written }, suppressed: { ...state.suppressed } }
      : emptyThrottleState(today);

  const deny = (reason: ThrottleReason): ThrottleDecision => ({
    allow: false,
    reason,
    suppressed: 0,
    next: {
      ...base,
      suppressed: capEntries({
        ...base.suppressed,
        [fingerprint]: (base.suppressed[fingerprint] || 0) + 1,
      }),
    },
  });

  if (base.total >= THROTTLE_LIMITS.perDay) return deny('daily-cap');
  if ((base.written[fingerprint] || 0) >= THROTTLE_LIMITS.perFingerprintPerDay) {
    return deny('fingerprint-cap');
  }
  if (base.lastWriteAt && now - base.lastWriteAt < THROTTLE_LIMITS.minGapMs) return deny('gap');

  const suppressed = base.suppressed[fingerprint] || 0;
  const nextSuppressed = { ...base.suppressed };
  delete nextSuppressed[fingerprint];

  return {
    allow: true,
    reason: 'ok',
    suppressed,
    next: {
      day: today,
      total: base.total + 1,
      written: capEntries({ ...base.written, [fingerprint]: (base.written[fingerprint] || 0) + 1 }),
      suppressed: nextSuppressed,
      lastWriteAt: now,
    },
  };
}
