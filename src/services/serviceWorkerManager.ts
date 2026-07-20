import { t } from './i18n';

interface CacheStatus {
  caches: Array<{
    name: string;
    size: number;
    items: string[];
  }>;
  timestamp: number;
}

interface PendingUpdate {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

class ServiceWorkerManager {
  private worker: ServiceWorker | null = null;
  private isSupported: boolean = false;
  private registrationPromise: Promise<ServiceWorkerRegistration> | null = null;
  private updateCheckInterval: ReturnType<typeof setInterval> | null = null;
  private updateCheckTimeout: ReturnType<typeof setTimeout> | null = null;
  private visibilityHandler: (() => void) | null = null;
  private eventListenersAttached = false;
  // Update-Fluss: neuer Worker wartet; wir aktivieren ihn nur gezielt
  private updateReadyHandled = false;
  private intentionalActivation = false;
  private hiddenApplyHandler: (() => void) | null = null;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.init();
  }

  private async init(): Promise<void> {
    if (!this.isSupported) return;

    try {
      await this.register();
      this.setupEventListeners();
      // Update checks: nach 5s, dann alle 5 Minuten, und bei Tab-Fokus
      if (this.updateCheckTimeout) clearTimeout(this.updateCheckTimeout);
      this.updateCheckTimeout = setTimeout(() => this.checkForUpdates(), 5000);
      if (this.updateCheckInterval) clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = setInterval(() => this.checkForUpdates(), 5 * 60 * 1000);
      if (!this.visibilityHandler) {
        this.visibilityHandler = () => {
          if (document.visibilityState === 'visible') this.checkForUpdates();
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);
      }
    } catch {
      // ignore — service worker registration failures are non-fatal
    }
  }

