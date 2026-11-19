/**
 * Kurzer Verbindungstest für die Start-Messung: lädt eine feste, nicht
 * komprimierbare Datei vom eigenen Server und liefert Latenz und Download-Rate.
 * So trägt jede Messzeile dieselben zwei Werte — egal ob die App-Dateien aus
 * dem Cache kamen oder der Browser seine Verbindungsart verrät.
 */
// Vite injiziert process.env.VITE_* via define() in vite.config.ts
declare const process: { env: Record<string, string | undefined> };

const PROBE_URL =
  (process.env.VITE_BACKEND_API_URL || 'https://api.tv-rank.de') + '/catalog/net-probe.bin';
/** Auf sehr langsamem Netz reicht der Anfang der Datei für eine Rate. */
const PROBE_TIMEOUT_MS = 4000;
/** Darunter misst man Paketgrenzen statt Durchsatz. */
const MIN_BYTES = 16_000;
/** Kürzere Messfenster sagen nur noch „schneller als das hier". */
const MIN_WINDOW_MS = 5;

export interface NetProbeResult {
  /** ms vom Abschicken bis zu den ersten Antwort-Bytes */
  lat?: number;
  /** Download-Rate in kbit/s */
  dn?: number;
}

export async function probeNetwork(): Promise<NetProbeResult> {
  const out: NetProbeResult = {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  let bytes = 0;
  let bodyStart = 0;
  let lastChunkAt = 0;
  try {
    const sentAt = performance.now();
    const res = await fetch(PROBE_URL, {
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });
    if (!res.ok) return out;
    bodyStart = performance.now();
    lastChunkAt = bodyStart;
    out.lat = Math.round(bodyStart - sentAt);
    const reader = res.body?.getReader();
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        lastChunkAt = performance.now();
      }
    } else {
      bytes = (await res.arrayBuffer()).byteLength;
      lastChunkAt = performance.now();
    }
  } catch {
    // Abbruch nach dem Zeitlimit oder kein Netz: gewertet wird, was bis dahin ankam.
  } finally {
    clearTimeout(timer);
  }
  if (bytes >= MIN_BYTES) {
    const windowMs = Math.max(lastChunkAt - bodyStart, MIN_WINDOW_MS);
    out.dn = Math.round((bytes * 8) / windowMs);
  }
  return out;
}
