import { ScrollEscapeHost } from '../../components/layout/ScrollEscapeHost';
import { BackButton, PageHeader } from '../../components/ui';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';
import '../../components/layout/Layout.css';

const Rows = () => (
  <>
    {Array.from({ length: 30 }, (_, i) => (
      <div
        key={i}
        style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px var(--page-x)' }}
      >
        <img src={PLACEHOLDER_SVG} alt="" style={{ width: 54, height: 80, borderRadius: 8 }} />
        <div style={{ color: 'var(--theme-text-secondary)', fontSize: 15 }}>
          Ähnlicher Titel {i + 1}
        </div>
      </div>
    ))}
  </>
);

/** Detailseite ohne Dock: Zurück/Home sitzen im Hero und scrollen weg — `?solo=scroll-escape-detail`. */
export const ScrollEscapeDetailPreview = () => (
  <div className="mobile-layout">
    <div className="mobile-content with-nav nav-hidden">
      <div>
        <div
          style={{
            height: 320,
            position: 'relative',
            background: 'linear-gradient(160deg, var(--theme-primary), var(--theme-background))',
          }}
        >
          <div style={{ position: 'absolute', top: 'calc(var(--safe-top) + 12px)', left: 10 }}>
            <BackButton />
          </div>
        </div>
        <Rows />
      </div>
    </div>
    <ScrollEscapeHost />
  </div>
);

/** Unterseite mit klebendem Kopf: nur der Nach-oben-Knopf — `?solo=scroll-escape-header`. */
export const ScrollEscapeHeaderPreview = () => (
  <div className="mobile-layout">
    <div className="mobile-content with-nav nav-hidden">
      <div>
        <PageHeader title="Entdecken" />
        <Rows />
      </div>
    </div>
    <ScrollEscapeHost />
  </div>
);
