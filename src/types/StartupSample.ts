export type StartupPlatform = 'ios' | 'android' | 'electron' | 'pwa' | 'web';

/** Ein gemessener App-Start. Kurze Schlüssel, weil jede Zeile in der RTDB liegt. */
export interface StartupSample {
  /** Konto — steht im Pfad, nicht in der Zeile */
  u: string;
  /** Serverzeit des Eintrags */
  ts: number;
  /** ms von der Navigation bis der Splash weg ist */
  t: number;
  /** ms bis der App-Code läuft — solange ist der Bildschirm leer */
  js: number;
  /** ms bis die Anmeldung steht */
  a?: number;
  /** ms bis die Daten da sind */
  d?: number;
  /** ms bis die Seite fertig aufgebaut ist */
  r?: number;
  p: StartupPlatform;
  /** Build-Kennung */
  b: string;
  /** Gemessene Download-Rate der App-Dateien in kbit/s (fehlt, wenn alles aus dem Cache kam) */
  kbps?: number;
  /** Übertragene App-Dateien in kB */
  kb?: number;
  /** Anteil der App-Dateien aus dem Cache in Prozent */
  hit?: number;
  /** Antwortzeit des Servers auf die Startseite in ms */
  ttfb?: number;
  /** Verbindungsart laut Browser (nur Chrome/Android) */
  ct?: string;
  /** Downlink laut Browser in Mbit/s */
  dl?: number;
  /** Round-Trip laut Browser in ms */
  rtt?: number;
}
