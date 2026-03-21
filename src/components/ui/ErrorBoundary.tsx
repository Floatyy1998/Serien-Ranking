import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            padding: '24px',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Etwas ist schiefgelaufen.</p>
          {this.state.error && (
            <p
              style={{
                fontSize: '13px',
                opacity: 0.6,
                margin: 0,
                fontFamily: 'monospace',
                maxWidth: '400px',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Erneut versuchen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
