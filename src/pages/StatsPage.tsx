import { AutoAwesome } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BackButton } from '../components/BackButton';
import { StatsGrid } from '../components/StatsGrid';

export const StatsPage = () => {
  const { getMobileHeaderStyle, currentTheme } = useTheme();
  const navigate = useNavigate();

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

      {/* Actor Universe Banner */}
      <div style={{ padding: '20px 20px 0 20px' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/actor-universe')}
          style={{
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(102, 126, 234, 0.3)',
          }}
        >
          {/* Stars decoration */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                position: 'absolute',
                width: 3 + Math.random() * 3,
                height: 3 + Math.random() * 3,
                borderRadius: '50%',
                background: 'white',
                top: `${10 + Math.random() * 80}%`,
                left: `${10 + Math.random() * 80}%`,
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.5)',
              }}
            />
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)',
            }}>
              <AutoAwesome style={{ color: 'white', fontSize: '24px' }} />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: 'white',
              }}>
                Actor Universe
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
              }}>
                Entdecke Schauspieler-Verbindungen in deiner Sammlung
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Content */}
      <div style={{ padding: '20px' }}>
        <StatsGrid />
      </div>
    </div>
  );
};
