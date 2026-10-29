import { FREE_PROVIDERS } from '../../config/menuItems';

// Nur bei mindestens einem echten Abo: viele Stellen lesen `size > 0` als „hat Abos“
export function withFreeProviders(active: Set<string>): Set<string> {
  if (active.size === 0) return active;
  const out = new Set(active);
  for (const name of FREE_PROVIDERS) out.add(name);
  return out;
}
