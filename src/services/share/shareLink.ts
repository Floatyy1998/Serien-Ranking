/**
 * Link über das System-Share-Sheet teilen (WhatsApp, Signal, …).
 * Reihenfolge: Capacitor-Share-Plugin (native Apps, Android-WebView hat kein
 * navigator.share) → Web-Share-API (mobile Browser) → Zwischenablage.
 */

interface CapacitorSharePlugin {
  share?: (options: { title?: string; text?: string; url?: string }) => Promise<unknown>;
}

interface CapacitorShareGlobal {
  isNativePlatform?: () => boolean;
  Plugins?: { Share?: CapacitorSharePlugin };
}

export type ShareLinkResult = 'shared' | 'copied' | 'cancelled' | 'failed';

const getNativeShare = (): CapacitorSharePlugin | null => {
  if (typeof window === 'undefined') return null;
  const cap = (window as { Capacitor?: CapacitorShareGlobal }).Capacitor;
  return cap?.isNativePlatform?.() ? (cap.Plugins?.Share ?? null) : null;
};

const isCancel = (err: unknown): boolean => {
  const e = err as { name?: string; message?: string };
  return e?.name === 'AbortError' || (e?.message || '').toLowerCase().includes('cancel');
};

export async function shareLink(options: {
  url: string;
  title?: string;
  text?: string;
}): Promise<ShareLinkResult> {
  const { url, title, text } = options;

  const native = getNativeShare();
  if (native?.share) {
    try {
      await native.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (isCancel(err)) return 'cancelled';
      // Plugin fehlt/kaputt (alter Build) → Web-Fallbacks versuchen
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (isCancel(err)) return 'cancelled';
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
