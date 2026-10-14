// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSwipeAxisLock } from './useSwipeAxisLock';

let area: HTMLDivElement;

const touch = (target: Element, type: 'touchstart' | 'touchmove', x: number, y: number) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', { value: [{ clientX: x, clientY: y }] });
  target.dispatchEvent(event);
  return event;
};

const lock = (enabled = true) => renderHook(() => useSwipeAxisLock({ current: area }, enabled));

describe('useSwipeAxisLock', () => {
  beforeEach(() => {
    area = document.createElement('div');
    document.body.appendChild(area);
  });

  afterEach(() => {
    cleanup();
    area.remove();
  });

  it('blocks scrolling for the rest of a sideways swipe', () => {
    lock();
    touch(area, 'touchstart', 100, 100);
    expect(touch(area, 'touchmove', 103, 101).defaultPrevented).toBe(false);
    expect(touch(area, 'touchmove', 120, 104).defaultPrevented).toBe(true);
    expect(touch(area, 'touchmove', 125, 160).defaultPrevented).toBe(true);
  });

  it('lets a vertical gesture scroll even when it drifts sideways later', () => {
    lock();
    touch(area, 'touchstart', 100, 100);
    expect(touch(area, 'touchmove', 102, 120).defaultPrevented).toBe(false);
    expect(touch(area, 'touchmove', 180, 125).defaultPrevented).toBe(false);
  });

  it('decides anew on every touch', () => {
    lock();
    touch(area, 'touchstart', 100, 100);
    touch(area, 'touchmove', 130, 100);
    touch(area, 'touchstart', 100, 100);
    expect(touch(area, 'touchmove', 100, 130).defaultPrevented).toBe(false);
  });

  it('leaves horizontal scrollers inside the area alone', () => {
    const rail = document.createElement('div');
    rail.style.overflowX = 'auto';
    Object.defineProperty(rail, 'scrollWidth', { value: 600 });
    Object.defineProperty(rail, 'clientWidth', { value: 300 });
    const chip = document.createElement('span');
    rail.appendChild(chip);
    area.appendChild(rail);
    lock();
    touch(chip, 'touchstart', 100, 100);
    expect(touch(chip, 'touchmove', 140, 100).defaultPrevented).toBe(false);
  });

  it('does nothing while disabled or after unmount', () => {
    const { rerender, unmount } = renderHook(({ on }) => useSwipeAxisLock({ current: area }, on), {
      initialProps: { on: false },
    });
    touch(area, 'touchstart', 100, 100);
    expect(touch(area, 'touchmove', 140, 100).defaultPrevented).toBe(false);
    rerender({ on: true });
    touch(area, 'touchstart', 100, 100);
    expect(touch(area, 'touchmove', 140, 100).defaultPrevented).toBe(true);
    unmount();
    touch(area, 'touchstart', 100, 100);
    expect(touch(area, 'touchmove', 140, 100).defaultPrevented).toBe(false);
  });
});
