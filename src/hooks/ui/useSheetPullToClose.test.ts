// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { canPullSheet } from './useSheetPullToClose';

const build = (html: string) => {
  const sheet = document.createElement('div');
  sheet.innerHTML = html;
  document.body.appendChild(sheet);
  return sheet;
};

describe('canPullSheet', () => {
  it('zieht auf normalem Inhalt mit', () => {
    const sheet = build('<p><button id="b">Los</button></p>');
    expect(canPullSheet(sheet.querySelector('#b'), sheet)).toBe(true);
  });

  it('lässt Eingabefelder und Regler in Ruhe', () => {
    const sheet = build('<input id="i" type="range" /><textarea id="t"></textarea>');
    expect(canPullSheet(sheet.querySelector('#i'), sheet)).toBe(false);
    expect(canPullSheet(sheet.querySelector('#t'), sheet)).toBe(false);
  });

  it('scrollt einen nicht ganz oben stehenden Bereich zurück, statt zu ziehen', () => {
    const sheet = build('<div id="s" style="overflow-y:auto"><span id="x">x</span></div>');
    const scroller = sheet.querySelector('#s') as HTMLElement;
    Object.defineProperty(scroller, 'scrollHeight', { value: 800 });
    Object.defineProperty(scroller, 'clientHeight', { value: 300 });
    scroller.scrollTop = 120;
    expect(canPullSheet(sheet.querySelector('#x'), sheet)).toBe(false);
    scroller.scrollTop = 0;
    expect(canPullSheet(sheet.querySelector('#x'), sheet)).toBe(true);
  });
});
