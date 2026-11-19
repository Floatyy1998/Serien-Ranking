import { describe, expect, it } from 'vitest';
import { isTestRun } from './testRun';

const PHONE_UA =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Mobile Safari/537.36';
const HEADLESS_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/158.0.0.0 Safari/537.36';

describe('isTestRun', () => {
  it('lässt die Live-Seite im normalen Browser durch', () => {
    expect(isTestRun({ protocol: 'https:', userAgent: PHONE_UA, webdriver: false })).toBe(false);
  });

  it('lässt die iOS-Hülle mit eigenem Schema durch', () => {
    expect(isTestRun({ protocol: 'capacitor:', userAgent: PHONE_UA, webdriver: false })).toBe(
      false
    );
  });

  it('erkennt den lokalen Build an http', () => {
    expect(isTestRun({ protocol: 'http:', userAgent: PHONE_UA, webdriver: false })).toBe(true);
  });

  it('erkennt Headless-Chrome auch auf der Live-Seite', () => {
    expect(isTestRun({ protocol: 'https:', userAgent: HEADLESS_UA, webdriver: false })).toBe(true);
  });

  it('erkennt ferngesteuerte Browser mit getarntem User-Agent', () => {
    expect(isTestRun({ protocol: 'https:', userAgent: PHONE_UA, webdriver: true })).toBe(true);
  });

  it('erkennt Lighthouse', () => {
    expect(
      isTestRun({
        protocol: 'https:',
        userAgent: `${PHONE_UA} Chrome-Lighthouse`,
        webdriver: false,
      })
    ).toBe(true);
  });
});
