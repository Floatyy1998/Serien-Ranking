import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

const scope = self as unknown as {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<{ id: number; image: ImageData }>) => void) | null;
};

const ready = prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? wasmUrl : prefix + path,
  },
  fireImmediately: true,
});

ready.then(
  () => scope.postMessage({ type: 'ready' }),
  () => scope.postMessage({ type: 'failed' })
);

scope.onmessage = async ({ data: { id, image } }) => {
  try {
    await ready;
    const results = await readBarcodes(image, {
      formats: ['EAN13'],
      tryHarder: true,
      tryRotate: true,
      tryInvert: false,
      maxNumberOfSymbols: 1,
    });
    scope.postMessage({
      type: 'result',
      id,
      texts: results.filter((r) => r.isValid).map((r) => r.text),
    });
  } catch {
    scope.postMessage({ type: 'result', id, texts: [] });
  }
};
