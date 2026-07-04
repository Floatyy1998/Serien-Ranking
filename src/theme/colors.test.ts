import { describe, expect, it } from 'vitest';
import { colors } from './colors';

describe('theme/colors', () => {
  it('exportiert die zentralen Farbgruppen', () => {
    expect(colors).toHaveProperty('primary');
    expect(colors).toHaveProperty('background');
    expect(colors).toHaveProperty('text');
    expect(colors).toHaveProperty('status');
    expect(colors).toHaveProperty('border');
    expect(colors).toHaveProperty('overlay');
    expect(colors).toHaveProperty('shadow');
    expect(colors).toHaveProperty('button');
  });

  it('primäre Farben nutzen CSS-Custom-Properties mit Fallback', () => {
    expect(colors.primary).toContain('var(--theme-primary');
    expect(colors.primary).toContain('#00d123');
  });

  it('Default-Theme ist Grün/Schwarz', () => {
    expect(colors.primary).toContain('#00d123');
    expect(colors.background.default).toContain('#000000');
  });

  it('Statusfarben sind gültige Hex- oder Gradient-Werte', () => {
    expect(colors.status.error).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colors.status.success).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colors.status.warning).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(colors.status.info.gradient).toContain('linear-gradient');
  });

  it('Text-Farben decken primary/secondary/muted/accent ab', () => {
    expect(colors.text.primary).toContain('--color-text-primary');
    expect(colors.text.secondary).toContain('--color-text-secondary');
    expect(colors.text.muted).toContain('--color-text-muted');
    expect(colors.text.accent).toContain('--color-text-accent');
  });

  it('background.gradient bietet dark/light-Varianten als Gradienten', () => {
    expect(colors.background.gradient.dark).toContain('linear-gradient');
    expect(colors.background.gradient.light).toContain('linear-gradient');
  });
});
