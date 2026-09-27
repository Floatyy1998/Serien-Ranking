export type MediaTargetType = 'series' | 'movie';

export interface MediaTarget {
  type: MediaTargetType;
  id: number;
  title?: string;
  /** TMDB-Posterpfad oder volle Bild-URL */
  poster?: string | null;
}

/**
 * Markiert ein klickbares Element als Serie/Film. Der globale MediaActionsHost
 * öffnet darauf per langem Druck oder Rechtsklick das Aktions-Sheet.
 */
export function mediaTargetProps(target: {
  type: MediaTargetType | 'tv' | string;
  id: number | string | undefined | null;
  title?: string | null;
  poster?: string | null;
}): Record<string, string> {
  const id = Number(target.id);
  if (!Number.isFinite(id) || id <= 0) return {};
  const type = target.type === 'movie' ? 'movie' : 'series';
  const props: Record<string, string> = {
    'data-media-type': type,
    'data-media-id': String(id),
  };
  if (target.title) props['data-media-title'] = target.title;
  if (target.poster && !target.poster.startsWith('data:')) {
    props['data-media-poster'] = target.poster;
  }
  return props;
}

export function readMediaTarget(el: Element | null): MediaTarget | null {
  const host = el?.closest<HTMLElement>('[data-media-id]');
  if (!host || host.closest('[data-media-actions="off"]')) return null;
  const id = Number(host.dataset.mediaId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    type: host.dataset.mediaType === 'movie' ? 'movie' : 'series',
    id,
    title: host.dataset.mediaTitle || undefined,
    poster: host.dataset.mediaPoster || undefined,
  };
}
