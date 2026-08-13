import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImageCropSheet } from '../../components/ui/ImageCropSheet';
import { AvatarViewerHost } from '../../components/AvatarViewerHost';
import { PageTourSheet } from '../../features/tour/PageTourSheet';
import { PAGE_TOURS } from '../../features/tour/data/pageTours';
import { showAvatar } from '../../lib/avatarViewer';

/**
 * Nur im Dev-Server: Overlays und Sheets in mehreren Fensterbreiten nebeneinander.
 *
 * Warum iframes und keine Wrapper-DIVs: Sheets liegen `position: fixed` und
 * hängen per Portal an `document.body`. In einem schmalen DIV würden sie
 * trotzdem die echte Fensterbreite benutzen, und Media-Queries wie die
 * 768px-Grenze von `.ui-sheet` griffen falsch. Ein iframe hat einen eigenen
 * Viewport — nur so sieht man wirklich, was auf einem Handy und was auf dem
 * Desktop passiert.
 *
 * `?solo=<id>` rendert genau eine Ansicht ohne Rahmen — das laden die iframes.
 */

const WIDTHS = [
  { label: 'Handy', width: 390, height: 780 },
  { label: 'Tablet', width: 768, height: 720 },
  { label: 'Desktop', width: 1280, height: 720 },
];

/** Testbild ohne Datei-Asset: quer, damit man das Verschieben sieht. */
const sampleImageFile = (): Promise<File> =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 1200, 675);
      gradient.addColorStop(0, '#ef6f8a');
      gradient.addColorStop(1, '#f2a648');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 675);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1200 x 675', 600, 360);
      // Ecken markieren, damit der Beschnitt sichtbar wird
      ctx.fillStyle = '#2b1a2e';
      for (const [x, y] of [
        [0, 0],
        [1120, 0],
        [0, 595],
        [1120, 595],
      ]) {
        ctx.fillRect(x, y, 80, 80);
      }
    }
    canvas.toBlob(
      (blob) => resolve(new File([blob ?? new Blob()], 'probe.jpg', { type: 'image/jpeg' })),
      'image/jpeg',
      0.9
    );
  });

const CropSheetPreview = () => {
  const [file, setFile] = useState<File | null>(null);
  useEffect(() => {
    void sampleImageFile().then(setFile);
  }, []);
  return <ImageCropSheet file={file} onCancel={() => {}} onConfirm={() => {}} busy={false} />;
};

const AvatarViewerPreview = () => {
  useEffect(() => {
    const timer = window.setTimeout(
      () => showAvatar('https://placehold.co/600x600/ef6f8a/2b1a2e.png', 'Testnutzerin'),
      50
    );
    return () => window.clearTimeout(timer);
  }, []);
  return <AvatarViewerHost />;
};

const PageTourPreview = () => {
  // Die längste Hilfe nehmen — dort bricht das Layout zuerst.
  const longest = useMemo(
    () => [...PAGE_TOURS].sort((a, b) => b.actions.length - a.actions.length)[0],
    []
  );
  return <PageTourSheet tour={longest} onClose={() => {}} />;
};

const VIEWS: { id: string; label: string; render: () => React.ReactNode }[] = [
  { id: 'crop', label: 'Bild zuschneiden', render: () => <CropSheetPreview /> },
  { id: 'avatar', label: 'Profilbild groß', render: () => <AvatarViewerPreview /> },
  { id: 'tour', label: 'Seitenhilfe', render: () => <PageTourPreview /> },
];

export const DevUiPreviewPage = () => {
  const [params, setParams] = useSearchParams();
  const solo = params.get('solo');
  const selected = params.get('view') || VIEWS[0].id;

  if (solo) {
    const view = VIEWS.find((v) => v.id === solo);
    return <>{view?.render() ?? <p style={{ padding: 24 }}>Unbekannt: {solo}</p>}</>;
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '80px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>UI-Vorschau</h1>
      <p style={{ fontSize: 13, opacity: 0.7, margin: '0 0 16px' }}>
        Overlays in echten Fensterbreiten. Jedes Feld ist ein eigener Viewport — Media-Queries und
        <code style={{ margin: '0 4px' }}>position: fixed</code>
        verhalten sich wie auf dem Gerät.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => setParams({ view: view.id })}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
              background: view.id === selected ? 'var(--color-primary)' : 'transparent',
              color: view.id === selected ? '#fff' : 'inherit',
              fontWeight: 600,
            }}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {WIDTHS.map((size) => (
          <figure key={size.label} style={{ margin: 0 }}>
            <figcaption style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
              {size.label} · {size.width}px
            </figcaption>
            <iframe
              title={`${selected} @ ${size.width}`}
              src={`/dev/ui-preview?solo=${selected}`}
              width={size.width}
              height={size.height}
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                background: 'var(--theme-background, #000)',
                maxWidth: '100%',
              }}
            />
          </figure>
        ))}
      </div>
    </div>
  );
};
