import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, ContentCopy, OpenInNew, Security } from '@mui/icons-material';
import { dbRef } from '../../../services/db/ref';
import { onValue } from '../../../services/db/subscribeValue';
import { copyTextToClipboard } from '../../../utils/clipboard';
import { findingToText, findingsToText, formatDateTime } from './securityFindingText';

/** Ein Fund aus scripts/security-audit.cjs (täglicher GitHub-Lauf „CVE-Prüfung“). */
export interface SecurityFinding {
  key: string;
  target: string;
  pkg: string;
  severity: 'critical' | 'high';
  runtime: boolean;
  titles?: string[];
  urls?: string[];
  fix: string;
  firstSeen?: number;
}

interface Payload {
  items?: SecurityFinding[];
  lastRun?: number;
  open?: number;
  runUrl?: string;
}

const REPO = 'https://github.com/Floatyy1998/Serien-Ranking';
const LINKS = [
  { label: 'Prüfläufe', href: `${REPO}/actions/workflows/security-audit.yml` },
  { label: 'Dependabot App', href: `${REPO}/security/dependabot` },
  {
    label: 'Dependabot Backend',
    href: 'https://github.com/Floatyy1998/serien-api/security/dependabot',
  },
];

const TONE_CRITICAL = '#ff5c7a';
const TONE_HIGH = '#f2a648';

export function SecurityTab() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const ref = dbRef('admin/securityAudit');
    const handler = onValue(ref, (snap) => setPayload((snap.val() as Payload) || {}));
    return () => ref.off('value', handler);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async (key: string, text: string) => {
    if (await copyTextToClipboard(text)) setCopied(key);
  };

  if (payload === null) return <div className="adm-empty">Lade CVE-Prüfung…</div>;

  const items = payload.items || [];
  const critical = items.filter((i) => i.severity === 'critical').length;
  const runtime = items.filter((i) => i.runtime).length;

  return (
    <div className="adm-stack">
      <div className="adm-card">
        <div className="adm-card__head">
          <div className="adm-card__title">
            <Security style={{ fontSize: 18 }} /> CVE-Prüfung
          </div>
          <div className="adm-card__meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {items.length > 0 && (
              <button
                type="button"
                className="adm-chip"
                onClick={() => void copy('all', findingsToText(items, payload.lastRun))}
              >
                {copied === 'all' ? 'Kopiert' : 'Alle kopieren'}{' '}
                {copied === 'all' ? (
                  <Check style={{ fontSize: 14 }} />
                ) : (
                  <ContentCopy style={{ fontSize: 14 }} />
                )}
              </button>
            )}
            {payload.runUrl && (
              <a className="adm-chip" href={payload.runUrl} target="_blank" rel="noreferrer">
                Letzter Lauf <OpenInNew style={{ fontSize: 14 }} />
              </a>
            )}
            {LINKS.map((l) => (
              <a key={l.href} className="adm-chip" href={l.href} target="_blank" rel="noreferrer">
                {l.label} <OpenInNew style={{ fontSize: 14 }} />
              </a>
            ))}
          </div>
        </div>
        <div className="adm-stats">
          <div className={`adm-stat ${critical ? 'adm-tone-bad' : 'adm-tone-ok'}`}>
            <div className="adm-stat__value">{critical}</div>
            <div className="adm-stat__label">Kritisch</div>
          </div>
          <div className={`adm-stat ${items.length - critical ? 'adm-tone-warn' : 'adm-tone-ok'}`}>
            <div className="adm-stat__value">{items.length - critical}</div>
            <div className="adm-stat__label">Hoch</div>
          </div>
          <div className={`adm-stat ${runtime ? 'adm-tone-bad' : 'adm-tone-ok'}`}>
            <div className="adm-stat__value">{runtime}</div>
            <div className="adm-stat__label">Im ausgelieferten Code</div>
          </div>
        </div>
        <div className="adm-note">
          Täglich um 06:00 UTC prüft ein GitHub-Lauf App, Apps, Desktop und Cloud Function per{' '}
          <code>npm audit</code>. Neue kritische und hohe Funde kommen als Glocke und Push. „Nur
          Build“ heißt: Das Paket steckt nur in Werkzeugen und landet nicht bei Nutzern. Das Backend
          deckt Dependabot ab. Zuletzt geprüft: {formatDateTime(payload.lastRun)}.
        </div>
      </div>

      {items.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty__t">Keine offenen Lücken</div>
          <div className="adm-empty__s">
            Nichts Kritisches oder Hohes in App und Cloud Function.
          </div>
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.key}
            className="adm-row"
            style={
              {
                '--adm-tone': item.severity === 'critical' ? TONE_CRITICAL : TONE_HIGH,
              } as CSSProperties
            }
          >
            <div className="adm-row__head" style={{ cursor: 'default' }}>
              <div className="adm-row__bar" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="adm-row__title">{item.pkg}</div>
                <div className="adm-row__meta">
                  <span>{item.severity === 'critical' ? 'Kritisch' : 'Hoch'}</span>
                  <span>{item.target}</span>
                  <span>{item.runtime ? 'Im ausgelieferten Code' : 'Nur Build'}</span>
                  <span>Fix: {item.fix}</span>
                  <span>seit {formatDateTime(item.firstSeen)}</span>
                </div>
                {(item.titles?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.8 }}>
                    {item.titles?.join(' · ')}
                  </div>
                )}
                {(item.urls?.length ?? 0) > 0 && (
                  <div className="adm-chips" style={{ marginTop: 8 }}>
                    {item.urls?.map((url) => (
                      <a key={url} className="adm-tag" href={url} target="_blank" rel="noreferrer">
                        {url.split('/').pop()}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="adm-row__acts">
                <button
                  type="button"
                  className="adm-icon-btn"
                  title="Fund kopieren"
                  aria-label={`${item.pkg} kopieren`}
                  onClick={() => void copy(item.key, findingToText(item))}
                >
                  {copied === item.key ? (
                    <Check style={{ fontSize: 16 }} />
                  ) : (
                    <ContentCopy style={{ fontSize: 16 }} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
