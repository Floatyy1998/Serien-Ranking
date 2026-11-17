const DISCUSSION_HASH = '#discussion-';

export const discussionAnchorId = (discussionId: string): string => `discussion-${discussionId}`;

export const discussionIdFromHash = (hash: string): string | null =>
  hash.startsWith(DISCUSSION_HASH) ? hash.slice(DISCUSSION_HASH.length) || null : null;

/** Seite samt Sprungmarke zu einer Diskussion, aus den Daten einer Benachrichtigung. */
export function discussionTarget(data: Record<string, unknown> | undefined): string | undefined {
  if (!data) return undefined;
  const path = typeof data.discussionPath === 'string' ? data.discussionPath : '';
  const episode = /episode\/(\d+)_s(\d+)_e(\d+)/.exec(path);
  const item = /discussions\/(series|movie)\/(\d+)/.exec(path);
  const { itemType, itemId, seasonNumber, episodeNumber, discussionId } = data;

  let route: string | undefined;
  if (episode) route = `/episode/${episode[1]}/s/${episode[2]}/e/${episode[3]}`;
  else if (item) route = `/${item[1]}/${item[2]}`;
  else if (!itemId) route = undefined;
  else if (itemType === 'series' || itemType === 'movie') route = `/${itemType}/${String(itemId)}`;
  else if (itemType === 'episode' && seasonNumber != null && episodeNumber != null) {
    route = `/episode/${String(itemId)}/s/${String(seasonNumber)}/e/${String(episodeNumber)}`;
  }

  if (!route) return undefined;
  return typeof discussionId === 'string' && discussionId
    ? `${route}${DISCUSSION_HASH}${discussionId}`
    : route;
}
