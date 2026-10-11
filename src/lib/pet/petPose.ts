/** Steuert Augen, Blickrichtung und Pfoten eines Pets von außen (Laufen, Schlafen, Freuen). */
export interface PetPose {
  /** Anhebung der linken/rechten Pfote in Rastereinheiten. */
  pawLift: [number, number];
  eyes: 'auto' | 'closed' | 'happy';
  /** -1 = schaut nach links, 1 = nach rechts. */
  lookX: number;
}

export const NEUTRAL_POSE: PetPose = { pawLift: [0, 0], eyes: 'auto', lookX: 0 };
