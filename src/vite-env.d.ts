/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APIKEY: string;
  readonly VITE_AUTHDOMAIN: string;
  readonly VITE_DATABASEURL: string;
  readonly VITE_PROJECTID: string;
  readonly VITE_STORAGEBUCKET: string;
  readonly VITE_MESSAGINGSENDERID: string;
  readonly VITE_APPID: string;
  readonly VITE_MEASUREMENTID: string;
  readonly VITE_API_TMDB: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type ElectronUpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'downloading'; version?: string; percent?: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string };

interface Window {
  electronAPI?: {
    isElectron: boolean;
    getAutoStart: () => Promise<boolean>;
    setAutoStart: (enabled: boolean) => Promise<boolean>;
    onUpdateStatus: (cb: (status: ElectronUpdateStatus) => void) => () => void;
    installUpdate: () => Promise<void>;
    checkForUpdates: () => Promise<unknown>;
  };
}
