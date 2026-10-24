/**
 * bulkMarkNudge – Tipp „ganze Staffel auf einmal abhaken", sobald jemand
 * mehrere Folgen derselben Staffel kurz hintereinander einzeln abhakt.
 * Höchstens MAX_NUDGES-mal pro Gerät; nach der ersten Sammelaktion nie wieder.
 */

import type { NavigateFunction } from 'react-router-dom';
import type { Series } from '../../types/Series';
import { filterBulkMarkable } from '../../lib/episode/releaseState';
import { showHintBanner } from '../../lib/interaction/toast';
import { t } from '../../services/i18n';

const STREAK_FOR_NUDGE = 5;
const STREAK_WINDOW_MS = 3 * 60_000;
const MIN_REMAINING = 2;
const MAX_NUDGES = 3;
const STORAGE_KEY = 'bulkMarkNudgeCount';

let streak: { key: string; count: number; last: number } | null = null;
const nudgedKeys = new Set<string>();

function readShownCount(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeShownCount(count: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(count));
  } catch {
    // ignore
  }
}

export function countRemainingMarkable(
  season: Series['seasons'][number] | undefined,
  justMarkedEpisodeId?: number
): number {
  return filterBulkMarkable(season?.episodes ?? []).filter(
    (ep) => !ep.watched && ep.id !== justMarkedEpisodeId
  ).length;
}

export function shouldNudgeBulkMark(
  seriesId: number,
  seasonIndex: number,
  remaining: number,
  now = Date.now()
): boolean {
  const key = `${seriesId}:${seasonIndex}`;
  const continues = streak && streak.key === key && now - streak.last <= STREAK_WINDOW_MS;
  streak = { key, count: continues && streak ? streak.count + 1 : 1, last: now };

  if (streak.count < STREAK_FOR_NUDGE || remaining < MIN_REMAINING) return false;
  if (nudgedKeys.has(key)) return false;
  const shown = readShownCount();
  if (shown >= MAX_NUDGES) return false;
  nudgedKeys.add(key);
  writeShownCount(shown + 1);
  return true;
}

export function noteBulkMarkUsed(): void {
  streak = null;
  writeShownCount(MAX_NUDGES);
}

export interface BulkHintState {
  bulkHintSeason: number;
}

/** Öffnet die Episodenübersicht mit vorausgewählter Staffel und hervorgehobenen Sammelaktionen. */
export function openSeasonTools(
  navigate: NavigateFunction,
  seriesId: number,
  seasonIndex: number
): void {
  const state: BulkHintState = { bulkHintSeason: seasonIndex };
  navigate(`/episodes/${seriesId}`, { state });
}

type NudgeAction = { onOpenSeasonTools: () => void } | { onMarkRest: () => void };

export function maybeShowBulkMarkNudge(
  params: { seriesId: number; seasonIndex: number; remaining: number } & NudgeAction
): void {
  if (!shouldNudgeBulkMark(params.seriesId, params.seasonIndex, params.remaining)) return;
  if ('onOpenSeasonTools' in params) {
    showHintBanner({
      title: t('Geht auch schneller'),
      text: t('In der Episodenübersicht hakst du ganze Staffeln auf einmal ab.'),
      actionLabel: t('Zur Übersicht'),
      onAction: params.onOpenSeasonTools,
    });
    return;
  }
  showHintBanner({
    title: t('Geht auch schneller'),
    text: t('Den Rest dieser Staffel kannst du auf einmal abhaken.'),
    actionLabel: t('Rest abhaken'),
    onAction: params.onMarkRest,
  });
}

export function resetBulkMarkNudge(): void {
  streak = null;
  nudgedKeys.clear();
  writeShownCount(0);
}
