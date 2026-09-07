import { describe, expect, it } from 'vitest';
import { effectiveWidth, widthStepFor } from './displayScale';

describe('effectiveWidth', () => {
  it('teilt die Fensterbreite durch den Zoom', () => {
    // 412px Gerät bei Anzeigegröße „Sehr groß" → nur 330px nutzbar
    expect(Math.round(effectiveWidth(412, 1.25))).toBe(330);
    expect(Math.round(effectiveWidth(360, 1.25))).toBe(288);
  });

  it('lässt die Breite ohne Zoom unverändert', () => {
    expect(effectiveWidth(412, 1)).toBe(412);
  });

  it('fällt bei unsinnigem Faktor auf die Fensterbreite zurück', () => {
    expect(effectiveWidth(412, 0)).toBe(412);
    expect(effectiveWidth(412, -1)).toBe(412);
  });
});

describe('widthStepFor', () => {
  it('stuft unter 360px als xs ein', () => {
    expect(widthStepFor(288)).toBe('xs');
    expect(widthStepFor(330)).toBe('xs');
    expect(widthStepFor(359)).toBe('xs');
  });

  it('stuft 360 bis unter 420 als sm ein', () => {
    expect(widthStepFor(360)).toBe('sm');
    expect(widthStepFor(412)).toBe('sm');
    expect(widthStepFor(419)).toBe('sm');
  });

  it('stuft ab 420px als md ein', () => {
    expect(widthStepFor(420)).toBe('md');
    expect(widthStepFor(1440)).toBe('md');
  });

  it('ein 412px-Gerät rutscht unter Zoom von sm nach xs', () => {
    expect(widthStepFor(effectiveWidth(412, 1))).toBe('sm');
    expect(widthStepFor(effectiveWidth(412, 1.25))).toBe('xs');
  });
});
