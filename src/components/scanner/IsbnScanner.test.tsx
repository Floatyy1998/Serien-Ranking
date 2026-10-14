// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});

vi.mock('@mui/icons-material', () =>
  Object.fromEntries(
    ['Check', 'Close', 'FlashlightOff', 'FlashlightOn', 'Keyboard', 'NoPhotography'].map((n) => [
      n,
      () => null,
    ])
  )
);

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#3355ff',
      accent: '#ff5533',
      status: { success: '#22aa55', warning: '#ffaa00' },
    },
  }),
}));

vi.mock('../../lib/interaction/haptics', () => ({
  hapticSuccess: vi.fn(),
  hapticWarning: vi.fn(),
}));
vi.mock('../../hooks/ui/useAndroidBack', () => ({ useAndroidBack: vi.fn() }));

const { openCameraMock, createReaderMock, disposeMock } = vi.hoisted(() => ({
  openCameraMock: vi.fn(),
  createReaderMock: vi.fn(),
  disposeMock: vi.fn(),
}));

vi.mock('../../services/books/isbnScanner', () => ({
  openCamera: openCameraMock,
  createBarcodeReader: createReaderMock,
}));

import { IsbnScanner } from './IsbnScanner';

const cameraError = (name: string) => Object.assign(new Error(name), { name });

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn(async () => {});
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
  openCameraMock.mockRejectedValue(cameraError('NotAllowedError'));
  createReaderMock.mockResolvedValue({ read: vi.fn(async () => []), dispose: disposeMock });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('IsbnScanner', () => {
  it('rendert geschlossen nichts', () => {
    render(<IsbnScanner open={false} onClose={vi.fn()} onDetected={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('erklärt eine verweigerte Kamera und startet auf Wunsch neu', async () => {
    render(<IsbnScanner open onClose={vi.fn()} onDetected={vi.fn()} />);
    expect(await screen.findByText('Kein Zugriff auf die Kamera')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Nochmal versuchen'));
    await waitFor(() => expect(openCameraMock).toHaveBeenCalledTimes(2));
  });

  it('bietet ohne Kamera kein Wiederholen an', async () => {
    openCameraMock.mockRejectedValue(cameraError('NotFoundError'));
    render(<IsbnScanner open onClose={vi.fn()} onDetected={vi.fn()} />);
    expect(await screen.findByText('Keine Kamera gefunden')).toBeInTheDocument();
    expect(screen.queryByText('Nochmal versuchen')).toBeNull();
  });

  it('meldet einen Leser, der nicht lädt', async () => {
    openCameraMock.mockResolvedValue({
      stream: {} as MediaStream,
      torch: false,
      facing: 'environment',
      setTorch: vi.fn(),
      stop: vi.fn(),
    });
    createReaderMock.mockRejectedValue(new Error('offline'));
    render(<IsbnScanner open onClose={vi.fn()} onDetected={vi.fn()} />);
    expect(await screen.findByText('Der Scanner ließ sich nicht laden')).toBeInTheDocument();
  });

  it('scannt mit laufender Kamera und stoppt sie beim Schließen', async () => {
    const stop = vi.fn();
    openCameraMock.mockResolvedValue({
      stream: {} as MediaStream,
      torch: true,
      facing: 'environment',
      setTorch: vi.fn(async () => {}),
      stop,
    });
    const { unmount } = render(<IsbnScanner open onClose={vi.fn()} onDetected={vi.fn()} />);
    expect(
      await screen.findByText('Halte den Strichcode von der Buchrückseite in den Rahmen')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Licht an')).toBeInTheDocument();
    unmount();
    expect(stop).toHaveBeenCalled();
    await waitFor(() => expect(disposeMock).toHaveBeenCalled());
  });

  it('schließt mit Escape', async () => {
    const onClose = vi.fn();
    render(<IsbnScanner open onClose={onClose} onDetected={vi.fn()} />);
    await screen.findByText('Kein Zugriff auf die Kamera');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('gibt das Eintippen an den Aufrufer weiter', () => {
    const onManual = vi.fn();
    render(<IsbnScanner open onClose={vi.fn()} onDetected={vi.fn()} onManual={onManual} />);
    fireEvent.click(screen.getByText('ISBN eintippen'));
    expect(onManual).toHaveBeenCalled();
  });
});

describe('IsbnScanner mit Kamerabild', () => {
  const read = vi.fn();
  const setTorch = vi.fn(async () => {});
  const restore: (() => void)[] = [];
  const stub = <T extends object>(target: T, key: string, value: unknown) => {
    const original = Object.getOwnPropertyDescriptor(target, key);
    Object.defineProperty(target, key, { configurable: true, get: () => value });
    restore.push(() =>
      original ? Object.defineProperty(target, key, original) : delete (target as never)[key]
    );
  };

  beforeEach(() => {
    stub(HTMLMediaElement.prototype, 'readyState', 4);
    stub(HTMLVideoElement.prototype, 'videoWidth', 1080);
    stub(HTMLVideoElement.prototype, 'videoHeight', 1920);
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 390, height: 844 }) as DOMRect;
    restore.push(() => {
      Element.prototype.getBoundingClientRect = rect;
    });
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    openCameraMock.mockResolvedValue({
      stream: {} as MediaStream,
      torch: true,
      facing: 'environment',
      setTorch,
      stop: vi.fn(),
    });
    createReaderMock.mockResolvedValue({ read, dispose: disposeMock });
  });

  afterEach(() => {
    restore.splice(0).forEach((undo) => undo());
  });

  it('meldet eine zweimal gelesene ISBN', async () => {
    read.mockResolvedValue(['9783551551672']);
    const onDetected = vi.fn();
    render(<IsbnScanner open onClose={vi.fn()} onDetected={onDetected} />);
    expect(await screen.findByText('ISBN 978 355155167 2')).toBeInTheDocument();
    await waitFor(() => expect(onDetected).toHaveBeenCalledWith('9783551551672'));
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('weist auf Strichcodes hin, die keine ISBN sind', async () => {
    read.mockResolvedValue(['4006381333931']);
    const onDetected = vi.fn();
    render(<IsbnScanner open onClose={vi.fn()} onDetected={onDetected} />);
    expect(await screen.findByText('Das ist kein Buch-Strichcode')).toBeInTheDocument();
    expect(onDetected).not.toHaveBeenCalled();
  });

  it('zeigt einen Lesefehler als kaputten Scanner', async () => {
    read.mockRejectedValue(new Error('stopped'));
    render(<IsbnScanner open onClose={vi.fn()} onDetected={vi.fn()} />);
    expect(await screen.findByText('Der Scanner ließ sich nicht laden')).toBeInTheDocument();
  });

  it('schaltet das Licht', async () => {
    read.mockResolvedValue([]);
    render(<IsbnScanner open onClose={vi.fn()} onDetected={vi.fn()} />);
    fireEvent.click(await screen.findByLabelText('Licht an'));
    expect(setTorch).toHaveBeenCalledWith(true);
    expect(await screen.findByLabelText('Licht aus')).toBeInTheDocument();
  });
});
