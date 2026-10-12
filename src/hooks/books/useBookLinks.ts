import { useEffect, useState } from 'react';
import { getBookDetails } from '../../services/api/booksApi';
import { fetchBookLinks, fetchSeriesParts } from '../../services/api/wikidataBooks';
import type { BookDetails, BookLinks, BookSeriesPart } from '../../types/Book';

export function useBookDetails(ref: { googleId?: string; olWorkId?: string } | null) {
  const [details, setDetails] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(!!(ref?.googleId || ref?.olWorkId));
  const googleId = ref?.googleId;
  const olWorkId = ref?.olWorkId;

  useEffect(() => {
    if (!googleId && !olWorkId) {
      setDetails(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    getBookDetails({ googleId, olWorkId })
      .then((d) => alive && setDetails(d))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [googleId, olWorkId]);

  return { details, loading };
}

/** Reihe und Verfilmungen aus Wikidata; die Bandliste kommt nur, wenn es eine Reihe gibt. */
export function useBookLinks(title: string | undefined, author: string | undefined) {
  const [links, setLinks] = useState<BookLinks | null>(null);
  const [parts, setParts] = useState<BookSeriesPart[]>([]);
  const [loading, setLoading] = useState(!!title);

  useEffect(() => {
    if (!title) return;
    let alive = true;
    setLoading(true);
    setParts([]);
    fetchBookLinks(title, author)
      .then(async (result) => {
        if (!alive) return;
        setLinks(result);
        if (result.series?.wikidataId) {
          const list = await fetchSeriesParts(result.series.wikidataId).catch(() => []);
          if (alive) setParts(list);
        }
      })
      .catch(() => alive && setLinks({ adaptations: [] }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [title, author]);

  return { links, parts, loading };
}
