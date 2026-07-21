/**
 * On-Device-Spracherkennung über die Chrome LanguageDetector-API (falls das
 * Modell bereits installiert ist — es wird nie ein Download angestoßen).
 * Liefert null, wenn nicht verfügbar oder unsicher.
 */

interface DetectorResult {
  detectedLanguage?: string;
  confidence?: number;
}

interface LanguageDetectorLike {
  detect: (text: string) => Promise<DetectorResult[]>;
}

interface LanguageDetectorStatic {
  availability: () => Promise<string>;
  create: () => Promise<LanguageDetectorLike>;
}

let detectorPromise: Promise<LanguageDetectorLike | null> | null = null;

const getDetector = (): Promise<LanguageDetectorLike | null> => {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      try {
        const LD = (globalThis as { LanguageDetector?: LanguageDetectorStatic }).LanguageDetector;
        if (!LD?.availability) return null;
        if ((await LD.availability()) !== 'available') return null;
        return await LD.create();
      } catch {
        return null;
      }
    })();
  }
  return detectorPromise;
};

export async function detectLanguageViaBrowser(text: string): Promise<string | null> {
  try {
    const detector = await getDetector();
    if (!detector) return null;
    const results = await detector.detect(text.slice(0, 500));
    const top = results?.[0];
    if (!top || typeof top.detectedLanguage !== 'string') return null;
    if ((top.confidence ?? 0) < 0.5) return null;
    const code = top.detectedLanguage.toLowerCase();
    return code && code !== 'und' ? code.slice(0, 2) : null;
  } catch {
    return null;
  }
}
