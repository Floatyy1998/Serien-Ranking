import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowBack, Palette, Logout, Share, Edit, PhotoCamera
} from '@mui/icons-material';
import { useAuth } from '../../App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/database';

export const MobileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [displayNameEditable, setDisplayNameEditable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        const userRef = firebase.database().ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        
        if (userData) {
          setUsername(userData.username || '');
          setDisplayName(userData.displayName || user.displayName || '');
          setPhotoURL(userData.photoURL || user.photoURL || '');
        } else {
          setUsername('');
          setDisplayName(user.displayName || '');
          setPhotoURL(user.photoURL || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Bild darf maximal 5MB groß sein');
      return;
    }

    try {
      setUploading(true);
      
      const storageRef = firebase.storage().ref();
      const imageRef = storageRef.child(`profile-images/${user.uid}`);
      
      await imageRef.put(file);
      const downloadURL = await imageRef.getDownloadURL();
      
      await user.updateProfile({ photoURL: downloadURL });
      await firebase.database().ref(`users/${user.uid}/photoURL`).set(downloadURL);
      await user.reload();
      
      setPhotoURL(downloadURL);
      alert('Profilbild erfolgreich hochgeladen!');
    } catch (error) {
      alert('Fehler beim Hochladen des Bildes');
    } finally {
      setUploading(false);
    }
  };

  const saveUsername = async () => {
    if (!user || !username.trim()) return;
    
    try {
      setSaving(true);
      await firebase.database().ref(`users/${user.uid}/username`).set(username);
      setUsernameEditable(false);
      alert('Benutzername gespeichert!');
    } catch (error) {
      alert('Fehler beim Speichern des Benutzernamens');
    } finally {
      setSaving(false);
    }
  };

  const saveDisplayName = async () => {
    if (!user || !displayName.trim()) return;
    
    try {
      setSaving(true);
      await user.updateProfile({ displayName: displayName });
      await firebase.database().ref(`users/${user.uid}/displayName`).set(displayName);
      await user.reload();
      setDisplayNameEditable(false);
      alert('Anzeigename gespeichert!');
    } catch (error) {
      alert('Fehler beim Speichern des Anzeigenamens');
    } finally {
      setSaving(false);
    }
  };

  const generatePublicLink = () => {
    const link = `${window.location.origin}/public/${user?.uid}`;
    navigator.clipboard.writeText(link);
    alert('Link kopiert!');
  };

  return (
    <div style={{ 
      height: '100dvh', 
      background: '#000', 
      color: 'white',
      paddingBottom: '80px',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
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
              {user?.displayName || user?.email}
            </p>
          </div>
        </div>
      </header>
      
      {/* Profile Section */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile Picture */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          gap: '16px'
        }}>
          <div style={{ position: 'relative' }}>
{photoURL ? (
              <img 
                src={photoURL} 
                alt="Profile" 
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid #000',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {uploading ? '⏳' : <PhotoCamera style={{ fontSize: '16px' }} />}
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '14px',
            margin: 0,
            textAlign: 'center'
          }}>
            Tippe auf die Kamera um ein neues Profilbild hochzuladen
          </p>
        </div>

        {/* Username */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0', color: 'white' }}>
              Benutzername
            </h3>
            {usernameEditable ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  placeholder="Benutzername eingeben"
                />
                <button
                  onClick={saveUsername}
                  disabled={saving}
                  style={{
                    background: '#4CAF50',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {saving ? '...' : '✓'}
                </button>
                <button
                  onClick={() => setUsernameEditable(false)}
                  style={{
                    background: '#f44336',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <p style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                {username || 'Kein Benutzername festgelegt'}
              </p>
            )}
          </div>
          {!usernameEditable && (
            <button
              onClick={() => setUsernameEditable(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <Edit style={{ fontSize: '20px' }} />
            </button>
          )}
        </div>

        {/* Display Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0', color: 'white' }}>
              Anzeigename
            </h3>
            {displayNameEditable ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  placeholder="Anzeigename eingeben"
                />
                <button
                  onClick={saveDisplayName}
                  disabled={saving}
                  style={{
                    background: '#4CAF50',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {saving ? '...' : '✓'}
                </button>
                <button
                  onClick={() => setDisplayNameEditable(false)}
                  style={{
                    background: '#f44336',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <p style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                {displayName || 'Kein Anzeigename festgelegt'}
              </p>
            )}
          </div>
          {!displayNameEditable && (
            <button
              onClick={() => setDisplayNameEditable(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              <Edit style={{ fontSize: '20px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Settings Items */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Theme Settings */}
        <button
          onClick={() => navigate('/theme')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Palette style={{ fontSize: '24px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Design & Themes
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.6)',
              margin: '2px 0 0 0'
            }}>
              Farben und Aussehen anpassen
            </p>
          </div>
        </button>

        {/* Public Link */}
        <button
          onClick={generatePublicLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Share style={{ fontSize: '24px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Öffentlichen Link kopieren
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.6)',
              margin: '2px 0 0 0'
            }}>
              Teile deine Liste mit anderen
            </p>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '16px',
            color: '#ff6b6b',
            fontSize: '16px',
            cursor: 'pointer',
            textAlign: 'left',
            marginTop: '20px'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255, 107, 107, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Logout style={{ fontSize: '24px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Abmelden
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 107, 107, 0.8)',
              margin: '2px 0 0 0'
            }}>
              Von diesem Gerät abmelden
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};