import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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
      const alreadyReloaded = sessionStorage.getItem('chunk-reload');
      if (!alreadyReloaded) {
        sessionStorage.setItem('chunk-reload', '1');
        window.location.reload();
        return { hasError: false, error: null, errorInfo: '' };
      }
      sessionStorage.removeItem('chunk-reload');
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

    navigator.clipboard.writeText(text);
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
          background: '#0a0a0a',
          color: '#e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>:(</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>
            Etwas ist schiefgelaufen
          </h1>
          <p style={{ fontSize: '14px', color: '#a3a3a3', margin: '0 0 24px', lineHeight: 1.5 }}>
            Die App ist auf einen unerwarteten Fehler gestossen. Du kannst den Fehler kopieren und
            als Bug-Ticket einreichen.
          </p>

          {/* Error Details */}
          <pre
            style={{
              fontSize: '11px',
              color: '#ef4444',
              background: '#1a1a1a',
              border: '1px solid #262626',
              borderRadius: '8px',
              padding: '12px',
              margin: '0 0 20px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {this.state.errorInfo || this.state.error?.message || 'Unbekannter Fehler'}
          </pre>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleCopy}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#1a1a1a',
                color: '#e5e5e5',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fehler kopieren
            </button>
            <button
              onClick={this.handleReload}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Neu laden
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
              marginTop: '16px',
              fontSize: '13px',
              color: '#3b82f6',
              textDecoration: 'none',
            }}
          >
            Bug-Ticket erstellen
          </a>
        </div>
      </div>
    );
  }
}
