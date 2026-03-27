let activeToast: HTMLElement | null = null;
let activeDismissTimer: ReturnType<typeof setTimeout> | null = null;

function clearActiveToast(): void {
  if (activeDismissTimer) {
    clearTimeout(activeDismissTimer);
    activeDismissTimer = null;
  }
  if (activeToast) {
    activeToast.remove();
    activeToast = null;
  }
}

function ensureToastStyles(): void {
  if (document.getElementById('app-toast-style')) return;
  const style = document.createElement('style');
  style.id = 'app-toast-style';
  style.textContent = `
    @keyframes toast-enter {
      from {
        transform: translateX(-50%) translateY(20px) scale(0.92);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0) scale(1);
        opacity: 1;
      }
    }
    @keyframes toast-exit {
      from {
        transform: translateX(-50%) translateY(0) scale(1);
        opacity: 1;
      }
      to {
        transform: translateX(-50%) translateY(10px) scale(0.95);
        opacity: 0;
      }
    }
    #app-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      min-width: min(90vw, 200px);
      max-width: calc(100vw - 48px);
      width: 90vw;
      padding: 14px 18px;
      background: linear-gradient(
        135deg,
        rgba(20, 20, 30, 0.92) 0%,
        rgba(30, 30, 45, 0.92) 100%
      );
      backdrop-filter: blur(24px) saturate(1.6);
      -webkit-backdrop-filter: blur(24px) saturate(1.6);
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
    }
    #app-toast.toast-interactive {
      pointer-events: auto;
      cursor: default;
    }
    #app-toast .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 15px;
    }
    #app-toast .toast-icon--success {
      background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08));
      color: #4ade80;
    }
    #app-toast .toast-icon--error {
      background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08));
      color: #f87171;
    }
    #app-toast .toast-icon--info {
      background: linear-gradient(135deg,
        color-mix(in srgb, var(--theme-primary, #60a5fa) 20%, transparent),
        color-mix(in srgb, var(--theme-primary, #60a5fa) 8%, transparent));
      color: var(--theme-primary, #60a5fa);
    }
    #app-toast .toast-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #app-toast .toast-divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.12);
      flex-shrink: 0;
    }
    #app-toast .toast-undo-btn {
      background: none;
      border: none;
      color: var(--theme-primary, #60a5fa);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 8px;
      transition: background 0.15s ease;
      white-space: nowrap;
      flex-shrink: 0;
      letter-spacing: 0.01em;
    }
    #app-toast .toast-undo-btn:hover {
      background: color-mix(in srgb, var(--theme-primary, #60a5fa) 12%, transparent);
    }
    #app-toast .toast-undo-btn:active {
      background: color-mix(in srgb, var(--theme-primary, #60a5fa) 20%, transparent);
    }
    #app-toast.toast-out {
      animation: toast-exit 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
    }
  `;
  document.head.appendChild(style);
}

function dismissToast(toast: HTMLElement): void {
  toast.classList.add('toast-out');
  setTimeout(() => {
    toast.remove();
    if (activeToast === toast) activeToast = null;
  }, 300);
}

type ToastVariant = 'success' | 'error' | 'info';

function createIcon(variant: ToastVariant): HTMLElement {
  const icon = document.createElement('div');
  icon.className = `toast-icon toast-icon--${variant}`;
  const symbols: Record<ToastVariant, string> = {
    success: '\u2713',
    error: '!',
    info: '\u2139',
  };
  icon.textContent = symbols[variant];
  return icon;
}

export function showToast(
  message: string,
  duration = 1500,
  variant: ToastVariant = 'success'
): void {
  clearActiveToast();
  ensureToastStyles();

  const toast = document.createElement('div');
  toast.id = 'app-toast';

  toast.appendChild(createIcon(variant));

  const text = document.createElement('span');
  text.className = 'toast-text';
  text.textContent = message;
  toast.appendChild(text);

  document.body.appendChild(toast);
  activeToast = toast;
  activeDismissTimer = setTimeout(() => dismissToast(toast), duration);
}

export function showUndoToast(message: string, onUndo: () => void, duration = 4000): void {
  clearActiveToast();
  ensureToastStyles();

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.classList.add('toast-interactive');

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
  undoBtn.textContent = 'Rückgängig';
  undoBtn.addEventListener('click', () => {
    onUndo();
    clearActiveToast();
  });
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

  document.body.appendChild(toast);
  activeToast = toast;

  const start = performance.now();
  let rafId = 0;
  const tick = () => {
    const elapsed = performance.now() - start;
    const pct = Math.max(0, 1 - elapsed / duration);
    bar.style.width = `${pct * 100}%`;
    if (pct > 0 && activeToast === toast) {
      rafId = requestAnimationFrame(tick);
    }
  };
  rafId = requestAnimationFrame(tick);

  activeDismissTimer = setTimeout(() => {
    cancelAnimationFrame(rafId);
    dismissToast(toast);
  }, duration);
}
