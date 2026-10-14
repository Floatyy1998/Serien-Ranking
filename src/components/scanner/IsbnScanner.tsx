import {
  Check,
  Close,
  FlashlightOff,
  FlashlightOn,
  Keyboard,
  NoPhotography,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAndroidBack } from '../../hooks/ui/useAndroidBack';
import {
  cameraProblemOf,
  coverSourceRect,
  createReadConfirmer,
  expandRect,
  formatIsbn13,
  isbnFromBarcode,
  type CameraProblem,
} from '../../lib/books/isbnScan';
import { hapticSuccess, hapticWarning } from '../../lib/interaction/haptics';
import { isNativeApp } from '../../services/app/nativeShell';
import {
  createBarcodeReader,
  openCamera,
  type BarcodeReader,
  type CameraHandle,
} from '../../services/books/isbnScanner';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import './IsbnScanner.css';

type Problem = CameraProblem | 'reader';
type Phase = 'starting' | 'scanning' | 'found' | Problem;

const SCAN_INTERVAL_MS = 80;
const MAX_SCAN_WIDTH = 960;
const FOUND_HOLD_MS = 650;
const NOTICE_MS = 2600;

interface IsbnScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (isbn: string) => void;
  onManual?: () => void;
}

export const IsbnScanner = ({ open, ...session }: IsbnScannerProps) =>
  createPortal(
    <AnimatePresence>{open && <ScannerSession key="isbn-scanner" {...session} />}</AnimatePresence>,
    document.body
  );

const problemCopy = (problem: Problem): { title: string; text: string } => {
  switch (problem) {
    case 'denied':
      return {
        title: t('Kein Zugriff auf die Kamera'),
        text: isNativeApp()
          ? t('Erlaube TV-Rank die Kamera in den Einstellungen deines Geräts.')
          : t('Erlaube die Kamera für tv-rank.de in den Einstellungen deines Browsers.'),
      };
    case 'missing':
      return {
        title: t('Keine Kamera gefunden'),
        text: t('Tipp die ISBN einfach ein. Sie steht direkt über dem Strichcode.'),
      };
    case 'busy':
      return {
        title: t('Die Kamera ist belegt'),
        text: t('Eine andere App nutzt gerade die Kamera. Schließ sie und versuch es nochmal.'),
      };
    case 'reader':
      return {
        title: t('Der Scanner ließ sich nicht laden'),
        text: t('Prüf deine Verbindung und versuch es nochmal.'),
      };
    default:
      return {
        title: t('Die Kamera ließ sich nicht starten'),
        text: t('Versuch es gleich nochmal.'),
      };
  }
};

