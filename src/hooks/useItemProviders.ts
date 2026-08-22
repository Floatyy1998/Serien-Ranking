import { useEffect, useState } from 'react';
import {
  fetchItemProviderDetails,
  getCachedItemProviders,
  type ItemProvider,
  type ProviderItemType,
} from '../services/itemProviders';

/**
 * Provider-Logos eines Titels für Poster-Badges. Liefert bereits gecachte
 * Treffer synchron, sonst nach dem Laden.
 */
export function useItemProviders(
  type: ProviderItemType,
  id: number,
  enabled = true
): ItemProvider[] {
  const [providers, setProviders] = useState<ItemProvider[]>(
    () => (enabled ? getCachedItemProviders(type, id) : null) || []
  );

  useEffect(() => {
    if (!enabled) return;
    const cached = getCachedItemProviders(type, id);
    if (cached) {
      setProviders(cached);
      return;
    }
    let alive = true;
    void fetchItemProviderDetails(type, id).then((list) => {
      if (alive) setProviders(list);
    });
    return () => {
      alive = false;
    };
  }, [type, id, enabled]);

  return providers;
}
