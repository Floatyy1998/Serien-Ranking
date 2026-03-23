/**
 * 🚀 Service Worker Manager für Serien-Ranking
 * Koordiniert Service Worker Registration und Cache-Management
 */

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

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.init();
  }

  /**
   * 🔧 Service Worker Initialisierung
   */
  private async init(): Promise<void> {
    if (!this.isSupported) {
      // // console.warn(
      //   '⚠️ Service Worker wird von diesem Browser nicht unterstützt'
      // );
      return;
    }

    try {
      await this.register();
      this.setupEventListeners();
      // Update checks: nach 5s, dann alle 5 Minuten, und bei Tab-Fokus
      setTimeout(() => this.checkForUpdates(), 5000);
      setInterval(() => this.checkForUpdates(), 5 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.checkForUpdates();
      });
    } catch (error) {
      // // console.error(
      //   '❌ Service Worker Manager Initialisierung fehlgeschlagen:',
      //   error
      // );
    }
  }

  /**
   * 📝 Service Worker Registration
   */
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

    // Waiting worker on page load → direkt aktivieren
    if (registration.waiting && navigator.serviceWorker.controller) {
      console.log('[SW] Wartender Worker beim Laden — aktiviere');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Mid-session update → show banner, then auto-reload
    registration.addEventListener('updatefound', () => {
      console.log('[SW] updatefound — warte auf Installation...');
      this.showUpdateBanner();
      const poll = setInterval(() => {
        if (registration.waiting) {
          clearInterval(poll);
          console.log('[SW] Worker bereit — aktiviere und reloade');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }, 500);
      setTimeout(() => clearInterval(poll), 120_000);
    });

    return registration;
  }

  /**
   * 🎧 Event Listeners Setup
   */
  private setupEventListeners(): void {
    if (!navigator.serviceWorker) return;

    // Flag vom letzten Reload sofort entfernen (damit der nächste Update-Reload funktioniert)
    sessionStorage.removeItem('sw-reloaded');

    // Bei Controller-Wechsel neu laden
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const reloadFlag = sessionStorage.getItem('sw-reloaded');
      if (!reloadFlag) {
        sessionStorage.setItem('sw-reloaded', 'true');
        window.location.reload();
      }
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleWorkerMessage(event.data);
    });
  }

  /**
   * 💬 Worker Message Handler
   */
  private handleWorkerMessage(data: Record<string, unknown>): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        // // console.log('📦 Cache aktualisiert:', data.version);
        break;
      case 'SW_UPDATED':
        // // console.log('🆕 Service Worker aktualisiert:', data.version);
        this.notifyUpdateComplete();
        break;
      case 'OFFLINE_READY':
        this.notifyOfflineReady();
        break;
      case 'UPDATE_AVAILABLE':
        // Auto-update: direkt aktivieren
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        });
        break;
    }
  }

  /**
   * 🔄 Service Worker Update
   */
  public async updateServiceWorker(): Promise<void> {
    try {
      const registration = await this.registrationPromise;
      if (!registration) return;

      // Forciere ein Update
      await registration.update();

      if (registration.waiting) {
        // Aktiviere wartenden Worker
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Warte auf Aktivierung
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
    } catch (error) {
      // // console.error('❌ Service Worker Update fehlgeschlagen:', error);
    }
  }

  /**
   * 🔍 Prüfe auf Service Worker Updates
   */
  private async checkForUpdates(): Promise<void> {
    try {
      const registration = await this.registrationPromise;
      if (!registration) return;

      // Wartender Worker da? → direkt aktivieren
      if (registration.waiting) {
        console.log('[SW] Wartender Worker gefunden — aktiviere');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }

      await registration.update();
    } catch (error) {
      console.warn('[SW] Update-Check fehlgeschlagen:', error);
    }
  }

  /**
   * 📦 Firebase Daten Cache Management
   */
  public cacheFirebaseData(path: string, data: unknown): void {
    this.postMessage({
      type: 'CACHE_FIREBASE_DATA',
      data: { path, data },
    });
  }

  /**
   * 🗑️ Cache Management
   */
  public async clearCache(cacheName?: string): Promise<void> {
    this.postMessage({
      type: 'CLEAR_CACHE',
      data: { cacheName },
    });
  }

  /**
   * 📊 Cache Status abrufen
   */
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

  /**
   * 🔄 Background Sync registrieren
   */
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
    } catch (error) {
      // // console.error('❌ Background Sync Registration fehlgeschlagen:', error);
    }
  }

  /**
   * 💾 Offline Update Queue Management
   */
  public async queueFirebaseUpdate(update: Omit<PendingUpdate, 'id' | 'timestamp'>): Promise<void> {
    const pendingUpdate: PendingUpdate = {
      ...update,
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    try {
      await this.storeInIndexedDB('pendingUpdates', pendingUpdate);
      await this.registerBackgroundSync('firebase-sync');
    } catch (error) {
      // // console.error('❌ Failed to queue Firebase update:', error);
    }
  }

  /**
   * 📱 PWA Install Prompt
   */
  public async showInstallPrompt(): Promise<boolean> {
    if ('beforeinstallprompt' in window) {
      // PWA Install Logic hier implementieren
      return true;
    }
    return false;
  }

  /**
   * 🗄️ IndexedDB Helper
   */
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

  /**
   * 💬 Message an Service Worker senden
   */
  private postMessage(message: Record<string, unknown>, transfer?: Transferable[]): void {
    if (navigator.serviceWorker.controller) {
      if (transfer) {
        navigator.serviceWorker.controller.postMessage(message, { transfer });
      } else {
        navigator.serviceWorker.controller.postMessage(message);
      }
    }
  }

  /**
   * 🔔 UI Notifications
   */
  private showUpdateBanner(): void {
    if (document.getElementById('sw-update-banner')) return;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes sw-slide-down { from { transform: translateY(-100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      @keyframes sw-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      #sw-update-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 16px;
        background: var(--theme-primary, #8b5cf6);
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.2px;
        animation: sw-slide-down 0.3s ease-out;
        -webkit-font-smoothing: antialiased;
      }
      #sw-update-banner .sw-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #fff;
        animation: sw-pulse 1s ease-in-out infinite;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.innerHTML = '<span class="sw-dot"></span> Update wird installiert…';
    document.body.appendChild(banner);
  }

  private notifyOfflineReady(): void {
    // Optional: Custom Event für UI Components
    window.dispatchEvent(new CustomEvent('sw-offline-ready'));
  }

  private notifyUpdateComplete(): void {
    // Benachrichtigung über abgeschlossenes Update
    window.dispatchEvent(
      new CustomEvent('sw-update-complete', {
        detail: {
          message: 'Update erfolgreich installiert',
        },
      })
    );
  }

  /**
   * 📊 Public API für Cache Statistics
   */
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

  /**
   * 🎯 Public API für Online/Offline Status
   */
  public get isOnline(): boolean {
    return navigator.onLine;
  }

  public onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Singleton Instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Type Exports
export type { CacheStatus, PendingUpdate };
