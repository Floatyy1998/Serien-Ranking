import { ContentCopy, OpenInNew } from '@mui/icons-material';
import { useState } from 'react';
import {
  beforeReport,
  bugContextToText,
  formatCrumbLine,
  formatNetworkLine,
  isFailedRequest,
  summarizeBugContext,
} from '../../../../lib/errorReport/bugContextFormat';
import { buildEnvRows } from '../../../../lib/errorReport/envRows';
import type { BugContext } from '../../../../types/ErrorReport';
import { copyTextToClipboard } from '../../../../utils/clipboard';

type Panel = 'env' | 'crumbs' | 'network' | 'console';

interface Line {
  t: number;
  text: string;
  tone?: 'bad' | 'warn';
}

export function TicketContextSection({ context }: { context: BugContext }) {
  const [open, setOpen] = useState<Panel | null>(null);
  const [copied, setCopied] = useState(false);
  const summary = summarizeBugContext(context);
  const network = context.network || [];
  const consoleLog = context.console || [];
  const crumbs = context.breadcrumbs || [];
  const envRows = buildEnvRows(context.env);
  const pagePath = context.page.split('?')[0];

  const panels: { id: Panel; label: string; count: number; alert?: number }[] = [
    { id: 'env', label: 'Gerät', count: envRows.length },
    { id: 'crumbs', label: 'Verlauf', count: crumbs.length },
    { id: 'network', label: 'Netzwerk', count: network.length, alert: summary.failedRequests },
    { id: 'console', label: 'Konsole', count: consoleLog.length, alert: summary.consoleErrors },
  ];

  const lines: Line[] =
    open === 'crumbs'
      ? crumbs.map((c) => ({
          t: c.t,
          text: formatCrumbLine(c),
          tone: c.type === 'error' || c.detail ? 'bad' : undefined,
        }))
      : open === 'network'
        ? network.map((n) => ({
            t: n.t,
            text: formatNetworkLine(n),
            tone: isFailedRequest(n) ? 'bad' : undefined,
          }))
        : open === 'console'
          ? consoleLog.map((c) => ({
              t: c.t,
              text: c.text,
              tone: c.level === 'error' ? 'bad' : 'warn',
            }))
          : [];

  return (
    <div className="tk-ctx">
      <div className="tk-ctx__page">
        <a href={pagePath} target="_blank" rel="noopener noreferrer">
          {context.page}
          <OpenInNew style={{ fontSize: 14 }} />
        </a>
        <button
          type="button"
          className="adm-btn adm-btn--ghost"
          onClick={() => {
            void copyTextToClipboard(bugContextToText(context));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <ContentCopy style={{ fontSize: 13 }} /> {copied ? 'Kopiert' : 'Als Text'}
        </button>
      </div>
      {(context.pageTitle || context.scrollY) && (
        <div className="tk-ctx__sub">
          {[context.pageTitle, context.scrollY ? `gescrollt ${context.scrollY}px` : '']
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}

      <div className="tk-ctx__tabs">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            disabled={panel.count === 0}
            className={[
              'tk-ctx__tab',
              open === panel.id ? 'is-on' : '',
              panel.alert ? 'is-alert' : '',
            ].join(' ')}
            onClick={() => setOpen(open === panel.id ? null : panel.id)}
          >
            {panel.label} <b>{panel.count}</b>
            {panel.alert ? <span> · {panel.alert} Fehler</span> : null}
          </button>
        ))}
      </div>

      {open === 'env' && (
        <div className="adm-kv tk-ctx__kv">
          {envRows.map((row) => (
            <div key={row.label} className={`adm-kv__item ${row.wide ? 'adm-kv__item--wide' : ''}`}>
              <div className="adm-kv__k">{row.label}</div>
              <div className="adm-kv__v">{row.value}</div>
            </div>
          ))}
        </div>
      )}

      {lines.length > 0 && (
        <div className="tk-ctx__log">
          {lines.map((line, i) => (
            <div
              key={`${line.t}-${i}`}
              className={`tk-ctx__line ${line.tone ? `is-${line.tone}` : ''}`}
            >
              <span className="tk-ctx__t">{beforeReport(context, line.t)}</span>
              <span>{line.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
