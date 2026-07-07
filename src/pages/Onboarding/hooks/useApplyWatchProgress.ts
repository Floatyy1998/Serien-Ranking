import { useCallback } from 'react';
import { dbUpdate, paths } from '../../../services/db/ref';
import { useAuth } from '../../../contexts/AuthContext';
import { fetchStaticCatalogSeasons } from '../../../services/staticCatalog';
import type { CatalogSeason } from '../../../types/CatalogTypes';

/**
 * Markiert "Up to and including episode (seasonIdx, epIdx)" via Catalog-IDs.
 * Bedeutung: alle Episoden bis einschliesslich diesem Index gelten als gesehen.
 * `total`: Gesamte Serie als gesehen.
 */
export type WatchTarget =
  | { kind: 'none' }
  | { kind: 'upToEpisode'; seasonIdx: number; episodeIdx: number }
  | { kind: 'total' };

interface ApplyTargets {
  [tmdbId: number]: WatchTarget;
}

/**
 * Wartet bis catalog/seasons/{tmdbId} verfuegbar ist (Backend hat die Serie
 * im Catalog erfasst). Pollt mit exponentiellem Backoff bis max 30s.
 */
async function waitForCatalogSeasons(
  tmdbId: number,
  signal?: { aborted: boolean }
): Promise<Record<string, CatalogSeason> | null> {
  const maxWaitMs = 30_000;
  const start = Date.now();
  let delay = 500;
  while (Date.now() - start < maxWaitMs) {
    if (signal?.aborted) return null;
    const seasons = await fetchStaticCatalogSeasons(tmdbId);
    if (seasons && Object.keys(seasons).length > 0) return seasons;
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 3000);
  }
  return null;
}

function sortedSeasons(seasons: Record<string, CatalogSeason>): CatalogSeason[] {
  return Object.entries(seasons)
    .map(([k, v]) => ({ key: Number(k), season: v }))
    .filter((e) => !Number.isNaN(e.key))
    .sort((a, b) => a.key - b.key)
    .map((e) => e.season);
}

export function useApplyWatchProgress() {
  const { user } = useAuth() || {};

  return useCallback(
    async (
      targets: ApplyTargets,
      onProgress?: (done: number, total: number) => void
    ): Promise<void> => {
      const uid = user?.uid;
      if (!uid) return;
      const entries = Object.entries(targets)
        .map(([id, t]) => ({ tmdbId: Number(id), target: t }))
        .filter((e) => e.target.kind !== 'none' && !Number.isNaN(e.tmdbId));
      const total = entries.length;
      if (total === 0) return;

      let done = 0;
      const now = Math.floor(Date.now() / 1000);

      await Promise.all(
        entries.map(async ({ tmdbId, target }) => {
          try {
            const seasons = await waitForCatalogSeasons(tmdbId);
            if (!seasons) return;
            const ordered = sortedSeasons(seasons);
            if (ordered.length === 0) return;

            // Welche Episoden sind "gesehen"?
            const watchedEpIds: { sIdx: number; epId: number }[] = [];
            if (target.kind === 'total') {
              ordered.forEach((s, sIdx) => {
                for (const ep of s.episodes || []) {
                  if (typeof ep.id === 'number') watchedEpIds.push({ sIdx, epId: ep.id });
                }
              });
            } else if (target.kind === 'upToEpisode') {
              const stopSeasonIdx = Math.min(target.seasonIdx, ordered.length - 1);
              for (let sIdx = 0; sIdx <= stopSeasonIdx; sIdx++) {
                const eps = ordered[sIdx].episodes || [];
                const stopEpIdx =
                  sIdx === stopSeasonIdx
                    ? Math.min(target.episodeIdx, eps.length - 1)
                    : eps.length - 1;
                for (let eIdx = 0; eIdx <= stopEpIdx; eIdx++) {
                  const ep = eps[eIdx];
                  if (typeof ep?.id === 'number') watchedEpIds.push({ sIdx, epId: ep.id });
                }
              }
            }

            if (watchedEpIds.length === 0) return;

            // Aufbau: seasons/{sIdx}/eps/{epId}: { w, c, f, l }
            const seasonsObj: Record<
              string,
              { eps: Record<string, { w: 1; c: 1; f: number; l: number }> }
            > = {};
            for (const { sIdx, epId } of watchedEpIds) {
              const key = String(sIdx);
              if (!seasonsObj[key]) seasonsObj[key] = { eps: {} };
              seasonsObj[key].eps[String(epId)] = { w: 1, c: 1, f: now, l: now };
            }

            const shouldStayOnWatchlist = target.kind !== 'total';
            const updates: Record<string, unknown> = {};
            updates[`${paths.seriesWatchItem(uid, tmdbId)}/seasons`] = seasonsObj;
            updates[`${paths.seriesItem(uid, tmdbId)}/watchlist`] = shouldStayOnWatchlist;
            await dbUpdate(updates);
          } catch (err) {
            console.warn(`[onboarding] applyWatchProgress failed for ${tmdbId}`, err);
          } finally {
            done++;
            onProgress?.(done, total);
          }
        })
      );
    },
    [user?.uid]
  );
}
