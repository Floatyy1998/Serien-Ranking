import { t } from '../i18n';

/** Dezente Update-Pille: Tap wendet sofort an, X blendet aus (Update kommt dann unsichtbar später). */
export function showUpdatePill(onApply: () => void): void {
  if (document.getElementById('sw-update-banner')) return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes sw-slide-up {
      from { transform: translateY(100%); opacity: 0 }
      to { transform: translateY(0); opacity: 1 }
    }
    #sw-update-banner {
      position: fixed;
      bottom: 96px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px 10px 18px;
      background: rgba(20, 22, 28, 0.88);
      -webkit-backdrop-filter: var(--glass-filter-lg);
      backdrop-filter: var(--glass-filter-lg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.1px;
      animation: sw-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
      -webkit-font-smoothing: antialiased;
      white-space: nowrap;
    }
    #sw-update-banner .sw-apply {
      border: none;
      border-radius: 999px;
      padding: 7px 14px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      color: #000;
      background: var(--theme-primary, #ef6f8a);
    }
    #sw-update-banner .sw-close {
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.45);
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
      padding: 6px;
    }
  `;
  document.head.appendChild(style);
  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.innerHTML =
    `<span>${t('Neue Version verfügbar')}</span>` +
    `<button class="sw-apply" type="button">${t('Aktualisieren')}</button>` +
    `<button class="sw-close" type="button" aria-label="${t('Später')}">✕</button>`;
  banner.querySelector('.sw-apply')?.addEventListener('click', () => {
    banner.remove();
    onApply();
  });
  banner.querySelector('.sw-close')?.addEventListener('click', () => banner.remove());
  document.body.appendChild(banner);
}
