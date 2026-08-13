import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../theme/colorUtils';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampTransform,
  coverScale,
  cropSourceRect,
  type CropTransform,
} from '../../lib/imageCrop';
import { showToast } from '../../lib/toast';
import { t } from '../../services/i18n';
import { BottomSheet } from './BottomSheet';
import './ImageCropSheet.css';

/** Kantenlänge des gespeicherten Bildes. Avatare werden nie größer gezeigt. */
const OUTPUT_SIZE = 512;
/** Sichtfenster im Sheet. Wird per ResizeObserver an schmale Geräte angepasst. */
const DEFAULT_VIEWPORT = 280;

interface ImageCropSheetProps {
  /** Die vom Nutzer gewählte Datei. `null` schließt das Sheet. */
  file: File | null;
  onCancel: () => void;
  onConfirm: (cropped: Blob) => void;
  busy?: boolean;
}

/**
 * Zeigt das gewählte Bild so, wie es später als Avatar aussieht: rund
 * maskiert, verschiebbar und zoombar. Gespeichert wird der quadratische
 * Ausschnitt — was außerhalb des Kreises liegt, ist nur Rand.
 */
export const ImageCropSheet = ({
  file,
  onCancel,
  onConfirm,
  busy = false,
}: ImageCropSheetProps) => {
  const { currentTheme } = useTheme();
  const [url, setUrl] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [transform, setTransform] = useState<CropTransform>({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [rendering, setRendering] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);

  // Object-URL an die Datei binden und beim Wechsel/Schließen wieder freigeben.
  useEffect(() => {
    if (!file) {
      setUrl(null);
      setSize(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setTransform({ zoom: 1, offsetX: 0, offsetY: 0 });
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Auf schmalen Geräten darf das Fenster nicht breiter sein als das Sheet.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width;
      if (width && width > 0) setViewport(Math.min(DEFAULT_VIEWPORT, Math.round(width)));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [url]);

  const apply = useCallback(
    (next: CropTransform) => {
      if (!size) return;
      setTransform(clampTransform(next, size.w, size.h, viewport));
    },
    [size, viewport]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!size) return;
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    apply({
      zoom: transform.zoom,
      offsetX: transform.offsetX + dx,
      offsetY: transform.offsetY + dy,
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.id !== e.pointerId) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleConfirm = useCallback(() => {
    const image = imageRef.current;
    if (!image || !size || rendering) return;

    setRendering(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setRendering(false);
        return;
      }
      // Durchsichtige Bereiche wuerden als Schwarz landen — Weiss ist der
      // uebliche Avatar-Untergrund und faellt im runden Rahmen nicht auf.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const { sx, sy, sw, sh } = cropSourceRect(transform, size.w, size.h, viewport);
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      canvas.toBlob(
        (blob) => {
          setRendering(false);
          if (blob) onConfirm(blob);
        },
        'image/jpeg',
        0.9
      );
    } catch {
      setRendering(false);
    }
  }, [size, transform, viewport, onConfirm, rendering]);

  const scale = size ? coverScale(size.w, size.h, viewport) * transform.zoom : 1;
  const zoomPercent = ((transform.zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;
  const working = busy || rendering;

  return (
    // maxWidth ist Pflicht: .ui-sheet ist auf dem Desktop bis 1600px breit
    // (fuer Listen-Sheets mit Raster) — ein Dialog braucht das nicht.
    <BottomSheet
      isOpen={file !== null}
      onClose={onCancel}
      maxWidth="420px"
      ariaLabel={t('Bild zuschneiden')}
    >
      {/* Spalte statt Textfluss: das Sheet haengt per Portal an document.body,
          dort greift die globale Regel `.mobile-app button { display: flex }`
          nicht. Regler und Knoepfe blieben sonst inline und landeten auf
          breiten Fenstern nebeneinander in einer Zeile. */}
      <div
        style={{
          padding: '0 20px 28px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>
          {t('Bild zuschneiden')}
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
            margin: '0 0 16px',
          }}
        >
          {t('Ziehen zum Verschieben, Regler zum Vergrößern')}
        </p>

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: `${DEFAULT_VIEWPORT}px`,
            aspectRatio: '1 / 1',
            margin: '0 auto',
            overflow: 'hidden',
            borderRadius: '50%',
            background: currentTheme.background.default,
            touchAction: 'none',
            cursor: size ? 'grab' : 'default',
            border: `2px solid ${currentTheme.primary}`,
          }}
        >
          {url && (
            <img
              ref={imageRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
              onError={() => {
                // Ohne das bliebe das Sheet bei einer kaputten Datei fuer immer
                // leer stehen — mit deaktivierten Knoepfen und ohne Hinweis.
                showToast(t('Bild konnte nicht geladen werden'), 3000, 'error');
                onCancel();
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: size ? `${size.w * scale}px` : 'auto',
                height: size ? `${size.h * scale}px` : 'auto',
                transform: `translate(calc(-50% + ${transform.offsetX}px), calc(-50% + ${transform.offsetY}px))`,
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Zwischen Dateiauswahl und fertig dekodiertem Bild vergeht bei einem
              Handy-Foto gut eine Sekunde. Ohne Anzeige sieht das aus, als waere
              nichts passiert. Gleiches gilt waehrend des Hochladens. */}
          {(!size || working) && (
            <div
              className="crop-overlay"
              style={{
                background: `${currentTheme.background.default}cc`,
                color: currentTheme.text?.muted || 'rgba(255,255,255,0.6)',
              }}
            >
              <span className="crop-spinner" />
              <span>{working ? t('Wird hochgeladen…') : t('Bild wird geladen…')}</span>
            </div>
          )}
        </div>

        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={transform.zoom}
          disabled={!size}
          aria-label={t('Vergrößern')}
          onChange={(e) => apply({ ...transform, zoom: Number(e.target.value) })}
          className="crop-range"
          // Gefuellter Teil der Schiene: als Verlauf, weil ::-webkit-slider-runnable-track
          // den aktuellen Wert nicht kennt.
          style={{
            background: `linear-gradient(to right, ${currentTheme.primary} 0%, ${currentTheme.primary} ${zoomPercent}%, rgba(255,255,255,0.12) ${zoomPercent}%, rgba(255,255,255,0.12) 100%)`,
          }}
        />

        <button
          onClick={handleConfirm}
          disabled={!size || working}
          style={{
            marginTop: '14px',
            width: '100%',
            maxWidth: '280px',
            padding: '14px 22px',
            borderRadius: 'var(--radius-lg)',
            background: currentTheme.primary,
            border: 'none',
            color: getOptimalTextColor(currentTheme.primary),
            fontSize: '15px',
            fontWeight: 700,
            cursor: working ? 'default' : 'pointer',
            opacity: working ? 0.75 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          {working && <span className="crop-spinner" />}
          {working ? t('Wird hochgeladen…') : t('Als Profilbild verwenden')}
        </button>
        <button
          onClick={onCancel}
          disabled={working}
          style={{
            marginTop: '8px',
            padding: '8px 22px',
            background: 'transparent',
            border: 'none',
            color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            cursor: working ? 'default' : 'pointer',
          }}
        >
          {t('Abbrechen')}
        </button>
      </div>
    </BottomSheet>
  );
};
