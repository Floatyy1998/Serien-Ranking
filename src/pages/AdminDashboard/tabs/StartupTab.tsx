import { useEffect, useMemo, useState } from 'react';
import { NetworkCheck, Devices, HourglassBottom } from '@mui/icons-material';
import {
  NET_CLASS_LABEL,
  NET_CLASS_ORDER,
  SLOW_START_MS,
  formatMs,
  formatRate,
  groupSamples,
  netClassOf,
  summarize,
  toSamples,
  type NetClass,
  type StartupGroup,
} from '../../../lib/startup/startupStats';
import { dbGet } from '../../../services/db/ref';
import type { StartupPlatform, StartupSample } from '../../../types/StartupSample';

const RANGES = [
  { days: 1, label: 'Heute' },
  { days: 7, label: '7 Tage' },
  { days: 30, label: '30 Tage' },
] as const;

const PLATFORM_LABEL: Record<StartupPlatform, string> = {
  ios: 'iOS-App',
  android: 'Android-App',
  electron: 'Desktop-App',
  pwa: 'Installierte Web-App',
  web: 'Browser',
};

const SLOWEST_ROWS = 40;

function dayKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }
  return keys;
}

const toneOf = (ms: number): string =>
  ms > SLOW_START_MS ? 'adm-tone-bad' : ms > 3000 ? 'adm-tone-warn' : 'adm-tone-ok';

function describeNet(sample: StartupSample): string {
  const parts: string[] = [];
  if (typeof sample.kbps === 'number') parts.push(formatRate(sample.kbps));
  if (typeof sample.ttfb === 'number') parts.push(`Antwort ${formatMs(sample.ttfb)}`);
  if (sample.ct) parts.push(sample.ct);
  return parts.length ? parts.join(' · ') : 'unbekannt';
}

