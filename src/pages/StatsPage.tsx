import { useTheme } from '../contexts/ThemeContext';
import { BackButton } from '../components/BackButton';
import { StatsGrid } from '../components/StatsGrid';

export const StatsPage = () => {
  const { getMobileHeaderStyle, currentTheme } = useTheme();

  return (
    <div>
      {/* Header */}
      <header
        style={{
          ...getMobileHeaderStyle('transparent'),
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BackButton />

          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Statistiken
            </h1>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '14px',
                margin: '4px 0 0 0',
              }}
            >
              Deine Viewing-Statistiken
            </p>
          </div>
        </div>
      </header>

      {/* Stats Content */}
      <div style={{ padding: '20px' }}>
        <StatsGrid />
      </div>
    </div>
  );
};
