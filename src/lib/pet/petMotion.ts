/** Reine Bewegungsmathematik für das laufende Pet (kein DOM, kein Canvas). */

export interface MotionFrame {
  pawLift: [number, number];
  /** Kippen um die Füße, Bogenmaß; positiv = nach rechts. */
  tilt: number;
  /** Anheben des ganzen Körpers in Rastereinheiten. */
  bob: number;
}

/** Watschel-Gang von vorn: Pfoten abwechselnd, Körper kippt auf das Standbein. */
export function walkCycle(phase: number, intensity = 1): MotionFrame {
  const s = Math.sin(phase);
  return {
    pawLift: [Math.max(0, s) * 1.5 * intensity, Math.max(0, -s) * 1.5 * intensity],
    tilt: -s * 0.085 * intensity,
    bob: Math.abs(s) * 0.55 * intensity,
  };
}

/** Strampeln, während das Pet hochgehoben wird. */
export function paddleCycle(t: number): MotionFrame {
  const s = Math.sin(t * 22);
  return { pawLift: [Math.max(0, s) * 1.4, Math.max(0, -s) * 1.4], tilt: 0, bob: 0 };
}

export const STILL: MotionFrame = { pawLift: [0, 0], tilt: 0, bob: 0 };

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** Gedämpfte Feder von 1 aus: für Landungs-Stauchung und Nachwippen. */
export function squashSpring(t: number, amount: number): number {
  return 1 - amount * Math.exp(-t * 9) * Math.cos(t * 26);
}

export function isNightHour(hour: number): boolean {
  return hour >= 23 || hour < 6;
}
