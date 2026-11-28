import { describe, expect, it } from 'vitest';
import { isSeriesEnded, isSeriesOngoing } from './seriesStatus';

describe('seriesStatus', () => {
  it('erkennt laufende Serien am Status, unabhängig von der Schreibweise', () => {
    expect(isSeriesOngoing({ status: 'Returning Series' })).toBe(true);
    expect(isSeriesOngoing({ status: 'ongoing' })).toBe(true);
    expect(isSeriesOngoing({ status: 'Ended' })).toBe(false);
  });

  it('erkennt beendete und abgesetzte Serien', () => {
    expect(isSeriesEnded({ status: 'Ended' })).toBe(true);
    expect(isSeriesEnded({ status: 'Canceled' })).toBe(true);
    expect(isSeriesEnded({ status: 'Returning Series' })).toBe(false);
  });

  it('nimmt das Produktions-Flag nur, wenn kein Status da ist', () => {
    expect(isSeriesOngoing({ production: { production: true } })).toBe(true);
    expect(isSeriesEnded({ production: { production: false } })).toBe(true);
    expect(isSeriesEnded({ status: 'Returning Series', production: { production: false } })).toBe(
      false
    );
    expect(isSeriesOngoing({ status: 'Ended', production: { production: true } })).toBe(false);
  });

  it('ordnet Serien ohne jede Angabe keiner Seite zu', () => {
    expect(isSeriesOngoing({})).toBe(false);
    expect(isSeriesEnded({})).toBe(false);
    expect(isSeriesEnded({ status: 'In Production' })).toBe(false);
  });
});
