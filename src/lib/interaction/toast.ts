/**
 * App-Toasts (DOM-basiert, unabhängig von React-Render).
 *
 * Toasts werden GESTAPELT statt als Singleton geführt: ein neuer Toast committet
 * NICHT mehr sofort den vorherigen. So bleibt beim Schnell-Markieren mehrerer
 * Episoden für jede Aktion ein eigenes Undo-Fenster erhalten.
 *
 * Barrierefreiheit: jeder Toast ist ein aria-live-Region (error = assertive),
 * damit Screenreader Feedback + den zeitkritischen „Rückgängig"-Button ansagen.
 */

import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';

// Max. gleichzeitig offene Undo-Toasts. Beim Bulk-Markieren würden sonst
// beliebig viele stapeln; der älteste wird committet, sobald das Limit greift.
const MAX_UNDO_TOASTS = 3;

interface UndoEntry {
  el: HTMLElement;
  commitNow: () => void;
}

const undoToasts: UndoEntry[] = [];

function ensureContainer(): HTMLElement {
  let container = document.getElementById('app-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'app-toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function ensureToastStyles(): void {
  if (document.getElementById('app-toast-style')) return;
  const style = document.createElement('style');
  style.id = 'app-toast-style';
  style.textContent = `
    @keyframes toast-enter {
      from {
        transform: translateY(20px) scale(0.92);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    @keyframes toast-exit {
      from {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      to {
        transform: translateY(10px) scale(0.95);
        opacity: 0;
      }
    }
    #app-toast-container {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      width: 90vw;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .app-toast {
      width: 100%;
      padding: 14px 18px;
      background: linear-gradient(
        135deg,
        rgba(20, 20, 30, 0.92) 0%,
        rgba(30, 30, 45, 0.92) 100%
      );
      -webkit-backdrop-filter: var(--glass-filter-lg);
      backdrop-filter: var(--glass-filter-lg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      color: rgba(255, 255, 255, 0.95);
      font-size: 13.5px;
      font-weight: 500;
      letter-spacing: -0.01em;
      font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
      animation: toast-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.35),
        0 4px 12px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      -webkit-font-smoothing: antialiased;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 14px;
      overflow: hidden;
      position: relative;
    }
    .app-toast.toast-interactive {
      pointer-events: auto;
      cursor: default;
    }
    .app-toast .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 15px;
    }
    .app-toast .toast-icon--success {
      background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08));
      color: #4ade80;
    }
    .app-toast .toast-icon--error {
      background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08));
      color: #f87171;
    }
    .app-toast .toast-icon--info {
      background: linear-gradient(135deg,
        color-mix(in srgb, var(--theme-primary, #60a5fa) 20%, transparent),
        color-mix(in srgb, var(--theme-primary, #60a5fa) 8%, transparent));
      color: var(--theme-primary, #60a5fa);
    }
    .app-toast .toast-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .app-toast .toast-divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.12);
      flex-shrink: 0;
    }
    .app-toast .toast-undo-btn {
      background: none;
      border: none;
      color: var(--theme-primary, #60a5fa);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      /* min. 44px Trefferfläche für den zeitkritischen Undo-Button */
      min-height: 44px;
      padding: 6px 12px;
      border-radius: 8px;
      transition: background 0.15s ease;
      white-space: nowrap;
      flex-shrink: 0;
      letter-spacing: 0.01em;
    }
    .app-toast .toast-undo-btn:hover {
      background: color-mix(in srgb, var(--theme-primary, #60a5fa) 12%, transparent);
    }
    .app-toast .toast-undo-btn:active {
      background: color-mix(in srgb, var(--theme-primary, #60a5fa) 20%, transparent);
    }
    .app-toast .toast-undo-btn:focus-visible {
      outline: 2px solid var(--theme-primary, #60a5fa);
      outline-offset: 2px;
    }
    .app-toast.toast-out {
      animation: toast-exit 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
    }
  `;
  document.head.appendChild(style);
}

function dismissToast(toast: HTMLElement): void {
  toast.classList.add('toast-out');
  setTimeout(() => toast.remove(), 300);
}

type ToastVariant = 'success' | 'error' | 'info';

function createIcon(variant: ToastVariant): HTMLElement {
  const icon = document.createElement('div');
  icon.className = `toast-icon toast-icon--${variant}`;
  const symbols: Record<ToastVariant, string> = {
    success: '✓',
    error: '!',
    info: 'ℹ',
  };
  icon.textContent = symbols[variant];
  return icon;
}

export function showToast(
  message: string,
  duration = 1500,
  variant: ToastVariant = 'success'
): void {
  ensureToastStyles();
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.className = 'app-toast';
  // Fehler assertiv ansagen, sonst höflich.
  toast.setAttribute('role', variant === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', variant === 'error' ? 'assertive' : 'polite');

  toast.appendChild(createIcon(variant));

  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = message;
  toast.appendChild(text);

  container.appendChild(toast);
  setTimeout(() => dismissToast(toast), duration);
}

interface UndoToastOptions {
  onUndo: () => void;
  onCommit?: () => void;
  duration?: number;
}

export function showUndoToast(
  message: string,
  undoOrOptions: (() => void) | UndoToastOptions,
  maybeDuration?: number
): void {
  const opts: UndoToastOptions =
    typeof undoOrOptions === 'function'
      ? { onUndo: undoOrOptions, duration: maybeDuration ?? 4000 }
      : undoOrOptions;
  const { onUndo, onCommit, duration = 4000 } = opts;

  ensureToastStyles();
  const container = ensureContainer();

  // Stack-Limit: ältesten Undo-Toast committen, bevor ein neuer dazukommt.
  while (undoToasts.length >= MAX_UNDO_TOASTS) {
    undoToasts[0].commitNow();
  }

  const toast = document.createElement('div');
  toast.className = 'app-toast toast-interactive';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  toast.appendChild(createIcon('success'));

  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = message;
  toast.appendChild(text);

  const divider = document.createElement('div');
  divider.className = 'toast-divider';
  toast.appendChild(divider);

  const undoBtn = document.createElement('button');
  undoBtn.className = 'toast-undo-btn';
  undoBtn.type = 'button';
  undoBtn.textContent = t('Rückgängig');
  toast.appendChild(undoBtn);

  // Progress bar — driven by rAF for guaranteed smooth countdown
  const bar = document.createElement('div');
  bar.style.cssText = `
    position: absolute;
    bottom: 0; left: 0;
    height: 2px;
    width: 100%;
    background: var(--theme-primary, #60a5fa);
    opacity: 0.6;
    border-radius: 0 0 16px 16px;
    pointer-events: none;
  `;
  toast.appendChild(bar);

  container.appendChild(toast);

  // Jeder Toast verwaltet Timer/rAF/Commit selbst — kein globaler Zustand mehr,
  // dadurch beeinflusst ein Undo/Timeout nur den EIGENEN Toast.
  let settled = false;
  let rafId = 0;
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  const entry: UndoEntry = {
    el: toast,
    commitNow: () => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(rafId);
      if (dismissTimer) clearTimeout(dismissTimer);
      const idx = undoToasts.indexOf(entry);
      if (idx !== -1) undoToasts.splice(idx, 1);
      dismissToast(toast);
      if (onCommit) onCommit();
    },
  };
  undoToasts.push(entry);

  undoBtn.addEventListener('click', () => {
    if (settled) return;
    settled = true;
    cancelAnimationFrame(rafId);
    if (dismissTimer) clearTimeout(dismissTimer);
    const idx = undoToasts.indexOf(entry);
    if (idx !== -1) undoToasts.splice(idx, 1);
    dismissToast(toast);
    onUndo(); // Undo => kein Commit
  });

  const start = performance.now();
  const tick = () => {
    const elapsed = performance.now() - start;
    const pct = Math.max(0, 1 - elapsed / duration);
    bar.style.width = `${pct * 100}%`;
    if (pct > 0 && !settled) {
      rafId = requestAnimationFrame(tick);
    }
  };
  rafId = requestAnimationFrame(tick);

  dismissTimer = setTimeout(() => entry.commitNow(), duration);
}

interface ActionToastOptions {
  actionLabel: string;
  onAction: () => void;
  duration?: number;
  variant?: ToastVariant;
}

function ensureHintStyles(): void {
  if (document.getElementById('app-hint-style')) return;
  const style = document.createElement('style');
  style.id = 'app-hint-style';
  style.textContent = `
    @keyframes hint-enter {
      from { transform: translate(-50%, -16px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes hint-exit {
      from { transform: translate(-50%, 0); opacity: 1; }
      to { transform: translate(-50%, -12px); opacity: 0; }
    }
    .app-hint {
      position: fixed;
      top: calc(env(safe-area-inset-top, 0px) + 12px);
      left: 50%;
      transform: translate(-50%, 0);
      z-index: 100000;
      width: calc(100vw - 24px);
      max-width: 520px;
      box-sizing: border-box;
      padding: 14px 14px 14px 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      border-radius: 18px;
      background:
        linear-gradient(135deg,
          color-mix(in srgb, var(--theme-primary, #60a5fa) 22%, transparent),
          color-mix(in srgb, var(--theme-primary, #60a5fa) 6%, transparent)),
        rgba(18, 18, 28, 0.94);
      -webkit-backdrop-filter: var(--glass-filter-lg);
      backdrop-filter: var(--glass-filter-lg);
      border: 1px solid color-mix(in srgb, var(--theme-primary, #60a5fa) 55%, transparent);
      box-shadow:
        0 16px 48px rgba(0, 0, 0, 0.45),
        0 0 32px color-mix(in srgb, var(--theme-primary, #60a5fa) 25%, transparent);
      color: rgba(255, 255, 255, 0.95);
      font-family: var(--font-display, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
      -webkit-font-smoothing: antialiased;
      animation: hint-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .app-hint.hint-out {
      animation: hint-exit 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
    }
    .app-hint .hint-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--theme-primary, #60a5fa) 24%, transparent);
      color: var(--theme-primary, #60a5fa);
    }
    .app-hint .hint-body { flex: 1; min-width: 0; }
    .app-hint .hint-title { font-size: 14.5px; font-weight: 700; letter-spacing: -0.01em; }
    .app-hint .hint-text { font-size: 13px; opacity: 0.8; margin-top: 2px; line-height: 1.35; }
    .app-hint .hint-action {
      flex-shrink: 0;
      min-height: 44px;
      padding: 8px 16px;
      border: none;
      border-radius: 12px;
      background: var(--theme-primary, #60a5fa);
      color: #fff;
      font-size: 13.5px;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
    }
    .app-hint .hint-action:active { filter: brightness(0.85); }
    .app-hint .hint-close {
      flex-shrink: 0;
      width: 32px;
      min-width: 32px;
      height: 32px;
      min-height: 32px;
      padding: 0;
      margin-left: -6px;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }
    .app-hint .hint-close:active { background: rgba(255, 255, 255, 0.08); }
    .app-hint button:focus-visible {
      outline: 2px solid var(--theme-primary, #60a5fa);
      outline-offset: 2px;
    }
  `;
  document.head.appendChild(style);
}

const DONE_ALL_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>';

interface HintBannerOptions {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
  duration?: number;
}

/**
 * Hervorgehobener Hinweis oben am Bildschirm — bewusst getrennt vom
 * Toast-Stapel unten, damit er zwischen Undo-Toasts nicht untergeht.
 * Immer nur einer gleichzeitig.
 */
export function showHintBanner(options: HintBannerOptions): void {
  const { title, text, actionLabel, onAction, duration = 12000 } = options;
  ensureHintStyles();
  document.querySelectorAll('.app-hint').forEach((el) => el.remove());

  const hint = document.createElement('div');
  hint.className = 'app-hint';
  hint.setAttribute('role', 'status');
  hint.setAttribute('aria-live', 'polite');

  const icon = document.createElement('div');
  icon.className = 'hint-icon';
  icon.innerHTML = DONE_ALL_SVG;
  hint.appendChild(icon);

  const body = document.createElement('div');
  body.className = 'hint-body';
  const titleEl = document.createElement('div');
  titleEl.className = 'hint-title';
  titleEl.textContent = title;
  const textEl = document.createElement('div');
  textEl.className = 'hint-text';
  textEl.textContent = text;
  body.append(titleEl, textEl);
  hint.appendChild(body);

  const actionBtn = document.createElement('button');
  actionBtn.type = 'button';
  actionBtn.className = 'hint-action';
  actionBtn.textContent = actionLabel;
  const primary = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-primary')
    .trim();
  if (/^#[0-9a-f]{6}$/i.test(primary)) actionBtn.style.color = getOptimalTextColor(primary);
  hint.appendChild(actionBtn);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'hint-close';
  closeBtn.setAttribute('aria-label', t('Schließen'));
  closeBtn.textContent = '×';
  hint.appendChild(closeBtn);

  document.body.appendChild(hint);

  let settled = false;
  const close = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    hint.classList.add('hint-out');
    setTimeout(() => hint.remove(), 300);
  };
  const timer = setTimeout(close, duration);

  actionBtn.addEventListener('click', () => {
    if (settled) return;
    close();
    onAction();
  });
  closeBtn.addEventListener('click', close);
}

/**
 * Nicht blockierender, wegwischbarer Hinweis-Toast mit EINER Aktion (z. B.
 * „Bewerten"). Anders als {@link showUndoToast} unterbricht er keinen Ablauf:
 * er schließt automatisch nach `duration` ohne Nebenwirkung; nur ein Klick auf
 * den Aktions-Button löst `onAction` aus. Reine Anzeige/Interaktion — keine
 * Commit-/Undo-Semantik.
 */
export function showActionToast(message: string, options: ActionToastOptions): void {
  const { actionLabel, onAction, duration = 6000, variant = 'info' } = options;

  ensureToastStyles();
  const container = ensureContainer();

  const toast = document.createElement('div');
  toast.className = 'app-toast toast-interactive';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  toast.appendChild(createIcon(variant));

  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = message;
  toast.appendChild(text);

  const divider = document.createElement('div');
  divider.className = 'toast-divider';
  toast.appendChild(divider);

  const actionBtn = document.createElement('button');
  actionBtn.className = 'toast-undo-btn';
  actionBtn.type = 'button';
  actionBtn.textContent = actionLabel;
  toast.appendChild(actionBtn);

  container.appendChild(toast);

  let settled = false;
  const dismissTimer = setTimeout(() => {
    if (settled) return;
    settled = true;
    dismissToast(toast);
  }, duration);

  actionBtn.addEventListener('click', () => {
    if (settled) return;
    settled = true;
    clearTimeout(dismissTimer);
    dismissToast(toast);
    onAction();
  });
}
