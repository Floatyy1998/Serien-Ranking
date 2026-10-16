import { PAGE_REPLACING_EVENT } from '../../lib/errorReport/pageReplacing';
import { t } from '../i18n';
import { isNativeApp } from './nativeShell';
import { showUpdatePill } from './updatePill';

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
  private retryOnlineHandler: (() => void) | null = null;
  private interacted = false;

  constructor() {
    if (typeof document !== 'undefined') {
      const markInteraction = () => {
        this.interacted = true;
      };
      document.addEventListener('pointerdown', markInteraction, { capture: true, once: true });
      document.addEventListener('keydown', markInteraction, { capture: true, once: true });
    }
    // In der nativen Huelle KEIN Service Worker. Die Android-WebView bietet
    // navigator.serviceWorker zwar an, verweigert dem Worker aber den Storage
    // ("Failed to access storage") — die Registrierung schlaegt also immer fehl.
    // Gebraucht wird er dort ohnehin nicht: die Huelle laedt die Live-Site, und
    // gegen Deploy-Bruch schuetzt bereits preloadRoutes(). iOS faellt schon
    // vorher raus, weil WKWebView serviceWorker gar nicht kennt.
    this.isSupported = 'serviceWorker' in navigator && !isNativeApp();
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
      // Registrierung gescheitert (fast immer: beim Start kein Netz). Das ist
      // nicht toedlich, darf die Sitzung aber nicht dauerhaft ohne Worker und
      // ohne Update-Pruefung lassen — also einmal neu versuchen, sobald die
      // Verbindung zurueck ist.
      this.retryWhenOnline();
    }
  }

  /** Einmaliger Neuversuch, sobald der Browser wieder online meldet. */
  private retryWhenOnline(): void {
    if (this.retryOnlineHandler || typeof window === 'undefined') return;
    const handler = () => {
      window.removeEventListener('online', handler);
      this.retryOnlineHandler = null;
      void this.init();
    };
    this.retryOnlineHandler = handler;
    window.addEventListener('online', handler);
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

    let registration: ServiceWorkerRegistration;
    try {
      registration = await this.registrationPromise;
    } catch (err) {
      // Scheitert die Registrierung (typisch: beim Start kein Netz), darf das
      // abgelehnte Versprechen nicht liegen bleiben. Sonst gibt register() es
      // fuer den Rest der Sitzung zurueck und die App verliert dauerhaft ihren
      // Update-Weg, obwohl die Verbindung laengst wieder steht.
      this.registrationPromise = null;
      throw err;
    }

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

    // Frischer Start ohne Eingabe: sofort übernehmen. Auf Android feuert „hidden“ beim
    // Wegwischen oft nicht mehr, der Worker würde sonst über mehrere Starts warten.
    if (!this.interacted && document.visibilityState === 'visible' && performance.now() < 30000) {
      this.applyUpdate(registration);
      return;
    }

    showUpdatePill(() => this.applyUpdate(registration));

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
    window.dispatchEvent(new Event(PAGE_REPLACING_EVENT));
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
    if (!this.isSupported || !navigator.serviceWorker.controller) return null;

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
    if (!this.isSupported) return;
    if (navigator.serviceWorker.controller) {
      if (transfer) {
        navigator.serviceWorker.controller.postMessage(message, { transfer });
      } else {
        navigator.serviceWorker.controller.postMessage(message);
      }
    }
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
