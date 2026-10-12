export interface PetAgingRules {
  stepHours: number;
  hungerPerStep: number;
  happinessLossPerStep: number;
  highHungerThreshold: number;
  highHungerHappinessPenalty: number;
}

export interface PetVitals {
  hunger: number;
  happiness: number;
}

const HOUR_MS = 60 * 60 * 1000;

/** Altert nur in ganzen Schritten; angebrochene Zeit bleibt für den nächsten Aufruf liegen. */
export function agePetVitals(
  vitals: PetVitals,
  elapsedMs: number,
  rules: PetAgingRules
): PetVitals & { steps: number; consumedMs: number } {
  const stepMs = rules.stepHours * HOUR_MS;
  const steps = elapsedMs > 0 ? Math.floor(elapsedMs / stepMs) : 0;
  let { hunger, happiness } = vitals;
  for (let i = 0; i < steps && hunger < 100 && happiness > 0; i++) {
    hunger = Math.min(100, hunger + rules.hungerPerStep);
    happiness = Math.max(0, happiness - rules.happinessLossPerStep);
    if (hunger > rules.highHungerThreshold) {
      happiness = Math.max(0, happiness - rules.highHungerHappinessPenalty);
    }
  }
  return { hunger, happiness, steps, consumedMs: steps * stepMs };
}
