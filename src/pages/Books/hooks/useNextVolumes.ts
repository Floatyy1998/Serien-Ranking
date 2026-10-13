import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { sortByRecentActivity } from '../../../lib/books/bookProgress';
import { seriesProgress, type SeriesProgress } from '../../../lib/books/bookSeries';
import { fetchBookLinks, fetchSeriesParts } from '../../../services/api/wikidataBooks';
import { updateBookFields } from '../../../services/books/bookService';
import type { Book, BookSeriesPart } from '../../../types/Book';

export type { SeriesProgress };

const MAX_LOOKUPS = 10;
const RECHECK_MS = 30 * 86_400_000;

/** Findet für gelesene Bücher die Reihe (Wikidata) und den nächsten Band, der noch fehlt. Nur lesend für fremde Bücher. */
export function useNextVolumes(books: Book[], now: number, options: { readOnly?: boolean } = {}) {
  const { readOnly = false } = options;
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
    if (candidates.length === 0 || (!readOnly && !uid)) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const seriesIds = new Set<string>();
      const names: Record<string, string> = {};
      let lookups = 0;
      for (const book of candidates) {
        const known = book.series?.wikidataId;
        if (known) {
          seriesIds.add(known);
          if (book.series?.name) names[known] = book.series.name;
        }
        if (readOnly || !uid) continue;
        const checkedAt = book.wdChecked ? new Date(book.wdChecked).getTime() : 0;
        const settled = known
          ? !!(book.series?.position || book.wikidataId)
          : Date.now() - checkedAt < RECHECK_MS;
        if (settled || lookups >= MAX_LOOKUPS) continue;
        lookups += 1;
        try {
          const links = await fetchBookLinks(book.title, book.authors?.[0]);
          if (!alive) return;
          const fields: Record<string, unknown> = known
            ? {}
            : { wdChecked: new Date().toISOString() };
          if (links.wikidataId && links.wikidataId !== book.wikidataId) {
            fields.wikidataId = links.wikidataId;
          }
          if (known) {
            if (links.series?.wikidataId === known && links.series.position && book.series) {
              fields.series = { ...book.series, position: links.series.position };
            }
          } else if (links.series?.wikidataId) {
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
          if (Object.keys(fields).length) await updateBookFields(uid, book.id, fields);
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
  }, [uid, candidateKey, readOnly]);

  const progress = useMemo(
    () => seriesProgress(books, partsBySeries, seriesNames, now),
    [partsBySeries, seriesNames, books, now]
  );

  return { progress, loading };
}
