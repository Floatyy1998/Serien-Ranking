export const CROSSOVER_EVENT = 'tvrank:crossover';

export interface OpenCrossoverDetail {
  id: string;
}

/** Öffnet das Crossover-Sheet des globalen CrossoverHost (von jeder Liste aus). */
export function openCrossover(id: string): void {
  window.dispatchEvent(new CustomEvent<OpenCrossoverDetail>(CROSSOVER_EVENT, { detail: { id } }));
}