  private async register(): Promise<ServiceWorkerRegistration> {
    if (this.registrationPromise) {
      return this.registrationPromise;
    }

    // Use Vite PWA's sw.js instead of legacy service-worker.js
    const swUrl = '/sw.js';

    this.registrationPromise = navigator.serviceWorker.register(swUrl, {
      scope: '/',
      updateViaCache: 'none', // Browser soll selbst prüfen ob Update nötig ist
    });

    const registration = await this.registrationPromise;

    // Wartender Worker beim Seitenstart → Update bereit, aber KEIN Reload (Pille bzw. Hidden-Apply).
    if (registration.waiting && navigator.serviceWorker.controller) {
      this.onUpdateReady(registration);
    }

    // Mid-session: "installed" + bestehender Controller = Update, kein Erstbesuch.
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          this.onUpdateReady(registration);
        }
      });
    });

    return registration;
  }

  /** Update bereit: Pille anbieten + automatisch anwenden, sobald der Tab unsichtbar ist. */
  private onUpdateReady(registration: ServiceWorkerRegistration): void {
    if (this.updateReadyHandled) return;
    this.updateReadyHandled = true;

    this.showUpdatePill(() => this.applyUpdate(registration));

    if (!this.hiddenApplyHandler) {
      this.hiddenApplyHandler = () => {
        if (document.visibilityState === 'hidden') {
          this.applyUpdate(registration);
        }
      };
      document.addEventListener('visibilitychange', this.hiddenApplyHandler);
      // pagehide fängt den App-Wechsel auf iOS zuverlässiger als visibilitychange
      window.addEventListener('pagehide', this.hiddenApplyHandler);
    }
  }

  /** Wartenden Worker aktivieren — der Reload folgt im controllerchange-Handler. */
  private applyUpdate(registration: ServiceWorkerRegistration): void {
    if (!registration.waiting) return;
    this.intentionalActivation = true;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    if (this.hiddenApplyHandler) {
      document.removeEventListener('visibilitychange', this.hiddenApplyHandler);
      window.removeEventListener('pagehide', this.hiddenApplyHandler);
      this.hiddenApplyHandler = null;
    }
  }

  private setupEventListeners(): void {
    if (!navigator.serviceWorker) return;
    if (this.eventListenersAttached) return;
    this.eventListenersAttached = true;

    // Flag vom letzten Reload sofort entfernen (damit der nächste Update-Reload funktioniert)
    sessionStorage.removeItem('sw-reloaded');

    // Reload NUR bei selbst ausgelöster Aktivierung — Erstinstallation/clientsClaim reloadet nicht.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!this.intentionalActivation) return;
      const reloadFlag = sessionStorage.getItem('sw-reloaded');
      if (!reloadFlag) {
        sessionStorage.setItem('sw-reloaded', 'true');
        window.location.reload();
      }
    });

    // iOS friert die App vor dem unsichtbaren Reload ein (alte Seite unter neuem Worker → Chunk-Crash) — deshalb beim Aufwachen nachziehen.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (!this.intentionalActivation) return;
      if (sessionStorage.getItem('sw-reloaded')) return;
      sessionStorage.setItem('sw-reloaded', 'true');
      window.location.reload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleWorkerMessage(event.data);
    });
  }

  private handleWorkerMessage(data: Record<string, unknown>): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        break;
      case 'SW_UPDATED':
        this.notifyUpdateComplete();
        break;
      case 'OFFLINE_READY':
        this.notifyOfflineReady();
        break;
      case 'UPDATE_AVAILABLE':
        // Update bereit → Pille + Hidden-Apply statt Zwangs-Aktivierung
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg?.waiting) this.onUpdateReady(reg);
        });
        break;
    }
  }

  public async updateServiceWorker(): Promise<void> {
    try {
      const registration = await this.registrationPromise;
      if (!registration) return;

      await registration.update();

      if (registration.waiting) {
        // Explizit angefordertes Update: gezielt aktivieren, der Reload ist hier gewollt.
        this.applyUpdate(registration);

        await new Promise<void>((resolve) => {
          const checkState = () => {
            if (registration.active) {
              resolve();
            } else {
              setTimeout(checkState, 100);
            }
          };
          checkState();
        });
      }
    } catch {
      // ignore — fallback path is automatic re-check on next visibility-change
    }
  }

  private async checkForUpdates(): Promise<void> {
    try {
      const registration = await this.registrationPromise;
      if (!registration) return;

      // Wartender Worker da? → Update bereitstellen (Pille + Hidden-Apply)
      if (registration.waiting && navigator.serviceWorker.controller) {
        this.onUpdateReady(registration);
        return;
      }

      await registration.update();
    } catch (error) {
      console.warn('[SW] Update-Check fehlgeschlagen:', error);
    }
  }

  public cacheFirebaseData(path: string, data: unknown): void {
    this.postMessage({
      type: 'CACHE_FIREBASE_DATA',
      data: { path, data },
    });
  }

  public async clearCache(cacheName?: string): Promise<void> {
    this.postMessage({
      type: 'CLEAR_CACHE',
      data: { cacheName },
    });
  }

  public async getCacheStatus(): Promise<CacheStatus | null> {
    if (!this.worker) return null;

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.postMessage({ type: 'GET_CACHE_STATUS' }, [channel.port2]);
    });
  }

  public async registerBackgroundSync(tag: string): Promise<void> {
    try {
      const registration = await this.registrationPromise;
      if (!registration) return;

      if ('sync' in registration) {
        await (
          registration as ServiceWorkerRegistration & {
            sync: { register(tag: string): Promise<void> };
          }
        ).sync.register(tag);
      }
    } catch {
      // ignore — Background Sync API isn't critical, retries happen on next page visit
    }
  }

  public async queueFirebaseUpdate(update: Omit<PendingUpdate, 'id' | 'timestamp'>): Promise<void> {
    const pendingUpdate: PendingUpdate = {
      ...update,
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    try {
      await this.storeInIndexedDB('pendingUpdates', pendingUpdate);
      await this.registerBackgroundSync('firebase-sync');
    } catch {
      // ignore — IndexedDB queue failure leaves the update to be retried next session
    }
  }

  public async showInstallPrompt(): Promise<boolean> {
    if ('beforeinstallprompt' in window) {
      // PWA Install Logic hier implementieren
      return true;
    }
    return false;
  }

  private async storeInIndexedDB(storeName: string, data: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SerienRankingDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        const addRequest = store.add(data);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      };
    });
  }

  private postMessage(message: Record<string, unknown>, transfer?: Transferable[]): void {
    if (navigator.serviceWorker.controller) {
      if (transfer) {
        navigator.serviceWorker.controller.postMessage(message, { transfer });
      } else {
        navigator.serviceWorker.controller.postMessage(message);
      }
    }
  }

  /** Dezente Update-Pille: Tap wendet sofort an, X blendet aus (Update kommt dann unsichtbar später). */
  private showUpdatePill(onApply: () => void): void {
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
        background: var(--theme-primary, #00d123);
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

  private notifyOfflineReady(): void {
    window.dispatchEvent(new CustomEvent('sw-offline-ready'));
  }

  private notifyUpdateComplete(): void {
    window.dispatchEvent(
      new CustomEvent('sw-update-complete', {
        detail: {
          message: t('Update erfolgreich installiert'),
        },
      })
    );
  }

  public async getCacheStatistics(): Promise<{
    totalSize: number;
    cacheCount: number;
    lastUpdate: number;
  }> {
    const status = await this.getCacheStatus();
    if (!status) {
      return { totalSize: 0, cacheCount: 0, lastUpdate: 0 };
    }

    const totalSize = status.caches.reduce((sum, cache) => sum + cache.size, 0);
    return {
      totalSize,
      cacheCount: status.caches.length,
      lastUpdate: status.timestamp,
    };
  }

  public get isOnline(): boolean {
    return navigator.onLine;
  }

  public onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