function GroupTable({
  title,
  icon,
  head,
  groups,
  labelOf,
}: {
  title: string;
  icon: React.ReactNode;
  head: string;
  groups: StartupGroup[];
  labelOf: (key: string) => string;
}) {
  return (
    <div className="adm-card">
      <div className="adm-card__head">
        <h3 className="adm-card__title">
          {icon}
          {title}
        </h3>
      </div>
      <div className="adm-table__wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>{head}</th>
              <th>Starts</th>
              <th>Median</th>
              <th>95 %</th>
              <th>über {SLOW_START_MS / 1000} s</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.key}>
                <td>{labelOf(group.key)}</td>
                <td>{group.count}</td>
                <td className={toneOf(group.median)}>{formatMs(group.median)}</td>
                <td className={toneOf(group.p95)}>{formatMs(group.p95)}</td>
                <td>{group.slowShare} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StartupTab() {
  const [days, setDays] = useState<number>(7);
  const [platform, setPlatform] = useState<StartupPlatform | null>(null);
  const [loaded, setLoaded] = useState<{ days: number; samples: StartupSample[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      dayKeys(days).map((key) =>
        dbGet(`analytics/global/daily/${key}/starts`)
          .then(toSamples)
          .catch(() => [])
      )
    ).then((perDay) => {
      if (!cancelled) setLoaded({ days, samples: perDay.flat() });
    });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const all = loaded?.days === days ? loaded.samples : null;
  const samples = useMemo(
    () => (all ?? []).filter((s) => !platform || s.p === platform),
    [all, platform]
  );
  const summary = useMemo(() => summarize(samples), [samples]);
  const byNet = useMemo(() => {
    const groups = groupSamples(samples, netClassOf);
    return NET_CLASS_ORDER.map((key) => groups.find((g) => g.key === key)).filter(
      (g): g is StartupGroup => !!g
    );
  }, [samples]);
  const byPlatform = useMemo(() => groupSamples(samples, (s) => s.p), [samples]);
  const slowest = useMemo(
    () => [...samples].sort((a, b) => b.t - a.t).slice(0, SLOWEST_ROWS),
    [samples]
  );
  const platforms = useMemo(() => [...new Set((all ?? []).map((s) => s.p))], [all]);

  if (!all) return <div className="adm-empty">Laden...</div>;

  const stats = [
    { value: String(summary.count), label: 'gemessene Starts', tone: 'adm-tone-info' },
    { value: String(summary.users), label: 'Konten', tone: '' },
    { value: formatMs(summary.median), label: 'Median', tone: toneOf(summary.median) },
    { value: formatMs(summary.p75), label: '75 %', tone: toneOf(summary.p75) },
    { value: formatMs(summary.p95), label: '95 %', tone: toneOf(summary.p95) },
    {
      value: `${summary.slowShare} %`,
      label: `über ${SLOW_START_MS / 1000} s`,
      tone: summary.slowShare > 10 ? 'adm-tone-bad' : '',
    },
    { value: formatMs(summary.medianJs), label: 'bis App-Code läuft (Median)', tone: '' },
  ];

  return (
    <div className="adm-stack">
      <div className="adm-chips">
        {RANGES.map((range) => (
          <button
            key={range.days}
            className={`adm-chip ${days === range.days ? 'adm-chip--on' : ''}`}
            onClick={() => setDays(range.days)}
          >
            {range.label}
          </button>
        ))}
        {platforms.length > 1 && <span className="adm-chips__sep" />}
        {platforms.length > 1 &&
          platforms.map((p) => (
            <button
              key={p}
              className={`adm-chip ${platform === p ? 'adm-chip--on' : ''}`}
              onClick={() => setPlatform((cur) => (cur === p ? null : p))}
            >
              {PLATFORM_LABEL[p] ?? p}
            </button>
          ))}
      </div>

      {samples.length === 0 ? (
        <div className="adm-empty">
          Noch keine Messungen in diesem Zeitraum. Gemessen wird ein Start mit Splash bei Konten mit
          Analytics-Einwilligung, höchstens zehn Starts je Gerät und Tag.
        </div>
      ) : (
        <>
          <div className="adm-stats">
            {stats.map((stat) => (
              <div key={stat.label} className={`adm-stat ${stat.tone}`}>
                <div className="adm-stat__value">{stat.value}</div>
                <div className="adm-stat__label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="adm-grid">
            <GroupTable
              title="Nach Verbindung"
              icon={<NetworkCheck style={{ fontSize: 18 }} />}
              head="Verbindung"
              groups={byNet}
              labelOf={(key) => NET_CLASS_LABEL[key as NetClass] ?? key}
            />
            <GroupTable
              title="Nach Plattform"
              icon={<Devices style={{ fontSize: 18 }} />}
              head="Plattform"
              groups={byPlatform}
              labelOf={(key) => PLATFORM_LABEL[key as StartupPlatform] ?? key}
            />
          </div>

          <div className="adm-card">
            <div className="adm-card__head">
              <h3 className="adm-card__title">
                <HourglassBottom style={{ fontSize: 18 }} />
                Langsamste Starts
              </h3>
              <span className="adm-card__meta">
                <strong>{slowest.length}</strong> von {samples.length}
              </span>
            </div>
            <p className="adm-card__hint">
              Zeiten ab dem Öffnen: „App-Code" ist der Moment, in dem der Bildschirm nicht mehr leer
              ist, „aufgebaut" der, in dem der Splash verschwinden darf. Die Rate ist an den
              App-Dateien gemessen und fehlt, wenn alles aus dem Cache kam.
            </p>
            <div className="adm-table__wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Wann</th>
                    <th>Konto</th>
                    <th>Plattform</th>
                    <th>Gesamt</th>
                    <th>App-Code</th>
                    <th>Anmeldung</th>
                    <th>Daten</th>
                    <th>aufgebaut</th>
                    <th>Verbindung</th>
                    <th>Cache</th>
                  </tr>
                </thead>
                <tbody>
                  {slowest.map((s, i) => (
                    <tr key={`${s.u}-${s.ts}-${i}`}>
                      <td>{s.ts ? new Date(s.ts).toLocaleString('de-DE') : '–'}</td>
                      <td title={s.u}>{s.u.slice(0, 6)}</td>
                      <td>{PLATFORM_LABEL[s.p] ?? s.p}</td>
                      <td className={toneOf(s.t)}>{formatMs(s.t)}</td>
                      <td>{formatMs(s.js)}</td>
                      <td>{formatMs(s.a)}</td>
                      <td>{formatMs(s.d)}</td>
                      <td>{formatMs(s.r)}</td>
                      <td>
                        {NET_CLASS_LABEL[netClassOf(s)]} ({describeNet(s)})
                      </td>
                      <td>{typeof s.hit === 'number' ? `${s.hit} %` : '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
