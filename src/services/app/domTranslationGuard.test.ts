// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installDomTranslationGuard } from './domTranslationGuard';

const originalRemoveChild = Node.prototype.removeChild;
const originalInsertBefore = Node.prototype.insertBefore;

function translate(parent: HTMLElement, text: Text): HTMLElement {
  const font = document.createElement('font');
  font.textContent = 'translated';
  parent.replaceChild(font, text);
  return font;
}

describe('installDomTranslationGuard', () => {
  beforeEach(() => {
    installDomTranslationGuard();
  });

  afterEach(() => {
    Node.prototype.removeChild = originalRemoveChild;
    Node.prototype.insertBefore = originalInsertBefore;
  });

  it('fügt vor einem ausgetauschten Textknoten ein, statt zu werfen', () => {
    const button = document.createElement('button');
    const label = document.createTextNode('Oct');
    button.appendChild(label);
    translate(button, label);

    const indicator = document.createElement('div');
    expect(() => button.insertBefore(indicator, label)).not.toThrow();
    expect(indicator.parentNode).toBe(button);
  });

  it('nimmt den Vorfahren als Anker, wenn der Knoten nur eingewickelt wurde', () => {
    const button = document.createElement('button');
    const label = document.createTextNode('Oct');
    button.appendChild(label);
    const font = document.createElement('font');
    button.replaceChild(font, label);
    font.appendChild(label);

    const indicator = document.createElement('div');
    button.insertBefore(indicator, label);
    expect(button.firstChild).toBe(indicator);
    expect(indicator.nextSibling).toBe(font);
  });

  it('ignoriert removeChild für abgehängte Knoten', () => {
    const button = document.createElement('button');
    const label = document.createTextNode('Oct');
    button.appendChild(label);
    translate(button, label);

    expect(() => button.removeChild(label)).not.toThrow();
    expect(button.childNodes).toHaveLength(1);
  });

  it('entfernt eingewickelte Nachfahren aus ihrem echten Elternknoten', () => {
    const button = document.createElement('button');
    const font = document.createElement('font');
    const label = document.createTextNode('Oct');
    font.appendChild(label);
    button.appendChild(font);

    button.removeChild(label);
    expect(label.parentNode).toBeNull();
  });

  it('lässt normale Aufrufe unverändert', () => {
    const list = document.createElement('ul');
    const a = document.createElement('li');
    const b = document.createElement('li');
    list.appendChild(b);
    list.insertBefore(a, b);
    expect([...list.childNodes]).toEqual([a, b]);
    list.removeChild(a);
    expect([...list.childNodes]).toEqual([b]);
  });
});
