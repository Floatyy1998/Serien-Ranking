export const BACKEND_BASE = import.meta.env.VITE_BACKEND_API_URL || 'https://api.tv-rank.de';

const LEGACY_BACKEND = 'https://serienapi.konrad-dinges.de/';

export function onCurrentBackend<T extends string | undefined>(url: T): T {
  return (
    url?.startsWith(LEGACY_BACKEND) ? `${BACKEND_BASE}/${url.slice(LEGACY_BACKEND.length)}` : url
  ) as T;
}
