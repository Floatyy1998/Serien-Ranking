import { useEffect, useState } from 'react';
import { getBookDetails } from '../../services/api/booksApi';
import { isDnbSeriesKey } from '../../lib/books/bookSearchMapping';
import { isHardcoverSeriesKey } from '../../services/api/hardcoverApi';
import { fetchBookLinks, fetchSeriesParts } from '../../services/api/wikidataBooks';
import type { BookDetails, BookLinks, BookSeriesPart } from '../../types/Book';

export function useBookDetails(
  ref: { hardcoverId?: number; googleId?: string; olWorkId?: string } | null
) {
  const [details, setDetails] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(!!(ref?.hardcoverId || ref?.googleId || ref?.olWorkId));
  const hardcoverId = ref?.hardcoverId;
  const googleId = ref?.googleId;
  const olWorkId = ref?.olWorkId;

  useEffect(() => {
    if (!hardcoverId && !googleId && !olWorkId) {
      setDetails(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    getBookDetails({ hardcoverId, googleId, olWorkId })
      .then((d) => alive && setDetails(d))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [hardcoverId, googleId, olWorkId]);

  return { details, loading };
}

/**
 * Verfilmungen und Wikipedia aus Wikidata; die Reihe kommt aus Hardcover bzw. der DNB, wenn das Buch einen
 * solchen Schlüssel trägt (`hc:<Name>`, `dnb:<Name>` — der Name zur Anzeige kann abweichen), sonst ebenfalls
 * aus Wikidata. Die Bandliste gibt es nur bei einer Reihe.
 */
export function useBookLinks(
  title: string | undefined,
  author: string | undefined,
  ownSeries?: { name: string; position?: number; wikidataId?: string },
  lang?: string
) {
  const [links, setLinks] = useState<BookLinks | null>(null);
  const [parts, setParts] = useState<BookSeriesPart[]>([]);
  const [loading, setLoading] = useState(!!title);
  const ownKey =
    isHardcoverSeriesKey(ownSeries?.wikidataId) || isDnbSeriesKey(ownSeries?.wikidataId)
      ? ownSeries?.wikidataId
      : undefined;
  const ownName = ownSeries?.name;
  const ownPosition = ownSeries?.position;

  useEffect(() => {
    if (!title) return;
    let alive = true;
    setLoading(true);
    setParts([]);
    const fromOwnKey = ownKey
      ? fetchSeriesParts(ownKey, lang).catch(() => [])
      : Promise.resolve(null);
    fetchBookLinks(title, author)
      .then(async (result) => {
        if (!alive) return;
        const list = await fromOwnKey;
        if (!alive) return;
        if (ownKey && list && list.length > 1) {
          setLinks({
            ...result,
            series: { wikidataId: ownKey, name: ownName ?? '', position: ownPosition },
          });
          setParts(list);
          return;
        }
        setLinks(result);
        if (result.series?.wikidataId) {
          const wikidataParts = await fetchSeriesParts(result.series.wikidataId, lang).catch(
            () => []
          );
          if (alive) setParts(wikidataParts);
        }
      })
      .catch(() => alive && setLinks({ adaptations: [] }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [title, author, ownKey, ownName, ownPosition, lang]);

  return { links, parts, loading };
}
