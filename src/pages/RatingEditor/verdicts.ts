export const verdicts = [
  { value: 2, max: 3, label: 'Schrecklich' },
  { value: 4, max: 5, label: 'Schlecht' },
  { value: 6, max: 6.5, label: 'Okay' },
  { value: 8, max: 8.5, label: 'Gut' },
  { value: 10, max: 10, label: 'Meisterwerk' },
] as const;

export const verdictIndex = (rating: number): number =>
  rating > 0 ? verdicts.findIndex((verdict) => rating <= verdict.max) : -1;
