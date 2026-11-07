import type { BookSearchResult, BookSeriesPart } from '../../types/Book';
import { pickIsbn13 } from './bookIdentity';
import { mapDnbRecord } from './bookSearchMapping';
import { seriesNameKey } from './bookSeries';
import { splitVolume } from './mangaVolume';

const MARC_NS = 'http://www.loc.gov/MARC21/slim';

/** Bandnummer eines Treffers, wenn er zur gesuchten Reihe gehört — aus Feld 490/245 $n oder der Zahl am Titelende. */
function volumeIn(result: BookSearchResult, wanted: string): number | undefined {
  const { series } = result;
  if (series?.position && seriesNameKey(series.name) === wanted) return series.position;
  const titled = splitVolume(result.title);
  return titled.volume && seriesNameKey(titled.series) === wanted ? titled.volume : undefined;
}

/**
 * Bände einer Reihe aus einer DNB-Titelsuche (SRU, MARC21). Pro Band bleibt die Druckausgabe (mit Seitenzahl)
 * vor dem E-Book; Bände aus dem laufenden Jahr bleiben ohne Datum — die DNB nennt oft nur das Jahr.
 */
export function mapDnbSeriesParts(xml: string, name: string, now = new Date()): BookSeriesPart[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const serializer = new XMLSerializer();
  const wanted = seriesNameKey(name);
  const year = now.getFullYear();
  const byPosition = new Map<number, BookSeriesPart>();
  for (const record of [...doc.getElementsByTagNameNS(MARC_NS, 'record')]) {
    const isbns = [...record.getElementsByTagNameNS(MARC_NS, 'datafield')]
      .filter((f) => f.getAttribute('tag') === '020')
      .flatMap((f) => [...f.getElementsByTagNameNS(MARC_NS, 'subfield')])
      .filter((s) => ['9', 'a'].includes(s.getAttribute('code') ?? ''))
      .map((s) => s.textContent ?? '');
    const isbn13 = pickIsbn13(isbns);
    if (!isbn13) continue;
    const result = mapDnbRecord(serializer.serializeToString(record), isbn13);
    const position = result && volumeIn(result, wanted);
    if (!result || !position) continue;
    const existing = byPosition.get(position);
    if (existing && (existing.result?.pageCount || !result.pageCount)) continue;
    byPosition.set(position, {
      wikidataId: result.id,
      title: result.title,
      position,
      ...(result.publishedYear && result.publishedYear !== year
        ? { publishedDate: `${result.publishedYear}-01-01` }
        : {}),
      result,
    });
  }
  return [...byPosition.values()].sort((a, b) => a.position - b.position);
}
