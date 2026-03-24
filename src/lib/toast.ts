let activeToast: HTMLElement | null = null;

export function showToast(message: string, duration = 1500): void {
  if (activeToast) {
    activeToast.remove();
  }

  if (!document.getElementById('app-toast-style')) {
    const style = document.createElement('style');
    style.id = 'app-toast-style';
    style.textContent = `
      @keyframes toast-slide-up {
        from { transform: translateX(-50%) translateY(100%); opacity: 0 }
        to { transform: translateX(-50%) translateY(0); opacity: 1 }
      }
      @keyframes toast-fade-out {
        from { opacity: 1 }
        to { opacity: 0 }
      }
      #app-toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        padding: 12px 20px;
        background: rgba(30, 30, 40, 0.85);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.1px;
        animation: toast-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
        -webkit-font-smoothing: antialiased;
        white-space: nowrap;
        pointer-events: none;
      }
      #app-toast.toast-out {
        animation: toast-fade-out 0.3s ease forwards;
      }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  activeToast = toast;

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => {
      toast.remove();
      if (activeToast === toast) activeToast = null;
    }, 300);
  }, duration);
}
