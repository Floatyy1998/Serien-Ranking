import { useEffect, useState } from 'react';
import {
  CheckCircle,
  ErrorOutline,
  HourglassEmpty,
  PlayCircleOutline,
  Refresh,
} from '@mui/icons-material';
import type firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useTheme } from '../../../contexts/ThemeContext';
import { dbRef } from '../../../services/db/ref';

interface Counts {
  ok?: number;
  skip?: number;
  noMatch?: number;
  noEpisodes?: number;
  rateLimited?: number;
  skipNotAnime?: number;
  errors?: number;
}

interface MetaDoc {
  phase?: 'running' | 'idle';
  startedAt?: number;
  progressUpdatedAt?: number;
  processed?: number;
  total?: number;
  currentTmdbId?: number | null;
  currentTitle?: string | null;
  counts?: Counts;
  summary?: Counts;
  lastRunAt?: number;
  lastRunTookSec?: number;
}

const formatDateTime = (ms?: number): string => {
  if (!ms) return '–';
  return new Date(ms).toLocaleString('de-DE');
};

const formatDuration = (ms?: number): string => {
  if (!ms || ms <= 0) return '–';
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s}s`;
};

export const AnimeFillerTab = () => {
  const { currentTheme } = useTheme();
  const [meta, setMeta] = useState<MetaDoc | null>(null);
  const [loading, setLoading] = useState(true);
  // Ticks every second while a run is in progress so the elapsed/ETA labels
  // update smoothly. Avoids reading Date.now() during render (lint purity).
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const ref = dbRef('admin/animeFiller_meta');
    const handler = (snap: firebase.database.DataSnapshot) => {
      setMeta(snap.val() as MetaDoc | null);
      setLoading(false);
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }, []);

  useEffect(() => {
    if (meta?.phase !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [meta?.phase]);

  const running = meta?.phase === 'running';
  const processed = meta?.processed ?? 0;
  const total = meta?.total ?? 0;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const counts: Counts = running ? meta?.counts || {} : meta?.summary || {};
  const sumProcessed =
    (counts.ok ?? 0) +
    (counts.skip ?? 0) +
    (counts.noMatch ?? 0) +
    (counts.noEpisodes ?? 0) +
    (counts.rateLimited ?? 0) +
    (counts.skipNotAnime ?? 0) +
    (counts.errors ?? 0);
  const startedAt = running ? meta?.startedAt : meta?.lastRunAt;
  const elapsedMs = running && meta?.startedAt ? now - meta.startedAt : null;
  const lastRunMs = !running && meta?.lastRunTookSec ? meta.lastRunTookSec * 1000 : null;

  // Rough ETA: average ms per processed × remaining
  const etaMs =
    running && elapsedMs && processed > 0 && total > processed
      ? Math.round((elapsedMs / processed) * (total - processed))
      : null;

  if (loading) {
    return <div style={{ padding: 24, color: currentTheme.text.secondary }}>Lade Status …</div>;
  }

  if (!meta) {
    return (
      <div style={{ padding: 24, color: currentTheme.text.muted }}>
        Noch kein Filler-Run protokolliert.
      </div>
    );
  }

  const statusChip = running ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: `color-mix(in srgb, ${currentTheme.status.success} 18%, transparent)`,
        color: currentTheme.status.success,
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      <PlayCircleOutline style={{ fontSize: 14 }} /> läuft
    </span>
  ) : (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: `color-mix(in srgb, ${currentTheme.text.muted} 18%, transparent)`,
        color: currentTheme.text.muted,
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      <HourglassEmpty style={{ fontSize: 14 }} /> idle
    </span>
  );

  const statBox = (label: string, value: number | string, tone: string, icon?: React.ReactNode) => (
    <div
      style={{
        flex: '1 1 110px',
        padding: '12px 14px',
        borderRadius: 12,
        background: `color-mix(in srgb, ${tone} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${tone} 30%, transparent)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: tone,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 22,
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: currentTheme.text.primary,
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px 24px', color: currentTheme.text.primary }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Anime Filler Pipeline</h2>
        {statusChip}
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginBottom: 22,
          padding: 16,
          borderRadius: 14,
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, color: currentTheme.text.secondary }}>
            {running ? 'Aktueller Run' : 'Letzter Run'}
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: currentTheme.primary,
            }}
          >
            {processed} / {total || sumProcessed}
            <span style={{ marginLeft: 6, color: currentTheme.text.muted, fontSize: 13 }}>
              ({percent}%)
            </span>
          </span>
        </div>
        <div
          style={{
            position: 'relative',
            height: 8,
            borderRadius: 999,
            background: `color-mix(in srgb, ${currentTheme.primary} 14%, transparent)`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${percent}%`,
              background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 14,
            fontSize: 12.5,
            color: currentTheme.text.muted,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span>
            Start:{' '}
            <strong style={{ color: currentTheme.text.secondary }}>
              {formatDateTime(startedAt)}
            </strong>
          </span>
          {running ? (
            <>
              <span>
                Laufzeit:{' '}
                <strong style={{ color: currentTheme.text.secondary }}>
                  {formatDuration(elapsedMs ?? 0)}
                </strong>
              </span>
              <span>
                ETA:{' '}
                <strong style={{ color: currentTheme.text.secondary }}>
                  {formatDuration(etaMs ?? 0)}
                </strong>
              </span>
            </>
          ) : (
            <span>
              Dauer:{' '}
              <strong style={{ color: currentTheme.text.secondary }}>
                {formatDuration(lastRunMs ?? 0)}
              </strong>
            </span>
          )}
          {running && meta.currentTitle && (
            <span style={{ flexBasis: '100%' }}>
              Aktuell:{' '}
              <strong style={{ color: currentTheme.text.secondary }}>
                {meta.currentTitle}
                {meta.currentTmdbId ? ` (TMDB ${meta.currentTmdbId})` : ''}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Counts grid */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {statBox(
          'OK',
          counts.ok ?? 0,
          currentTheme.status.success,
          <CheckCircle style={{ fontSize: 14 }} />
        )}
        {statBox(
          'skip',
          counts.skip ?? 0,
          currentTheme.text.muted,
          <Refresh style={{ fontSize: 14 }} />
        )}
        {statBox('no_match', counts.noMatch ?? 0, currentTheme.status.warning)}
        {statBox('no_episodes', counts.noEpisodes ?? 0, currentTheme.status.warning)}
        {statBox('rate-limited', counts.rateLimited ?? 0, currentTheme.accent)}
        {statBox('not-anime', counts.skipNotAnime ?? 0, currentTheme.text.muted)}
        {statBox(
          'errors',
          counts.errors ?? 0,
          currentTheme.status.error,
          <ErrorOutline style={{ fontSize: 14 }} />
        )}
      </div>
    </div>
  );
};
