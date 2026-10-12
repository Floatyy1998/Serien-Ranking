import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookMatchKey } from '../../../lib/books/bookIdentity';
import { sortByRecentActivity } from '../../../lib/books/bookProgress';
import { findNextVolume, type NextVolume } from '../../../lib/books/bookSeries';
import { fetchBookLinks, fetchSeriesParts } from '../../../services/api/wikidataBooks';
import { updateBookFields } from '../../../services/books/bookService';
import type { Book, BookSeriesPart } from '../../../types/Book';

export interface SeriesProgress {
  seriesId: string;
  seriesName: string;
  author?: string;
  next: NextVolume;
  ownedCount: number;
  total: number;
  books: Book[];
}

const MAX_LOOKUPS = 10;
const RECHECK_MS = 30 * 86_400_000;

const titleBase = (title: string, authors?: string[]) => bookMatchKey(title, authors).split('|')[0];

/** Position eines eigenen Buchs in der Reihe: gespeichert oder über den Titel gefunden. */
function positionOf(book: Book, parts: BookSeriesPart[]): number | undefined {
  if (book.series?.position) return book.series.position;
  const base = titleBase(book.title, book.authors);
  return parts.find((p) => titleBase(p.title) === base)?.position;
}

/** Findet für gelesene Bücher die Reihe (Wikidata) und den nächsten Band, der dir noch fehlt. */
export function useNextVolumes(books: Book[], now: number) {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [partsBySeries, setPartsBySeries] = useState<Record<string, BookSeriesPart[]>>({});
  const [seriesNames, setSeriesNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const candidates = useMemo(
    () =>
      sortByRecentActivity(
        books.filter((b) => b.status === 'completed' || b.status === 'reading')
      ).slice(0, 24),
    [books]
  );
  const candidateKey = candidates.map((b) => `${b.id}:${b.series?.wikidataId ?? ''}`).join(',');

  useEffect(() => {
    if (!uid || candidates.length === 0) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const seriesIds = new Set<string>();
      const names: Record<string, string> = {};
      let lookups = 0;
      for (const book of candidates) {
        if (book.series?.wikidataId) {
          seriesIds.add(book.series.wikidataId);
          if (book.series.name) names[book.series.wikidataId] = book.series.name;
          continue;
        }
        const checkedAt = book.wdChecked ? new Date(book.wdChecked).getTime() : 0;
        if (Date.now() - checkedAt < RECHECK_MS || lookups >= MAX_LOOKUPS) continue;
        lookups += 1;
        try {
          const links = await fetchBookLinks(book.title, book.authors?.[0]);
          if (!alive) return;
          const fields: Record<string, unknown> = { wdChecked: new Date().toISOString() };
          if (links.series?.wikidataId) {
            seriesIds.add(links.series.wikidataId);
            if (links.series.name) names[links.series.wikidataId] = links.series.name;
            fields.series = {
              name: links.series.name || book.series?.name || '',
              wikidataId: links.series.wikidataId,
              ...(links.series.position || book.series?.position
                ? { position: links.series.position ?? book.series?.position }
                : {}),
            };
          }
          await updateBookFields(uid, book.id, fields);
        } catch {
          /* Wikidata nicht erreichbar — beim nächsten Besuch erneut */
        }
      }
      const next: Record<string, BookSeriesPart[]> = {};
      for (const id of seriesIds) {
        next[id] = await fetchSeriesParts(id).catch(() => []);
        if (!alive) return;
      }
      setPartsBySeries(next);
      setSeriesNames(names);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, candidateKey]);

  const progress = useMemo(() => {
    const out: SeriesProgress[] = [];
    for (const [seriesId, parts] of Object.entries(partsBySeries)) {
      if (parts.length < 2) continue;
      const inSeries = books.filter(
        (b) =>
          b.series?.wikidataId === seriesId ||
          parts.some((p) => titleBase(p.title) === titleBase(b.title, b.authors))
      );
      const readPositions = inSeries
        .filter((b) => b.status === 'completed')
        .map((b) => positionOf(b, parts))
        .filter((p): p is number => !!p);
      if (!readPositions.length) continue;
      const next = findNextVolume(parts, readPositions, now);
      if (!next) continue;
      const owned = inSeries.some(
        (b) => positionOf(b, parts) === next.part.position && b.status !== 'planned'
      );
      if (owned) continue;
      const sample = inSeries[0];
      out.push({
        seriesId,
        seriesName: seriesNames[seriesId] || sample?.series?.name || '',
        author: sample?.authors?.[0],
        next,
        ownedCount: readPositions.length,
        total: parts.length,
        books: inSeries,
      });
    }
    return out.sort((a, b) => (a.next.daysUntil ?? -1) - (b.next.daysUntil ?? -1));
  }, [partsBySeries, seriesNames, books, now]);

  return { progress, loading };
}
