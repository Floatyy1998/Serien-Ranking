import type { Series } from '../types/Series';
import { normalizeSeasons, normalizeEpisodes } from '../lib/episode/seriesMetrics';

export interface DataIssue {
  type: string;
  seriesName: string;
  seriesKey: string;
  seasonIndex: number;
  episodeIndex: number;
  firebasePath: string;
  problem: string;
  storedFields: string[];
  storedValues: Record<string, unknown>;
}

export function checkSeriesIntegrity(
  seriesData: Record<string, Series>,
  uid: string
): { sanitized: Series[]; issues: DataIssue[] } {
  const issues: DataIssue[] = [];

  const add = (
    type: string,
    sName: string,
    sKey: string,
    sIdx: number,
    eIdx: number,
    path: string,
    problem: string,
    fields: string[],
    values: Record<string, unknown>
  ) => {
    issues.push({
      type,
      seriesName: sName,
      seriesKey: sKey,
      seasonIndex: sIdx,
      episodeIndex: eIdx,
      firebasePath: path,
      problem,
      storedFields: fields,
      storedValues: values,
    });
  };

  const sanitized = Object.entries(seriesData).map(([seriesKey, s]) => {
    const sName = s.name || s.title || `Key: ${seriesKey}`;
    const bp = `${uid}/serien/${seriesKey}`;

    if (!s.name && !s.title)
      add(
        'missing-series-name',
        `Key: ${seriesKey}`,
        seriesKey,
        -1,
        -1,
        bp,
        'Serie ohne Name — weder name noch title vorhanden',
        Object.keys(s),
        { id: s.id, nmr: s.nmr }
      );
    if (s.id == null)
      add(
        'missing-series-id',
        sName,
        seriesKey,
        -1,
        -1,
        bp,
        'Serie ohne ID — id fehlt',
        Object.keys(s),
        { name: s.name, title: s.title, nmr: s.nmr }
      );

    const normalizedSeasons = normalizeSeasons(s.seasons).filter(
      (season): season is Series['seasons'][number] => !!season
    );
    if (normalizedSeasons.length === 0)
      add(
        'missing-seasons',
        sName,
        seriesKey,
        -1,
        -1,
        `${bp}/seasons`,
        'Serie ohne Seasons — seasons ist leer oder null nach Normalisierung',
        Object.keys(s),
        { seasonCount: s.seasonCount }
      );

    const sanitizedSeasons = normalizedSeasons.map((season, sIdx) => {
      const rawEps = Array.isArray(season.episodes)
        ? season.episodes
        : season.episodes
          ? Object.values(season.episodes)
          : [];
      const sNum = season.seasonNumber ?? season.season_number;
      const sp = `${bp}/seasons/${sIdx}`;

      if (sNum == null)
        add(
          'missing-season-number',
          sName,
          seriesKey,
          sIdx,
          -1,
          sp,
          'Staffel ohne season_number — weder seasonNumber noch season_number vorhanden',
          Object.keys(season),
          { episodeCount: rawEps.length }
        );

      const validEps = rawEps.filter((ep) => ep && typeof ep === 'object');
      if (validEps.length === 0 && rawEps.length === 0)
        add(
          'empty-season',
          sName,
          seriesKey,
          sIdx,
          -1,
          sp,
          `Leere Staffel — Season ${sNum ?? sIdx} hat 0 Episoden`,
          Object.keys(season),
          { seasonNumber: sNum }
        );

      if (Array.isArray(season.episodes)) {
        season.episodes.forEach((ep, idx) => {
          if (ep === null || ep === undefined)
            add(
              'sparse-array-hole',
              sName,
              seriesKey,
              sIdx,
              idx,
              `${sp}/episodes/${idx}`,
              `Sparse Array Loch — Index ${idx} ist null/undefined`,
              [],
              { seasonNumber: sNum }
            );
        });
      }

      const epNumCounts = new Map<number, number[]>();
      rawEps.forEach((ep, idx) => {
        if (!ep || typeof ep !== 'object') return;
        const epObj = ep as Record<string, unknown>;
        const epNum = epObj.episode_number as number | undefined;
        if (epNum == null) {
          add(
            'missing-episode-number',
            sName,
            seriesKey,
            sIdx,
            idx,
            `${sp}/episodes/${idx}`,
            'Episode ohne episode_number — vermutlich von Extension an falschem Index geschrieben',
            Object.keys(epObj),
            Object.fromEntries(
              Object.entries(epObj).filter(([k]) =>
                [
                  'watched',
                  'watchCount',
                  'firstWatchedAt',
                  'lastWatchedAt',
                  'name',
                  'runtime',
                ].includes(k)
              )
            )
          );
        } else {
          const arr = epNumCounts.get(epNum) || [];
          arr.push(idx);
          epNumCounts.set(epNum, arr);
        }
        if (
          epNum != null &&
          (!epObj.name || (typeof epObj.name === 'string' && epObj.name.trim() === ''))
        )
          add(
            'missing-episode-name',
            sName,
            seriesKey,
            sIdx,
            idx,
            `${sp}/episodes/${idx}`,
            `Episode ohne Name — episode_number ${epNum} hat keinen Namen`,
            Object.keys(epObj),
            { episode_number: epNum, watched: epObj.watched }
          );
        if (epObj.watched === true && !epObj.firstWatchedAt)
          add(
            'watched-without-timestamp',
            sName,
            seriesKey,
            sIdx,
            idx,
            `${sp}/episodes/${idx}`,
            `Episode watched aber ohne firstWatchedAt — episode_number ${epNum ?? idx}`,
            Object.keys(epObj),
            { episode_number: epNum, watched: true, lastWatchedAt: epObj.lastWatchedAt }
          );
      });

      for (const [epNum, indices] of epNumCounts) {
        if (indices.length > 1)
          add(
            'duplicate-episode',
            sName,
            seriesKey,
            sIdx,
            indices[0],
            sp,
            `Doppelte Episode — episode_number ${epNum} kommt ${indices.length}x vor (Indizes: ${indices.join(', ')})`,
            [],
            { episode_number: epNum, indices, seasonNumber: sNum }
          );
      }

      if (sNum != null && validEps.length > 0) {
        const epNums = validEps
          .map((ep) => (ep as Record<string, unknown>).episode_number as number | undefined)
          .filter((n): n is number => n != null);
        if (epNums.length > 0) {
          const maxN = Math.max(...epNums),
            minN = Math.min(...epNums);
          if (maxN > validEps.length * 2 || minN < 0)
            add(
              'mismatched-numbering',
              sName,
              seriesKey,
              sIdx,
              -1,
              sp,
              `Seasons mit falscher Nummerierung — Season ${sNum}: Episoden-Nummern ${minN}-${maxN} bei ${validEps.length} Episoden`,
              [],
              { seasonNumber: sNum, episodeCount: validEps.length, minEpNum: minN, maxEpNum: maxN }
            );
        }
      }

      return { ...season, episodes: normalizeEpisodes(season.episodes) };
    });

    return { ...s, seasons: sanitizedSeasons };
  });

  return { sanitized, issues };
}
