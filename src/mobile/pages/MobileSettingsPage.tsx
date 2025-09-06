import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowBack, Palette, Logout, Edit, PhotoCamera, Public, Link, ContentCopy, Refresh
} from '@mui/icons-material';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/database';

export const MobileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { getMobileHeaderStyle } = useTheme();
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [displayNameEditable, setDisplayNameEditable] = useState(false);
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(false);
  const [publicProfileId, setPublicProfileId] = useState<string>('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
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
          setIsPublicProfile(userData.isPublicProfile || false);
          setPublicProfileId(userData.publicProfileId || '');
        } else {
          setUsername('');
          setDisplayName(user.displayName || '');
          setPhotoURL(user.photoURL || '');
          setIsPublicProfile(false);
          setPublicProfileId('');
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

  const generatePublicId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  };

  const handlePublicProfileToggle = async (enabled: boolean) => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      let newPublicProfileId = publicProfileId;
      
      if (enabled && !publicProfileId) {
        newPublicProfileId = generatePublicId();
      }
      
      await firebase.database().ref(`users/${user.uid}`).update({
        isPublicProfile: enabled,
        publicProfileId: enabled ? newPublicProfileId : null
      });
      
      setIsPublicProfile(enabled);
      setPublicProfileId(enabled ? newPublicProfileId : '');
      
      if (navigator.vibrate) navigator.vibrate(50);
      
    } catch (error) {
      console.error('Error updating public profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const copyPublicLink = () => {
    if (!publicProfileId) return;
    
    const publicUrl = `${window.location.origin}/public/${publicProfileId}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      alert('Link kopiert!');
    });
  };

  const regeneratePublicId = async () => {
    if (!user || !isPublicProfile) return;
    
    setIsLoadingProfile(true);
    try {
      const newPublicProfileId = generatePublicId();
      
      await firebase.database().ref(`users/${user.uid}`).update({
        publicProfileId: newPublicProfileId
      });
      
      setPublicProfileId(newPublicProfileId);
      
      if (navigator.vibrate) navigator.vibrate(100);
      
    } catch (error) {
      console.error('Error regenerating public ID:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

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

        {/* Public Profile Settings */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'white' }}>
            Öffentliches Profil
          </h3>
          
          {/* Public Profile Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1
            }}>
              <Public style={{ fontSize: '24px', color: '#667eea' }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 500, color: 'white' }}>
                  Profil öffentlich teilen
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Andere können deine Serien und Filme ohne Anmeldung sehen
                </p>
              </div>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '50px',
              height: '28px'
            }}>
              <input
                type="checkbox"
                checked={isPublicProfile}
                onChange={(e) => handlePublicProfileToggle(e.target.checked)}
                disabled={isLoadingProfile}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isPublicProfile ? 'var(--color-primary, #667eea)' : 'rgba(255, 255, 255, 0.1)',
                transition: '0.3s',
                borderRadius: '28px',
                opacity: isLoadingProfile ? 0.5 : 1
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '20px',
                  width: '20px',
                  left: isPublicProfile ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '0.3s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Public Link Section */}
          {isPublicProfile && publicProfileId && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '16px',
              borderRadius: '12px'
            }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: 'white' }}>
                Öffentlicher Link
              </h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Link style={{ fontSize: '18px', opacity: 0.7, color: 'white' }} />
                <span style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'rgba(255, 255, 255, 0.7)',
                  wordBreak: 'break-all',
                  flex: 1
                }}>
                  {`${window.location.origin}/public/${publicProfileId}`}
                </span>
              </div>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={copyPublicLink}
                  disabled={isLoadingProfile}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    background: 'var(--color-primary, #667eea)',
                    color: 'white',
                    opacity: isLoadingProfile ? 0.5 : 1
                  }}
                >
                  <ContentCopy style={{ fontSize: '18px' }} />
                  Link kopieren
                </button>
                <button
                  onClick={regeneratePublicId}
                  disabled={isLoadingProfile}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    opacity: isLoadingProfile ? 0.5 : 1
                  }}
                >
                  <Refresh style={{ fontSize: '18px' }} />
                  Neuen Link generieren
                </button>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px'
            }}>
              <div style={{
                flexShrink: 0,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px'
              }}>
                <Public style={{ fontSize: '18px', color: 'var(--color-primary, #667eea)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '4px'
                }}>
                  Sichtbar für alle
                </strong>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  Wenn aktiviert, können andere deine bewerteten Serien und Filme auch ohne Anmeldung sehen
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px'
            }}>
              <div style={{
                flexShrink: 0,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px'
              }}>
                <Link style={{ fontSize: '18px', color: 'var(--color-primary, #667eea)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '4px'
                }}>
                  Einzigartiger Link
                </strong>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  Jedes öffentliche Profil hat eine eindeutige URL die du teilen kannst
                </p>
              </div>
            </div>
          </div>
        </div>

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