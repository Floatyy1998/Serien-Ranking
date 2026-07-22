import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { t } from '../services/i18n';
import { copyTextToClipboard } from '../utils/clipboard';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Chunk load errors after deploy: auto-reload once
    if (
      error.message?.includes('dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch')
    ) {
      try {
        const alreadyReloaded = sessionStorage.getItem('chunk-reload');
        if (!alreadyReloaded) {
          sessionStorage.setItem('chunk-reload', '1');
          window.location.reload();
          return { hasError: false, error: null, errorInfo: '' };
        }
        sessionStorage.removeItem('chunk-reload');
      } catch {
        // Storage blockiert — dann regulär die Fehlerseite zeigen
      }
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorInfo = [
      `${error.name}: ${error.message}`,
      error.stack?.split('\n').slice(0, 5).join('\n') || '',
      info.componentStack?.split('\n').slice(0, 5).join('\n') || '',
    ]
      .filter(Boolean)
      .join('\n\n');

    this.setState({ errorInfo });
  }

  handleCopy = () => {
    const text = [
      `Zeitpunkt: ${new Date().toLocaleString('de-DE')}`,
      `URL: ${window.location.href}`,
      `Gerät: ${navigator.userAgent}`,
      '',
      this.state.errorInfo,
    ].join('\n');

    void copyTextToClipboard(text);
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(120% 80% at 50% 0%, var(--theme-primary-05, rgba(0,209,35,0.05)), transparent 60%), var(--theme-background, #000)',
          color: 'var(--color-text-secondary, #e5e5e5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'var(--font-body, -apple-system, sans-serif)',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '32px 28px',
            borderRadius: 'var(--radius-2xl, 24px)',
            background: 'var(--glass-medium, rgba(255,255,255,0.07))',
            backdropFilter: 'var(--glass-filter-lg, blur(24px))',
            WebkitBackdropFilter: 'var(--glass-filter-lg, blur(24px))',
            border: '1px solid var(--glass-border-light, rgba(255,255,255,0.08))',
            boxShadow:
              'var(--shadow-cinematic, 0 20px 60px -15px rgba(0,0,0,0.7)), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              marginBottom: '18px',
              background: 'color-mix(in srgb, #ef4444 14%, transparent)',
              border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)',
              boxShadow: '0 0 24px color-mix(in srgb, #ef4444 20%, transparent)',
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
              color: '#fff',
              fontFamily: 'var(--font-display, inherit)',
            }}
          >
            {t('Etwas ist schiefgelaufen')}
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-muted, #a3a3a3)',
              margin: '0 0 24px',
              lineHeight: 1.5,
            }}
          >
            {t(
              'Die App ist auf einen unerwarteten Fehler gestossen. Du kannst den Fehler kopieren und als Bug-Ticket einreichen.'
            )}
          </p>

          {/* Error Details */}
          <pre
            style={{
              fontSize: '11px',
              color: '#f87171',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid color-mix(in srgb, #ef4444 18%, transparent)',
              borderRadius: 'var(--radius-md, 12px)',
              padding: '12px',
              margin: '0 0 20px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {this.state.errorInfo || this.state.error?.message || t('Unbekannter Fehler')}
          </pre>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleCopy}
              style={{
                flex: 1,
                padding: '13px 16px',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid var(--glass-border-light, rgba(255,255,255,0.08))',
                background: 'var(--glass-light, rgba(255,255,255,0.04))',
                color: 'var(--color-text-secondary, #e5e5e5)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '44px',
                fontFamily: 'inherit',
                transition: 'background var(--duration-fast, 0.15s) ease',
              }}
            >
              {t('Fehler kopieren')}
            </button>
            <button
              onClick={this.handleReload}
              style={{
                flex: 1,
                padding: '13px 16px',
                borderRadius: 'var(--radius-md, 12px)',
                border: 'none',
                background: 'var(--theme-primary, #00d123)',
                color: 'var(--theme-background, #000)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '44px',
                fontFamily: 'inherit',
                boxShadow: 'var(--glow-soft, 0 0 24px rgba(0,209,35,0.25))',
              }}
            >
              {t('Neu laden')}
            </button>
          </div>

          {/* Bug Report Link */}
          <a
            href="/bug-report?create=true"
            onClick={(e) => {
              e.preventDefault();
              const errorText = [
                `Zeitpunkt: ${new Date().toLocaleString('de-DE')}`,
                `URL: ${window.location.href}`,
                `Gerät: ${navigator.userAgent}`,
                '',
                this.state.errorInfo || this.state.error?.message || 'Unbekannter Fehler',
              ].join('\n');
              const params = new URLSearchParams({
                create: 'true',
                errors: errorText.slice(0, 1500),
              });
              window.open(`/bug-report?${params.toString()}`, '_blank');
            }}
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '18px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--theme-primary, #00d123)',
              textDecoration: 'none',
            }}
          >
            {t('Bug-Ticket erstellen')}
          </a>
        </div>
      </div>
    );
  }
}
