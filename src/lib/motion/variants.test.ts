import { describe, expect, it } from 'vitest';
import type { Variants } from 'framer-motion';
import {
  staggerContainer,
  staggerItem,
  staggerContainerFast,
  staggerItemFast,
  scaleIn,
  fadeIn,
  tapScale,
  tapScaleSmall,
  tapScaleTight,
  scaleButton,
} from './variants';

const asRecord = (v: Variants[keyof Variants]) => v as Record<string, unknown>;

describe('motion/variants', () => {
  it('alle Varianten definieren hidden + visible', () => {
    const variants: Variants[] = [
      staggerContainer,
      staggerItem,
      staggerContainerFast,
      staggerItemFast,
      scaleIn,
      fadeIn,
      scaleButton,
    ];
    for (const v of variants) {
      expect(v).toHaveProperty('hidden');
      expect(v).toHaveProperty('visible');
    }
  });

  it('Container starten unsichtbar und werden sichtbar', () => {
    expect(asRecord(staggerContainer.hidden).opacity).toBe(0);
    expect(asRecord(staggerContainer.visible).opacity).toBe(1);
    expect(asRecord(staggerContainerFast.visible).opacity).toBe(1);
  });

  it('Fast-Container staggert schneller als der Standard-Container', () => {
    const std = asRecord(staggerContainer.visible).transition as Record<string, number>;
    const fast = asRecord(staggerContainerFast.visible).transition as Record<string, number>;
    expect(fast.staggerChildren).toBeLessThan(std.staggerChildren);
  });

  it('staggerItem entfernt Blur/Offset im visible-State', () => {
    expect(asRecord(staggerItem.hidden).filter).toBe('blur(6px)');
    expect(asRecord(staggerItem.visible).filter).toBe('blur(0px)');
    expect(asRecord(staggerItem.visible).y).toBe(0);
  });

  it('scaleIn und fadeIn definieren einen exit-State', () => {
    expect(scaleIn).toHaveProperty('exit');
    expect(fadeIn).toHaveProperty('exit');
    expect(asRecord(scaleIn.hidden).scale).toBe(0.9);
    expect(asRecord(scaleIn.visible).scale).toBe(1);
  });

  it('tap-Presets sind absteigend skaliert', () => {
    expect(tapScaleSmall.scale).toBe(0.98);
    expect(tapScale.scale).toBe(0.96);
    expect(tapScaleTight.scale).toBe(0.92);
    expect(tapScaleTight.scale).toBeLessThan(tapScale.scale);
    expect(tapScale.scale).toBeLessThan(tapScaleSmall.scale);
  });
});
