/**
 * Creates a deterministic pseudo-random number generator using a simple hash.
 * Useful for generating stable random values during React render
 * (Math.random() is considered impure by the React Compiler).
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}
