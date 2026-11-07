import { CheckBox, CheckBoxOutlineBlank, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import {
  formatConsoleLine,
  formatCrumbLine,
  formatNetworkLine,
  summarizeBugContext,
} from '../../../lib/errorReport/bugContextFormat';
import { t } from '../../../services/i18n';
import type { BugContext } from '../../../types/ErrorReport';

interface BugContextToggleProps {
  theme: ThemeContextType['currentTheme'];
  context: BugContext;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function BugContextToggle({ theme, context, checked, onChange }: BugContextToggleProps) {
  const [showDetails, setShowDetails] = useState(false);
  const summary = summarizeBugContext(context);
  const consoleCount = summary.consoleErrors + summary.consoleWarnings;

  const previewSections: { title: string; lines: string[] }[] = [
    {
      title: t('Seite'),
      lines: [context.page, ...(context.pageTitle ? [context.pageTitle] : [])],
    },
    {
      title: t('Gerät'),
      lines: Object.entries(context.env)
        .filter(([key]) => key !== 'route' && key !== 'prevRoute')
        .map(([key, value]) => `${key}: ${String(value)}`),
    },
    { title: t('Letzte Schritte'), lines: context.breadcrumbs.map(formatCrumbLine) },
    { title: t('Netzwerk'), lines: context.network.map(formatNetworkLine) },
    { title: t('Konsole'), lines: context.console.map(formatConsoleLine) },
  ].filter((section) => section.lines.length > 0);

  const Icon = checked ? CheckBox : CheckBoxOutlineBlank;

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${checked ? `${theme.primary}40` : 'var(--glass-border-subtle)'}`,
        background: checked ? `${theme.primary}0d` : 'var(--glass-subtle)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: theme.text.primary,
        }}
      >
        <Icon
          style={{
            fontSize: 22,
            flexShrink: 0,
            color: checked ? theme.primary : theme.text.muted,
          }}
        />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>
            {t('Diese Seite und technische Daten mitschicken')}
          </span>
          <span
            style={{
              display: 'block',
              marginTop: '3px',
              fontSize: '12px',
              color: theme.text.muted,
              overflowWrap: 'anywhere',
            }}
          >
            {context.page}
            {' · '}
            {t('Netzwerk')}: {summary.requests}
            {summary.failedRequests > 0 &&
              ` (${t('{count} fehlgeschlagen', { count: summary.failedRequests })})`}
            {' · '}
            {t('Konsole')}: {consoleCount}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          margin: '0 12px 10px 44px',
          padding: 0,
          minHeight: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          color: theme.primary,
        }}
      >
        {showDetails ? t('Ausblenden') : t('Was wird gesendet?')}
        <ExpandMore
          style={{
            fontSize: 16,
            transform: showDetails ? 'rotate(180deg)' : undefined,
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {showDetails && (
        <div
          style={{
            margin: '0 12px 12px',
            padding: '10px',
            borderRadius: '8px',
            background: 'var(--glass-subtle)',
            border: '1px solid var(--glass-border-subtle)',
            maxHeight: '260px',
            overflow: 'auto',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: theme.text.muted }}>
            {t(
              'Nur für die Fehlersuche und nur für den Betreiber sichtbar. Werte in Adressen wie Suchbegriffe werden vorher entfernt.'
            )}
          </p>
          {previewSections.map((section) => (
            <div key={section.title} style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: theme.text.secondary,
                  marginBottom: '2px',
                }}
              >
                {section.title}
              </div>
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: theme.text.muted,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {section.lines.join('\n')}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
