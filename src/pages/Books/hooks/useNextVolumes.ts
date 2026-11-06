import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { sortByRecentActivity } from '../../../lib/books/bookProgress';
import {
  adoptSeries,
  needsHardcoverSeries,
  partPositionOf,
  seriesProgress,
  type SeriesProgress,
} from '../../../lib/books/bookSeries';
import { hardcoverBook, hardcoverIsbn } from '../../../services/api/hardcoverApi';
import { fetchBookLinks, fetchSeriesParts } from '../../../services/api/wikidataBooks';
import { updateBookFields } from '../../../services/books/bookService';
import type { Book, BookSeriesInfo, BookSeriesPart } from '../../../types/Book';

export type { SeriesProgress };

const MAX_LOOKUPS = 10;
const RECHECK_MS = 30 * 86_400_000;

/** Reihe laut Hardcover; `null` = Hardcover kennt keine, `undefined` = nicht erreichbar (beim nächsten Besuch erneut). */
async function hardcoverSeriesOf(book: Book): Promise<BookSeriesInfo | null | undefined> {
  try {
    const hit = book.hardcoverId
      ? (await hardcoverBook(book.hardcoverId))?.result
      : book.isbn13
        ? await hardcoverIsbn(book.isbn13)
        : null;
    return hit?.series?.wikidataId ? hit.series : null;
  } catch {
    return undefined;
  }
}

/** Findet für gelesene Bücher die Reihe (Hardcover, Wikidata) und den nächsten Band, der noch fehlt. Nur lesend für fremde Bücher. */
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
      const names: Record<string, string> = {};
      const next: Record<string, BookSeriesPart[]> = {};
      const loadParts = async (id: string) => {
        if (!(id in next)) next[id] = await fetchSeriesParts(id).catch(() => []);
        return next[id];
      };
      for (const book of candidates) {
        const known = book.series?.wikidataId;
        if (!known) continue;
        if (book.series?.name) names[known] = book.series.name;
        await loadParts(known);
        if (!alive) return;
      }
      let lookups = 0;
      for (const book of candidates) {
        if (readOnly || !uid || lookups >= MAX_LOOKUPS) break;
        const known = book.series?.wikidataId;
        const knownParts = known ? next[known] : [];
        const placed = !!known && partPositionOf(book, knownParts, known) !== undefined;
        // Deutsche DNB-Reihennamen und -Titel kennt Hardcover nicht — das Buch selbst über ID/ISBN nachschlagen.
        if (needsHardcoverSeries(book, knownParts.length, placed, Date.now())) {
          lookups += 1;
          const found = await hardcoverSeriesOf(book);
          if (!alive) return;
          if (found !== undefined) {
            const fields: Record<string, unknown> = { seriesChecked: new Date().toISOString() };
            if (found && found.wikidataId === known && found.position && !placed) {
              fields.series = adoptSeries(book.series, found);
            } else if (found?.wikidataId && found.wikidataId !== known) {
              const parts = await loadParts(found.wikidataId);
              if (!alive) return;
              if (parts.length >= 2) {
                const series = adoptSeries(book.series, found);
                fields.series = series;
                names[found.wikidataId] = series.name;
              }
            }
            await updateBookFields(uid, book.id, fields).catch(() => undefined);
            if (fields.series) continue;
          }
        }
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
            if (links.series.name) names[links.series.wikidataId] = links.series.name;
            await loadParts(links.series.wikidataId);
            if (!alive) return;
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
