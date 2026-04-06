import { useEffect, useState } from 'react';
import { FiberNew, CheckCircle } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

interface NewEpisode {
  season: number;
  episode: number;
  name: string;
  air_date: string | null;
}

interface NewEpisodesSeries {
  title: string;
  serieId: number;
  episodes: NewEpisode[];
}

interface NewEpisodesData {
  runStart: string;
  totalNewEpisodes: number;
  seriesCount: number;
  series: NewEpisodesSeries[] | Record<string, NewEpisodesSeries>;
}

const toSeriesArray = (
  series: NewEpisodesSeries[] | Record<string, NewEpisodesSeries> | undefined
): NewEpisodesSeries[] => {
  if (!series) return [];
  if (Array.isArray(series)) return series;
  return Object.values(series);
};

const toEpisodesArray = (
  episodes: NewEpisode[] | Record<string, NewEpisode> | undefined
): NewEpisode[] => {
  if (!episodes) return [];
  if (Array.isArray(episodes)) return episodes;
  return Object.values(episodes);
};

export function NewEpisodesTab({
  theme,
}: {
  theme: {
    primary: string;
    accent: string;
    text: { primary: string; muted: string };
    background: { paper: string };
  };
}) {
  const [data, setData] = useState<NewEpisodesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = firebase.database().ref('admin/newEpisodes');
    const handler = ref.on('value', (snap) => {
      setData(snap.val());
      setLoading(false);
    });
    return () => ref.off('value', handler);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  const seriesList = toSeriesArray(data?.series);
  const totalNew =
    data?.totalNewEpisodes ||
    seriesList.reduce((sum, s) => sum + toEpisodesArray(s.episodes).length, 0);
  const hasNew = totalNew > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: 16,
          borderRadius: 12,
          background: theme.background.paper,
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: hasNew ? theme.primary : theme.text.muted,
            }}
          >
            {totalNew}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Neue Episoden</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.text.primary }}>
            {seriesList.length}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Serien betroffen</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: theme.text.muted }}>Letzter Lauf</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.text.primary, marginTop: 2 }}>
            {data?.runStart ? new Date(data.runStart).toLocaleString('de-DE') : '—'}
          </div>
        </div>
      </div>

      {/* Series list */}
      {seriesList
        .sort((a, b) => toEpisodesArray(b.episodes).length - toEpisodesArray(a.episodes).length)
        .map((series) => {
          const eps = toEpisodesArray(series.episodes);
          return (
            <div
              key={series.serieId}
              style={{
                borderRadius: 12,
                background: theme.background.paper,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: `1px solid ${theme.text.muted}22`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 600, color: theme.primary, fontSize: 13 }}>
                  {series.title}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    background: `${theme.primary}20`,
                    color: theme.primary,
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                >
                  +{eps.length}
                </span>
              </div>

              {eps.map((ep, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 16px',
                    borderBottom: idx < eps.length - 1 ? `1px solid ${theme.text.muted}11` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <FiberNew style={{ fontSize: 16, color: theme.accent, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 12, color: theme.text.primary, fontFamily: 'monospace' }}
                    >
                      S{String(ep.season).padStart(2, '0')}E{String(ep.episode).padStart(2, '0')}{' '}
                      <span style={{ fontFamily: 'inherit', color: theme.text.muted }}>—</span>{' '}
                      {ep.name}
                    </div>
                  </div>
                  {ep.air_date && (
                    <span style={{ fontSize: 10, color: theme.text.muted, flexShrink: 0 }}>
                      {new Date(ep.air_date + 'T00:00:00').toLocaleDateString('de-DE')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          );
        })}

      {!hasNew && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.text.muted }}>
          <CheckCircle style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }} />
          <div>Keine neuen Episoden beim letzten Lauf</div>
        </div>
      )}
    </div>
  );
}
