import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowBack, Settings, Palette, Notifications, 
  Security, Help, Info, Logout, Storage,
  CloudSync, Language, DarkMode, VolumeUp,
  Vibration, AutoAwesome, Update
} from '@mui/icons-material';
import { useAuth } from '../../App';
import firebase from 'firebase/compat/app';

export const MobileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const [notifications, setNotifications] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleLogout = async () => {
    if (window.confirm('Möchtest du dich wirklich abmelden?')) {
      try {
        await firebase.auth().signOut();
        navigate('/');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  const settingsGroups = [
    {
      title: 'Darstellung',
      items: [
        {
          icon: <Palette style={{ fontSize: '20px' }} />,
          title: 'Design & Themes',
          subtitle: 'Farben, Hintergrund anpassen',
          onClick: () => navigate('/theme')
        },
        {
          icon: <DarkMode style={{ fontSize: '20px' }} />,
          title: 'Dark Mode',
          subtitle: 'Automatisch aktiviert',
          disabled: true
        }
      ]
    },
    {
      title: 'Benachrichtigungen',
      items: [
        {
          icon: <Notifications style={{ fontSize: '20px' }} />,
          title: 'Push-Benachrichtigungen',
          subtitle: notifications ? 'Aktiviert' : 'Deaktiviert',
          toggle: true,
          value: notifications,
          onChange: setNotifications
        },
        {
          icon: <Vibration style={{ fontSize: '20px' }} />,
          title: 'Vibration',
          subtitle: vibration ? 'Aktiviert' : 'Deaktiviert',
          toggle: true,
          value: vibration,
          onChange: setVibration
        }
      ]
    },
    {
      title: 'Daten & Sync',
      items: [
        {
          icon: <CloudSync style={{ fontSize: '20px' }} />,
          title: 'Automatische Synchronisation',
          subtitle: autoSync ? 'Aktiviert' : 'Deaktiviert',
          toggle: true,
          value: autoSync,
          onChange: setAutoSync
        },
        {
          icon: <Storage style={{ fontSize: '20px' }} />,
          title: 'Speicher verwalten',
          subtitle: 'Cache leeren, Offline-Daten',
          onClick: () => console.log('Storage management')
        }
      ]
    },
    {
      title: 'Konto',
      items: [
        {
          icon: <Security style={{ fontSize: '20px' }} />,
          title: 'Privatsphäre & Sicherheit',
          subtitle: 'Passwort, 2FA, Datenschutz',
          onClick: () => console.log('Security settings')
        },
        {
          icon: <Language style={{ fontSize: '20px' }} />,
          title: 'Sprache',
          subtitle: 'Deutsch',
          disabled: true
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: <Help style={{ fontSize: '20px' }} />,
          title: 'Hilfe & FAQ',
          subtitle: 'Häufige Fragen, Support kontaktieren',
          onClick: () => console.log('Help')
        },
        {
          icon: <Info style={{ fontSize: '20px' }} />,
          title: 'Über TV-RANK',
          subtitle: 'Version, Lizenzen, Impressum',
          onClick: () => console.log('About')
        },
        {
          icon: <Update style={{ fontSize: '20px' }} />,
          title: 'Updates',
          subtitle: 'App-Version, Changelog',
          onClick: () => console.log('Updates')
        }
      ]
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: 'white',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.2) 0%, rgba(0, 0, 0, 0) 100%)'
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
              Einstellungen
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '14px',
              margin: '4px 0 0 0'
            }}>
              App-Einstellungen verwalten
            </p>
          </div>
        </div>
      </header>

      {/* User Info */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(255, 255, 255, 0.02)',
        margin: '0 20px',
        borderRadius: '12px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Settings style={{ fontSize: '24px' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>
            {user?.displayName || 'User'}
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0 
          }}>
            {user?.email}
          </p>
        </div>
      </div>
      
      {/* Settings Groups */}
      <div style={{ padding: '20px' }}>
        {settingsGroups.map((group, groupIndex) => (
          <div key={group.title} style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
              marginTop: groupIndex > 0 ? '24px' : 0
            }}>
              {group.title}
            </h3>
            
            {group.items.map((item, itemIndex) => (
              <div
                key={item.title}
                onClick={item.disabled ? undefined : item.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: item.disabled 
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#667eea' }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: 500,
                      margin: '0 0 2px 0'
                    }}>
                      {item.title}
                    </h4>
                    <p style={{ 
                      fontSize: '13px', 
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: 0
                    }}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                
                {item.toggle && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onChange?.(!item.value);
                    }}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      background: item.value ? '#00d4aa' : 'rgba(255, 255, 255, 0.2)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: item.value ? '22px' : '2px',
                      transition: 'left 0.2s ease'
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            color: '#ff6b6b',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '24px'
          }}
        >
          <Logout style={{ fontSize: '20px' }} />
          Abmelden
        </button>
      </div>
    </div>
  );
};