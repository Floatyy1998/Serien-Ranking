/** Admin-Prüfung von Crossover-Einreichungen: JSON-Export mit Katalogabgleich + Admin-Meldung. */
import { ADMIN_UID } from '../../config/admin';
import type { CatalogEpisode, CatalogSeason } from '../../types/CatalogTypes';
import type { CrossoverEntry, CrossoverPart } from '../../types/Crossover';
import { fetchCatalogEpisodeNames, fetchStaticCatalogSeasons } from '../catalog/staticCatalog';
import { dbRef, userPath } from '../db/ref';
import { fetchPublicUserFields } from '../firebase/userDisplayData';
import { queuePush } from '../notifications/pushQueue';

type EnNames = Record<string, (string | undefined)[]>;

interface ReviewEpisode {
  folge: number;
  titel: string | null;
  titelEn: string | null;
  ausstrahlung: string | null;
}

const isoOrNull = (ts?: number) => (ts ? new Date(ts).toISOString() : null);

const episodeNumber = (ep: CatalogEpisode, idx: number) => ep.episodeNumber ?? idx + 1;

function describeEpisode(
  ep: CatalogEpisode,
  idx: number,
  enSeason: (string | undefined)[] | undefined
): ReviewEpisode {
  const nr = episodeNumber(ep, idx);
  return {
    folge: nr,
    titel: ep.name || null,
    titelEn: enSeason?.[nr - 1] || null,
    ausstrahlung: ep.airstamp || ep.airDate || null,
  };
}

interface ReviewedPart {
  data: Record<string, unknown>;
  /** null = Teil ohne Folge (ganze Staffel/Serie). */
  found: boolean | null;
  airDate: string | null;
}

function reviewPart(
  part: CrossoverPart,
  index: number,
  seasons: Record<string, CatalogSeason> | null,
  en: EnNames | undefined
): ReviewedPart {
  const found = part.e === undefined ? null : false;
  const base = {
    teil: index + 1,
    serie: {
      tmdbId: part.id,
      titel: part.t,
      tmdb: `https://www.themoviedb.org/tv/${part.id}`,
      imKatalog: !!seasons,
      staffelnImKatalog: seasons ? Object.keys(seasons).length : null,
    },
    staffel: part.s ?? null,
    folge: part.e ?? null,
    folgentitelImEintrag: part.n ?? null,
  };
  if (!seasons || part.s === undefined) return { data: base, found, airDate: null };

  const season = seasons[String(part.s - 1)];
  if (!season)
    return { data: { ...base, katalog: { staffelGefunden: false } }, found, airDate: null };
  const episodes = Array.isArray(season.episodes) ? season.episodes : [];
  const enSeason = en?.[String(part.s)];

  if (part.e === undefined) {
    const first = episodes[0];
    const last = episodes[episodes.length - 1];
    const firstInfo = first ? describeEpisode(first, 0, enSeason) : null;
    return {
      data: {
        ...base,
        katalog: {
          staffelGefunden: true,
          folgenInStaffel: episodes.length,
          ersteFolge: firstInfo,
          letzteFolge: last ? describeEpisode(last, episodes.length - 1, enSeason) : null,
        },
      },
      found,
      airDate: firstInfo?.ausstrahlung ?? null,
    };
  }

  const pos = episodes.findIndex((ep, idx) => ep && episodeNumber(ep, idx) === part.e);
  const hit = pos >= 0 ? describeEpisode(episodes[pos], pos, enSeason) : null;
  const neighbour = (i: number) =>
    i >= 0 && i < episodes.length && episodes[i] ? describeEpisode(episodes[i], i, enSeason) : null;
  return {
    data: {
      ...base,
      katalog: {
        staffelGefunden: true,
        folgenInStaffel: episodes.length,
        folgeGefunden: !!hit,
        ...hit,
        titelStimmtMitEintrag: hit && part.n ? hit.titel === part.n : null,
        vorherigeFolge: neighbour(pos - 1),
        naechsteFolge: neighbour(pos + 1),
      },
    },
    found: !!hit,
    airDate: hit?.ausstrahlung ?? null,
  };
}

/** Alles, was zur Prüfung einer Einreichung nötig ist, als formatiertes JSON. */
export async function buildCrossoverReviewJson(id: string, entry: CrossoverEntry): Promise<string> {
  const ids = [...new Set(entry.parts.map((p) => p.id))];
  const [seasonList, enNames, submitter] = await Promise.all([
    Promise.all(ids.map((sid) => fetchStaticCatalogSeasons(sid).catch(() => null))),
    fetchCatalogEpisodeNames('en'),
    fetchPublicUserFields(entry.createdBy),
  ]);
  const seasonsById = new Map(ids.map((sid, i) => [sid, seasonList[i]]));

  const reviewed = entry.parts.map((part, i) =>
    reviewPart(part, i, seasonsById.get(part.id) ?? null, enNames?.[String(part.id)])
  );
  const dates = reviewed.map((r) => r.airDate);
  const known = dates.filter((d): d is string => !!d);

  return JSON.stringify(
    {
      id,
      titel: entry.title,
      art: entry.kind,
      jahr: entry.year ?? null,
      franchise: entry.franchise ?? null,
      hinweis: entry.note ?? null,
      status: entry.status ?? 'approved',
      quelle: entry.source ?? null,
      eingereichtVon: {
        uid: entry.createdBy,
        name: submitter.displayName || submitter.username || null,
      },
      eingereichtAm: isoOrNull(entry.createdAt),
      geaendertAm: isoOrNull(entry.updatedAt),
      hinweisZuPositionen:
        'staffel/folge sind App-Positionen (Staffel-Key + 1, Folgen-Index + 1), keine TMDB-Nummern',
      teile: reviewed.map((r) => r.data),
      automatischePruefung: {
        alleFolgenGefunden: reviewed.every((r) => r.found !== false),
        reihenfolgeNachSendedatum:
          known.length === dates.length && known.length > 1
            ? known.every((d, i) => i === 0 || new Date(known[i - 1]) <= new Date(d))
            : null,
      },
    },
    null,
    2
  );
}

/** Meldet dem Admin eine neue oder geänderte Einreichung (Glocke + Push). */
export async function notifyAdminCrossoverSubmitted(
  id: string,
  entry: CrossoverEntry,
  submitterName: string,
  isNew: boolean
): Promise<void> {
  const title = isNew ? 'Neues Crossover eingereicht' : 'Crossover-Einreichung geändert';
  const parts = entry.parts
    .map((p) => (p.s !== undefined ? `${p.t} S${p.s}${p.e !== undefined ? ` E${p.e}` : ''}` : p.t))
    .join(' → ');
  const message = `${submitterName}: „${entry.title}“ (${parts})`;
  const url = '/admin?tab=crossovers';
  await dbRef(userPath(ADMIN_UID, 'notifications'))
    .push({
      type: 'crossover_submitted',
      title,
      message: message.slice(0, 2000),
      data: { crossoverId: id, navigateTo: url },
      timestamp: Date.now(),
      read: false,
    })
    .catch(() => {});
  void queuePush(ADMIN_UID, { title, body: message, url });
}
