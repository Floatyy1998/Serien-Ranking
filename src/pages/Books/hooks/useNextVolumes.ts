import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { sortByRecentActivity } from '../../../lib/books/bookProgress';
import {
  adoptSeries,
  fitsSeries,
  needsSeriesLookup,
  seriesCheckedFields,
  seriesProgress,
  type SeriesProgress,
} from '../../../lib/books/bookSeries';
import { dnbSeriesByTitle, dnbSeriesOf } from '../../../services/api/booksApi';
import { hardcoverBook, hardcoverIsbn } from '../../../services/api/hardcoverApi';
import { catalogSeriesOf } from '../../../services/catalog/bookSeriesCatalog';
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

/** Reihe laut DNB (Feld 490 oder Bandnummer im Titel) — kennt deutsche Ausgaben, auch Manga. */
async function dnbSeriesOfBook(book: Book): Promise<BookSeriesInfo | null | undefined> {
  if (!book.isbn13) return null;
  try {
    return await dnbSeriesOf(book.isbn13);
  } catch {
    return undefined;
  }
}

/**
 * Reihe laut Bücher-Katalog (Nachtlauf) — kostet nur den ohnehin geladenen Index. Kennt er keine, fragen
 * Hardcover und DNB live; das zählt erst dann als geprüft.
 */
async function catalogSeriesOfBook(book: Book): Promise<BookSeriesInfo | undefined> {
  return (await catalogSeriesOf(book.id).catch(() => undefined)) ?? undefined;
}

/** Zuletzt über den Titel („Bungo Stray Dogs 01"), wenn keine Quelle die ISBN kennt. */
async function dnbTitleSeriesOf(book: Book): Promise<BookSeriesInfo | null | undefined> {
  try {
    return await dnbSeriesByTitle(book);
  } catch {
    return undefined;
  }
}

const SERIES_SOURCES = [catalogSeriesOfBook, hardcoverSeriesOf, dnbSeriesOfBook, dnbTitleSeriesOf];

/** Findet für gelesene Bücher die Reihe (Hardcover, DNB, Wikidata) und den nächsten Band, der noch fehlt. Nur lesend für fremde Bücher. */
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
        const placed = !!known && fitsSeries(book, knownParts, known);
        // Eine Reihe mit Bänden, in die das Buch nicht passt, ist falsch zugeordnet: Name und Band nicht übernehmen.
        const own = knownParts.length >= 2 && !placed ? undefined : book.series;
        // Deutsche DNB-Reihennamen und -Titel kennt Hardcover nicht — das Buch selbst über ID/ISBN nachschlagen,
        // deutsche Manga-Bände kennt meist nur die DNB.
        if (needsSeriesLookup(book, knownParts.length, placed, Date.now())) {
          lookups += 1;
          let answered = false;
          let adopted: BookSeriesInfo | undefined;
          for (const source of SERIES_SOURCES) {
            const found = await source(book);
            if (!alive) return;
            if (found === undefined) continue;
            answered = true;
            if (!found?.wikidataId) continue;
            if (found.wikidataId === known) {
              if (placed || found.position === undefined) continue;
              adopted = adoptSeries(own, found);
              break;
            }
            const parts = await loadParts(found.wikidataId);
            if (!alive) return;
            if (parts.length >= 2) {
              adopted = adoptSeries(own, found);
              names[found.wikidataId] = adopted.name;
              break;
            }
          }
          if (answered || adopted) {
            await updateBookFields(uid, book.id, {
              ...seriesCheckedFields(),
              ...(adopted ? { series: adopted } : {}),
            }).catch(() => undefined);
          }
          if (adopted) continue;
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
