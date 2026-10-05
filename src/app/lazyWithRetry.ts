import { createElement, lazy, type ComponentType } from 'react';
import { t } from '../services/i18n';

// Nach Chunk-Fehler: Reload erst, wenn die App im Hintergrund ist
let backgroundReloadArmed = false;
export function armBackgroundReload() {
  if (backgroundReloadArmed) return;
  backgroundReloadArmed = true;
  const apply = () => {
    if (document.visibilityState === 'hidden') window.location.reload();
  };
  document.addEventListener('visibilitychange', apply);
  window.addEventListener('pagehide', apply);
}

const ChunkFailedPage: ComponentType = () =>
  createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        gap: '16px',
        padding: '32px',
        textAlign: 'center',
      },
    },
    createElement(
      'h2',
      {
        style: {
          color: 'var(--theme-primary, #ef6f8a)',
          fontFamily: 'var(--font-display, inherit)',
          margin: 0,
        },
      },
      t('Seite konnte nicht geladen werden')
    ),
    createElement(
      'p',
      {
        style: {
          color: 'var(--color-text-secondary, rgba(255,255,255,0.7))',
          maxWidth: '340px',
          margin: 0,
          lineHeight: 1.5,
          fontSize: '15px',
        },
      },
      t(
        'Wahrscheinlich gibt es eine neue App-Version. Sie wird automatisch übernommen, sobald die App kurz im Hintergrund war — oder direkt hier:'
      )
    ),
    createElement(
      'button',
      {
        onClick: () => window.location.reload(),
        style: {
          border: 'none',
          borderRadius: '999px',
          padding: '12px 24px',
          fontWeight: 700,
          fontSize: '15px',
          cursor: 'pointer',
          color: '#000',
          background: 'var(--theme-primary, #ef6f8a)',
        },
      },
      t('Jetzt aktualisieren')
    )
  );

// React.lazy itself constrains T to ComponentType<any>; we mirror that so the
// retry wrapper accepts the same shapes (FC<{}>, ComponentType<Props>, ...).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  // Ein Chunk kann erfolgreich laden und den Export trotzdem nicht liefern
  // (abgebrochene WebView-Anfrage); React wirft dafuer sonst Fehler #306.
  const load = async () => {
    const mod = await factory();
    const component = mod?.default as unknown;
    if (!component || (typeof component !== 'function' && typeof component !== 'object')) {
      throw new Error('lazy chunk resolved without component');
    }
    return mod;
  };
  return lazy(async () => {
    try {
      return await load();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        return await load();
      } catch {
        armBackgroundReload();
        return { default: ChunkFailedPage as unknown as T };
      }
    }
  });
}
