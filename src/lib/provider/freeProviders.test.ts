import { describe, expect, it } from 'vitest';
import {
  FREE_PROVIDERS,
  SUBSCRIPTION_PROVIDERS,
  SUPPORTED_PROVIDERS,
} from '../../config/menuItems';
import { withFreeProviders } from './freeProviders';

describe('withFreeProviders', () => {
  it('ergänzt YouTube, sobald ein echtes Abo aktiv ist', () => {
    const out = withFreeProviders(new Set(['Netflix']));
    expect(out.has('Netflix')).toBe(true);
    expect(out.has('YouTube')).toBe(true);
    expect(out.has('YouTube Premium')).toBe(false);
  });

  it('lässt ein leeres Set leer, damit „keine Abos“ erhalten bleibt', () => {
    const empty = new Set<string>();
    expect(withFreeProviders(empty)).toBe(empty);
    expect(withFreeProviders(empty).size).toBe(0);
  });
});

describe('FREE_PROVIDERS / SUBSCRIPTION_PROVIDERS', () => {
  it('freie Dienste sind unterstützt, aber kein Abo', () => {
    for (const name of FREE_PROVIDERS) {
      expect(SUPPORTED_PROVIDERS.has(name)).toBe(true);
      expect(SUBSCRIPTION_PROVIDERS.has(name)).toBe(false);
    }
    expect(SUBSCRIPTION_PROVIDERS.has('YouTube Premium')).toBe(true);
    expect(SUBSCRIPTION_PROVIDERS.size + FREE_PROVIDERS.size).toBe(SUPPORTED_PROVIDERS.size);
  });
});
