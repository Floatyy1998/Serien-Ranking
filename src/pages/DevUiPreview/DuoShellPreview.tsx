import { LiveTv } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';

const NAV = ['Start', 'Weiter', 'Entdecken', 'Lesen', 'Mehr'];

// Shell + Dock unter seitlichen Safe-Areas (iPhone Duo: 84px Tastenleiste an einer Seite).
// Zum Simulieren --safe-left / --safe-right auf <html> setzen.
export const DuoShellPreview = () => {
  const { currentTheme } = useTheme();
  return (
    <div className="mobile-layout" style={{ background: currentTheme.background.default }}>
      <div className="mobile-content with-nav">
        <div style={{ padding: 'var(--nav-top) var(--nav-x) 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, color: currentTheme.text.primary }}>Weiterschauen</h1>
            <span style={{ color: currentTheme.text.secondary, fontSize: 13 }}>Safe-Area-Test</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 12,
              marginTop: 16,
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--glass-border-light)',
                }}
              >
                <img
                  src={PLACEHOLDER_SVG}
                  alt=""
                  style={{ width: '100%', aspectRatio: '2 / 3', display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <nav className="mobile-bottom-navigation">
        <div className="nav-container">
          {NAV.map((label, i) => (
            <button key={label} className={`nav-item${i === 0 ? ' active' : ''}`} type="button">
              <span className="nav-icon-container">
                <span className="nav-icon">
                  <LiveTv />
                </span>
              </span>
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
