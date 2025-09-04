import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { MobileStatsGrid } from '../components/MobileStatsGrid';
import { useTheme } from '../../contexts/ThemeContext';

export const MobileStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { getMobileHeaderStyle } = useTheme();

  return (
    <div>
      {/* Header */}
      <header style={{
        ...getMobileHeaderStyle('rgba(102, 126, 234, 0.6)'),
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: 'white', 
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
          >
            <ArrowBack />
          </button>
          
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Statistiken
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '14px',
              margin: '4px 0 0 0'
            }}>
              Deine Viewing-Statistiken
            </p>
          </div>
        </div>
      </header>
      
      {/* Stats Content */}
      <div style={{ padding: '20px' }}>
        <MobileStatsGrid />
      </div>
    </div>
  );
};