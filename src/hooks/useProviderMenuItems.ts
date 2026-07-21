import { useEffect, useState } from 'react';
import { providerMenuItems } from '../config/menuItems';
import { fetchRegionProviderNames } from '../services/staticCatalog';
import { watchRegion } from '../services/region';

// Kurze Anzeige-Labels für bekannte kanonische Provider-Namen; unbekannte
// Provider (andere Regionen) werden mit ihrem Namen angezeigt.
const LABELS: Record<string, string> = Object.fromEntries(
  providerMenuItems.map((p) => [p.value, p.label])
);

/** Maximale Anzahl Provider-Chips (häufigste zuerst) — sonst explodiert das Grid. */
const MAX_PROVIDERS = 14;

/**
 * Provider-Filterliste passend zur Watch-Region: In DE die kuratierte
 * Standard-Liste, sonst dynamisch die in der Region tatsächlich vorkommenden
 * Anbieter aus dem Region-Overlay (nach Häufigkeit, inkl. „Alle"-Option).
 */
export function useProviderMenuItems(): { value: string; label: string }[] {
  const [items, setItems] = useState(providerMenuItems);

  useEffect(() => {
    if (watchRegion === 'DE') return;
    let cancelled = false;
    fetchRegionProviderNames()
      .then((names) => {
        if (cancelled || !names || names.length === 0) return;
        setItems([
          { value: 'All', label: 'Alle' },
          ...names.slice(0, MAX_PROVIDERS).map((name) => ({
            value: name,
            label: LABELS[name] || name,
          })),
        ]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return items;
}
