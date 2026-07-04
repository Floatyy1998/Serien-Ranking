import { describe, expect, it } from 'vitest';
import { csvIncludes, matchesAnyCsv, parseCsv, toggleCsv } from './multiSelectFilter';

describe('parseCsv', () => {
  it('gibt leeres Array für null/undefined/leer zurück', () => {
    expect(parseCsv(null)).toEqual([]);
    expect(parseCsv(undefined)).toEqual([]);
    expect(parseCsv('')).toEqual([]);
  });

  it('splittet an Kommas und trimmt Whitespace', () => {
    expect(parseCsv('Action, Comedy ,Drama')).toEqual(['Action', 'Comedy', 'Drama']);
  });

  it('filtert leere Segmente und die Sentinels "Alle"/"All" heraus', () => {
    expect(parseCsv('Action,,Alle,All,Comedy')).toEqual(['Action', 'Comedy']);
  });

  it('gibt leeres Array zurück, wenn nur Sentinels enthalten sind', () => {
    expect(parseCsv('Alle')).toEqual([]);
    expect(parseCsv('All')).toEqual([]);
  });
});

describe('toggleCsv', () => {
  it('fügt einen fehlenden Wert hinzu', () => {
    expect(toggleCsv('Action', 'Comedy')).toBe('Action,Comedy');
  });

  it('entfernt einen vorhandenen Wert', () => {
    expect(toggleCsv('Action,Comedy', 'Action')).toBe('Comedy');
  });

  it('fügt aus leerem CSV hinzu', () => {
    expect(toggleCsv('', 'Action')).toBe('Action');
    expect(toggleCsv(null, 'Action')).toBe('Action');
  });

  it('das Entfernen des einzigen Werts ergibt leeren String', () => {
    expect(toggleCsv('Action', 'Action')).toBe('');
  });

  it('ignoriert Sentinel-Werte im Ausgangs-CSV beim Umschalten', () => {
    expect(toggleCsv('Alle,Action', 'Comedy')).toBe('Action,Comedy');
  });
});

describe('csvIncludes', () => {
  it('true wenn der Wert enthalten ist', () => {
    expect(csvIncludes('Action,Comedy', 'Comedy')).toBe(true);
  });

  it('false wenn der Wert fehlt oder CSV leer ist', () => {
    expect(csvIncludes('Action', 'Comedy')).toBe(false);
    expect(csvIncludes('', 'Action')).toBe(false);
    expect(csvIncludes(null, 'Action')).toBe(false);
  });

  it('ist case-sensitiv (im Gegensatz zu matchesAnyCsv)', () => {
    expect(csvIncludes('Action', 'action')).toBe(false);
  });
});

describe('matchesAnyCsv', () => {
  it('leere Auswahl → alles durchlassen (true)', () => {
    expect(matchesAnyCsv('', ['Action'])).toBe(true);
    expect(matchesAnyCsv(null, [])).toBe(true);
    expect(matchesAnyCsv('Alle', ['Action'])).toBe(true);
  });

  it('true bei ODER-Treffer (mindestens ein Item-Wert in der Auswahl)', () => {
    expect(matchesAnyCsv('Action,Drama', ['Comedy', 'Drama'])).toBe(true);
  });

  it('Vergleich ist case-insensitiv', () => {
    expect(matchesAnyCsv('action', ['ACTION'])).toBe(true);
    expect(matchesAnyCsv('Action', ['aCtIoN'])).toBe(true);
  });

  it('false wenn kein Item-Wert in der Auswahl liegt', () => {
    expect(matchesAnyCsv('Action', ['Comedy', 'Drama'])).toBe(false);
  });

  it('ignoriert null/undefined-Item-Werte', () => {
    expect(matchesAnyCsv('Action', [null, undefined, 'Action'])).toBe(true);
    expect(matchesAnyCsv('Action', [null, undefined])).toBe(false);
  });
});