const ScannerSession = ({ onClose, onDetected, onManual }: Omit<IsbnScannerProps, 'open'>) => {
  const { currentTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<CameraHandle | null>(null);
  const detectedRef = useRef(onDetected);
  const closeRef = useRef(onClose);
  const [phase, setPhase] = useState<Phase>('starting');
  const [isbn, setIsbn] = useState('');
  const [notice, setNotice] = useState(false);
  const [torch, setTorch] = useState({ available: false, on: false });
  const [mirrored, setMirrored] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    detectedRef.current = onDetected;
    closeRef.current = onClose;
  }, [onDetected, onClose]);

  useAndroidBack(true, onClose);

  useEffect(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      closeRef.current();
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const confirmIsbn = createReadConfirmer();
    const confirmOther = createReadConfirmer();
    const warned = new Set<string>();
    const readerPromise = createBarcodeReader().catch(() => null);
    let cancelled = false;
    let timer = 0;
    let noticeTimer = 0;
    let camera: CameraHandle | null = null;
    let reader: BarcodeReader | null = null;

    const grabFrame = (): boolean => {
      const frame = frameRef.current;
      if (!video || !frame || !ctx || video.readyState < 2 || !video.videoWidth) return false;
      const box = video.getBoundingClientRect();
      const win = frame.getBoundingClientRect();
      const src = coverSourceRect(
        { width: video.videoWidth, height: video.videoHeight },
        box,
        expandRect(
          { x: win.left - box.left, y: win.top - box.top, width: win.width, height: win.height },
          0.12
        )
      );
      if (src.width < 16 || src.height < 16) return false;
      const scale = Math.min(1, MAX_SCAN_WIDTH / src.width);
      const width = Math.round(src.width * scale);
      const height = Math.round(src.height * scale);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      ctx.drawImage(video, src.x, src.y, src.width, src.height, 0, 0, width, height);
      return true;
    };

    const finish = (found: string) => {
      hapticSuccess();
      video?.pause();
      setNotice(false);
      setIsbn(found);
      setPhase('found');
      timer = window.setTimeout(() => detectedRef.current(found), FOUND_HOLD_MS);
    };

    const warnNotABook = (code: string) => {
      if (warned.has(code) || !confirmOther(code, performance.now())) return;
      warned.add(code);
      hapticWarning();
      setNotice(true);
      clearTimeout(noticeTimer);
      noticeTimer = window.setTimeout(() => setNotice(false), NOTICE_MS);
    };

    const tick = async () => {
      if (cancelled || !reader) return;
      if (grabFrame()) {
        let codes: string[];
        try {
          codes = await reader.read(canvas);
        } catch {
          if (!cancelled) setPhase('reader');
          return;
        }
        if (cancelled) return;
        for (const code of codes) {
          const found = isbnFromBarcode(code);
          if (!found) warnNotABook(code);
          else if (confirmIsbn(found, performance.now())) return finish(found);
        }
      }
      timer = window.setTimeout(() => void tick(), SCAN_INTERVAL_MS);
    };

    const start = async () => {
      try {
        camera = await openCamera();
      } catch (err) {
        if (!cancelled) setPhase(cameraProblemOf(err));
        return;
      }
      if (cancelled) {
        camera.stop();
        return;
      }
      cameraRef.current = camera;
      setTorch({ available: camera.torch, on: false });
      setMirrored(
        camera.facing === 'user' ||
          (!camera.facing && !isNativeApp() && !!window.matchMedia?.('(pointer: fine)').matches)
      );
      if (video) {
        video.srcObject = camera.stream;
        await video.play().catch(() => {});
      }
      reader = await readerPromise;
      if (cancelled) return;
      if (!reader) {
        setPhase('reader');
        return;
      }
      setPhase('scanning');
      void tick();
    };
    void start();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(noticeTimer);
      camera?.stop();
      cameraRef.current = null;
      void readerPromise.then((r) => r?.dispose());
      if (video) video.srcObject = null;
    };
  }, [attempt]);

  const toggleTorch = () => {
    const camera = cameraRef.current;
    if (!camera) return;
    const on = !torch.on;
    camera
      .setTorch(on)
      .then(() => setTorch({ available: true, on }))
      .catch(() => setTorch({ available: false, on: false }));
  };

  const retry = () => {
    setPhase('starting');
    setNotice(false);
    setAttempt((n) => n + 1);
  };

  const live = phase === 'scanning' || phase === 'found';
  const problem = live || phase === 'starting' ? null : phase;
  const copy = problem ? problemCopy(problem) : null;
  const onPrimary = getOptimalTextColor(currentTheme.primary);

  return (
    <motion.div
      className="isbn-scan"
      role="dialog"
      aria-modal="true"
      aria-label={t('ISBN scannen')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={(e) => e.stopPropagation()}
      style={
        {
          '--scan-primary': currentTheme.primary,
          '--scan-accent': currentTheme.accent,
          '--scan-success': currentTheme.status.success,
          '--scan-warning': currentTheme.status.warning,
          '--scan-on-primary': onPrimary,
          '--scan-on-success': getOptimalTextColor(currentTheme.status.success),
        } as CSSProperties
      }
    >
      <video
        ref={videoRef}
        className={`isbn-scan__video${mirrored ? ' isbn-scan__video--mirrored' : ''}`}
        data-live={live}
        playsInline
        muted
        autoPlay
        aria-hidden="true"
      />

      <div className="isbn-scan__top">
        <button
          type="button"
          className="isbn-scan__round"
          onClick={onClose}
          aria-label={t('Scanner schließen')}
        >
          <Close style={{ fontSize: 22 }} />
        </button>
        <span className="isbn-scan__title">{t('ISBN scannen')}</span>
        {torch.available && live ? (
          <button
            type="button"
            className="isbn-scan__round"
            onClick={toggleTorch}
            aria-pressed={torch.on}
            aria-label={torch.on ? t('Licht aus') : t('Licht an')}
          >
            {torch.on ? (
              <FlashlightOff style={{ fontSize: 21 }} />
            ) : (
              <FlashlightOn style={{ fontSize: 21 }} />
            )}
          </button>
        ) : (
          <span className="isbn-scan__round isbn-scan__round--ghost" aria-hidden="true" />
        )}
      </div>

      {copy ? (
        <div className="isbn-scan__problem">
          <span className="isbn-scan__problem-icon">
            <NoPhotography style={{ fontSize: 34 }} />
          </span>
          <h2>{copy.title}</h2>
          <p>{copy.text}</p>
          {problem !== 'missing' && (
            <button type="button" className="isbn-scan__retry" onClick={retry}>
              {t('Nochmal versuchen')}
            </button>
          )}
        </div>
      ) : (
        <div className="isbn-scan__middle">
          <div
            ref={frameRef}
            className={`isbn-scan__window${phase === 'found' ? ' is-found' : ''}`}
          >
            <span className="isbn-scan__corner isbn-scan__corner--tl" />
            <span className="isbn-scan__corner isbn-scan__corner--tr" />
            <span className="isbn-scan__corner isbn-scan__corner--bl" />
            <span className="isbn-scan__corner isbn-scan__corner--br" />
            {phase === 'scanning' && <span className="isbn-scan__laser" />}
            {phase === 'found' && (
              <span className="isbn-scan__found-mark">
                <Check style={{ fontSize: 34 }} />
              </span>
            )}
          </div>
          <div className="isbn-scan__status" aria-live="polite">
            {phase === 'found' ? (
              <span className="isbn-scan__pill isbn-scan__pill--found">
                <Check style={{ fontSize: 18 }} />
                {t('ISBN {isbn}', { isbn: formatIsbn13(isbn) })}
              </span>
            ) : notice ? (
              <span className="isbn-scan__pill isbn-scan__pill--warn">
                {t('Das ist kein Buch-Strichcode')}
              </span>
            ) : (
              <p className="isbn-scan__hint">
                {phase === 'starting'
                  ? t('Kamera startet …')
                  : t('Halte den Strichcode von der Buchrückseite in den Rahmen')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="isbn-scan__bottom">
        <button type="button" className="isbn-scan__manual" onClick={onManual ?? onClose}>
          <Keyboard style={{ fontSize: 20 }} />
          {t('ISBN eintippen')}
        </button>
      </div>
    </motion.div>
  );
};
