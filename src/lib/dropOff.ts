/**
 * Aussteiger-Radar: wertet das anonyme Abbruch-Aggregat einer Serie aus.
 *
 * Quelle ist der Backend-Export `catalog/drop-off.json` — pro Serie die Zahl
 * der Nutzer mit Fortschritt, wie viele abgebrochen bzw. durch sind, und wo
 * die Abbrüche liegen. Einzelne Nutzer sind darin nicht mehr erkennbar.
 */

/** Ab so vielen Nutzern mit Entscheidung ist eine Aussage belastbar. */
export const MIN_DECIDED_USERS = 20;

/** Ab diesem Anteil gilt eine Serie ab Folge k als "durchgeschaut". */
const HOLD_THRESHOLD = 0.75;

/**
 * So viel muss die Quote gegenüber dem Start zulegen, damit der Punkt eine
 * Aussage ist. Ohne diese Schwelle wäre bei jeder Serie schon Folge 1 der
 * "Durchhaltepunkt" — dort ist die Quote per Definition die Gesamtquote.
 */
const MIN_HOLD_GAIN = 0.1;

/** Eine Ausstiegsstaffel muss so viel des Feldes kosten, um genannt zu werden. */
const NOTABLE_SEASON_SHARE = 0.2;

export interface DropOffEntry {
  /** Nutzer mit Fortschritt in dieser Serie. */
  n: number;
  /** Davon abgebrochen (kein Fortschritt mehr, nicht durch). */
  d: number;
  /** Davon durch (alle ausgestrahlten Folgen gesehen). */
  f: number;
  /** Abbrüche je Staffelnummer (1-basiert). */
  s: Record<string, number>;
  /** Abbrüche je Folge innerhalb Staffel 1 (1-basiert). */
  e: Record<string, number>;
}

export interface DropOffSeason {
  seasonNumber: number;
  quitters: number;
  /** Anteil an allen Nutzern mit Entscheidung. */
  share: number;
}

export interface HoldPoint {
  /** Folge in Staffel 1, ab der die Serie hält. */
  episodeNumber: number;
  /** Anteil der Erreicher dieser Folge, die zu Ende schauen. */
  completionAfter: number;
}

export interface DropOffInsight {
  shouldShow: boolean;
  /** Nutzer, die entschieden haben (abgebrochen oder durch). */
  decided: number;
  /** Anteil davon, der die Serie zu Ende geschaut hat. */
  completionRate: number;
  seasons: DropOffSeason[];
  /** Die Staffel, in der die meisten aussteigen — nur wenn sie heraussticht. */
  worstSeason: DropOffSeason | null;
  /** Der Punkt, ab dem die Serie ihr Publikum hält. Null, wenn sie es immer hält. */
  holdPoint: HoldPoint | null;
}

const empty: DropOffInsight = {
  shouldShow: false,
  decided: 0,
  completionRate: 0,
  seasons: [],
  worstSeason: null,
  holdPoint: null,
};

const toCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

/** Numerisch sortierte [nummer, anzahl]-Paare aus einer Zähl-Map. */
function sortedCounts(map: Record<string, number> | undefined): [number, number][] {
  if (!map) return [];
  return Object.entries(map)
    .map(([key, value]) => [Number(key), toCount(value)] as [number, number])
    .filter(([key, value]) => Number.isFinite(key) && key > 0 && value > 0)
    .sort((a, b) => a[0] - b[0]);
}

/**
 * Sucht die erste Folge in Staffel 1, ab der die Abschlussquote der
 * verbliebenen Zuschauer über die Schwelle steigt.
 */
function findHoldPoint(entry: DropOffEntry, decided: number, finished: number): HoldPoint | null {
  const perEpisode = sortedCounts(entry.e);
  if (perEpisode.length === 0 || decided <= 0) return null;

  const baseline = finished / decided;

  let quitBefore = 0;
  for (const [episodeNumber, quitters] of perEpisode) {
    const reached = decided - quitBefore;
    if (reached <= 0) break;
    const completionAfter = Math.min(1, finished / reached);
    if (completionAfter >= HOLD_THRESHOLD && completionAfter - baseline >= MIN_HOLD_GAIN) {
      return { episodeNumber, completionAfter };
    }
    quitBefore += quitters;
  }

  return null;
}

export function analyzeDropOff(entry: DropOffEntry | null | undefined): DropOffInsight {
  if (!entry) return empty;

  const quit = toCount(entry.d);
  const finished = toCount(entry.f);
  const decided = quit + finished;
  if (decided < MIN_DECIDED_USERS) return { ...empty, decided };

  const seasons: DropOffSeason[] = sortedCounts(entry.s).map(([seasonNumber, quitters]) => ({
    seasonNumber,
    quitters,
    share: quitters / decided,
  }));

  const strongest = seasons.reduce<DropOffSeason | null>(
    (best, season) => (!best || season.quitters > best.quitters ? season : best),
    null
  );
  const worstSeason =
    strongest && strongest.share >= NOTABLE_SEASON_SHARE && quit > 0 ? strongest : null;

  return {
    shouldShow: true,
    decided,
    completionRate: finished / decided,
    seasons,
    worstSeason,
    holdPoint: findHoldPoint(entry, decided, finished),
  };
}
