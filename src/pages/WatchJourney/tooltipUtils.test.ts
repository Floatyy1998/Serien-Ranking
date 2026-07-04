import { describe, expect, it } from 'vitest';
import { formatGermanNumber } from './tooltipUtils';

describe('formatGermanNumber', () => {
  it('ganze Zahlen ohne Dezimalstelle', () => {
    expect(formatGermanNumber(5)).toBe('5');
    expect(formatGermanNumber(5.0)).toBe('5');
  });

  it('rundet auf eine Nachkommastelle mit deutschem Komma', () => {
    expect(formatGermanNumber(5.25)).toBe('5,3');
    expect(formatGermanNumber(5.24)).toBe('5,2');
  });

  it('runden auf eine ganze Zahl entfernt die Dezimalstelle', () => {
    expect(formatGermanNumber(4.98)).toBe('5');
  });

  it('nutzt deutsche Tausendertrennung für ganze Zahlen', () => {
    expect(formatGermanNumber(1234)).toBe('1.234');
  });

  it('null bleibt "0"', () => {
    expect(formatGermanNumber(0)).toBe('0');
  });
});
