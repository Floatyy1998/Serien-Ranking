import { nativeAppBuild } from '../app/nativeShell';

/** Erste Store-Builds mit Kamera-Erlaubnis (Info.plist bzw. AndroidManifest). */
const FIRST_CAMERA_BUILD: Record<string, number> = { ios: 34, android: 15 };

const READY_TIMEOUT_MS = 20_000;

export interface CameraHandle {
  stream: MediaStream;
  torch: boolean;
  facing: string | undefined;
  setTorch: (on: boolean) => Promise<void>;
  stop: () => void;
}

export interface BarcodeReader {
  read: (canvas: HTMLCanvasElement) => Promise<string[]>;
  dispose: () => void;
}

interface DetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

interface DetectorClass {
  new (options: { formats: string[] }): DetectorLike;
  getSupportedFormats: () => Promise<string[]>;
}

type TrackCapabilities = MediaTrackCapabilities & { torch?: boolean; focusMode?: string[] };

let availability: Promise<boolean> | null = null;

export function isbnScanAvailable(): Promise<boolean> {
  availability ??= (async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
    const native = await nativeAppBuild();
    if (native) return native.build >= (FIRST_CAMERA_BUILD[native.platform] ?? Infinity);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.length === 0 || devices.some((d) => d.kind === 'videoinput');
    } catch {
      return true;
    }
  })();
  return availability;
}

export async function openCamera(): Promise<CameraHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  const [track] = stream.getVideoTracks();
  const caps = (track?.getCapabilities?.() ?? {}) as TrackCapabilities;
  if (caps.focusMode?.includes('continuous')) {
    track
      .applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] })
      .catch(() => {});
  }
  return {
    stream,
    torch: !!caps.torch,
    facing: track?.getSettings().facingMode,
    setTorch: (on) =>
      track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }),
    stop: () => stream.getTracks().forEach((t) => t.stop()),
  };
}

async function nativeReader(): Promise<BarcodeReader | null> {
  const Detector = (globalThis as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
  if (!Detector) return null;
  try {
    if (!(await Detector.getSupportedFormats()).includes('ean_13')) return null;
    const detector = new Detector({ formats: ['ean_13'] });
    return {
      read: async (canvas) => (await detector.detect(canvas)).map((code) => code.rawValue),
      dispose: () => {},
    };
  } catch {
    return null;
  }
}

function wasmReader(): Promise<BarcodeReader> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../../workers/barcode.worker.ts', import.meta.url), {
      type: 'module',
    });
    const pending = new Map<number, { done: (texts: string[]) => void; fail: () => void }>();
    let next = 0;
    let dead = false;
    const shutDown = () => {
      dead = true;
      worker.terminate();
      pending.forEach(({ fail }) => fail());
      pending.clear();
    };
    const fail = () => {
      clearTimeout(timer);
      shutDown();
      reject(new Error('barcode reader unavailable'));
    };
    const timer = setTimeout(fail, READY_TIMEOUT_MS);
    const reader: BarcodeReader = {
      read: (canvas) => {
        if (dead) return Promise.reject(new Error('barcode reader stopped'));
        const image = canvas
          .getContext('2d', { willReadFrequently: true })
          ?.getImageData(0, 0, canvas.width, canvas.height);
        if (!image) return Promise.resolve([]);
        const id = ++next;
        return new Promise((done, failRead) => {
          pending.set(id, { done, fail: () => failRead(new Error('barcode reader stopped')) });
          worker.postMessage({ id, image }, [image.data.buffer]);
        });
      },
      dispose: shutDown,
    };
    worker.onerror = fail;
    worker.onmessage = ({
      data,
    }: MessageEvent<{ type: string; id?: number; texts?: string[] }>) => {
      if (data.type === 'ready') {
        clearTimeout(timer);
        resolve(reader);
      } else if (data.type === 'failed') {
        fail();
      } else if (data.type === 'result' && data.id !== undefined) {
        pending.get(data.id)?.done(data.texts ?? []);
        pending.delete(data.id);
      }
    };
  });
}

/** Chromes eingebauter BarcodeDetector, wo es ihn gibt — sonst zxing als WASM im Worker. */
export async function createBarcodeReader(): Promise<BarcodeReader> {
  return (await nativeReader()) ?? wasmReader();
}
