import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowBack, PhotoCamera, Edit, 
  Public, PublicOff, Share, Tour,
  Palette, ChevronRight
} from '@mui/icons-material';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';

export const MobileProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { getMobileHeaderStyle } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isPublic, setIsPublic] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [displayNameEditable, setDisplayNameEditable] = useState(false);
  
  // Load user data from Firebase
  const { data: userData, loading: userDataLoading } = useEnhancedFirebaseCache<any>(
    user ? `users/${user.uid}` : '',
    {
      ttl: 5 * 60 * 1000,
      useRealtimeListener: true,
      enableOfflineSupport: true,
    }
  );
  
  useEffect(() => {
    if (!user || userDataLoading) return;
    
    if (userData) {
      setUsername(userData.username || '');
      setDisplayName(userData.displayName || '');
      setPhotoURL(userData.photoURL || user.photoURL || '');
      setIsPublic(userData.isPublic || false);
    } else {
      setUsername('');
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setIsPublic(false);
    }
  }, [user, userData, userDataLoading]);
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Bild darf maximal 5MB groß sein');
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      const storageRef = firebase.storage().ref();
      const imageRef = storageRef.child(`profile-images/${user.uid}`);
      
      await imageRef.put(file);
      const downloadURL = await imageRef.getDownloadURL();
      
      await user.updateProfile({ photoURL: downloadURL });
      await firebase.database().ref(`users/${user.uid}/photoURL`).set(downloadURL);
      
      await user.reload();
      
      setPhotoURL(downloadURL);
      setSuccess('Profilbild erfolgreich hochgeladen');
    } catch (error: any) {
      setError('Fehler beim Hochladen: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setUploading(false);
    }
  };
  
  const isUsernameValid = (username: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };
  
  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef
        .orderByChild('username')
        .equalTo(username)
        .once('value');
      
      const data = snapshot.val();
      if (!data) return true;
      
      const existingUsers = Object.keys(data);
      return (
        existingUsers.length === 0 ||
        (existingUsers.length === 1 && existingUsers[0] === user.uid)
      );
    } catch (error) {
      return false;
    }
  };
  
  const handleSave = async () => {
    if (!user) return;
    
    if (!username.trim()) {
      setError('Benutzername ist erforderlich');
      return;
    }
    
    if (!isUsernameValid(username)) {
      setError('Benutzername muss 3-20 Zeichen lang sein und darf nur Buchstaben, Zahlen und _ enthalten');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        setError('Benutzername ist bereits vergeben');
        return;
      }
      
      // Update Firebase
      await firebase.database().ref(`users/${user.uid}`).update({
        username: username,
        displayName: displayName || username,
        photoURL: photoURL || null,
        isPublic: isPublic,
        lastActive: firebase.database.ServerValue.TIMESTAMP
      });
      
      // Update Firebase Auth
      await user.updateProfile({
        displayName: displayName || username,
        photoURL: photoURL || null,
      });
      
      setSuccess('Profil erfolgreich aktualisiert');
      setUsernameEditable(false);
      setDisplayNameEditable(false);
    } catch (error) {
      setError('Fehler beim Speichern des Profils');
    } finally {
      setSaving(false);
    }
  };
  
  const handleTogglePublic = async () => {
    if (!user) return;
    
    try {
      const newPublicState = !isPublic;
      await firebase.database().ref(`users/${user.uid}/isPublic`).set(newPublicState);
      setIsPublic(newPublicState);
      setSuccess(newPublicState ? 'Deine Liste ist jetzt öffentlich!' : 'Deine Liste ist jetzt privat!');
    } catch (error) {
      setError('Fehler beim Aktualisieren der Einstellung');
    }
  };
  
  const generateMyPublicLink = () => {
    const link = `${window.location.origin}/public/${user?.uid}`;
    navigator.clipboard.writeText(link);
    setSuccess('Dein öffentlicher Link wurde kopiert!');
  };
  
  const handleRestartTour = async () => {
    if (!user) return;
    
    try {
      await firebase.database().ref(`users/${user.uid}`).update({
        hasCompletedTour: false,
        tourCompletedAt: null,
        tourStep: 0
      });
      setSuccess('Tour wird beim nächsten Besuch gestartet');
    } catch (error) {
      setError('Fehler beim Zurücksetzen der Tour');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
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
          
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 800,
              margin: 0
            }}>
              Profil-Einstellungen
            </h1>
          </div>
          
          {(usernameEditable || displayNameEditable) && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          )}
        </div>
        
        {/* Messages */}
        {error && (
          <div style={{
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
            color: '#ff4757'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{
            background: 'rgba(0, 212, 170, 0.1)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
            color: '#00d4aa'
          }}>
            {success}
          </div>
        )}
      </header>
      
      {/* Profile Image */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {photoURL ? (
                <img 
                  src={photoURL} 
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <PhotoCamera style={{ fontSize: '40px', color: 'white' }} />
              )}
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              <PhotoCamera style={{ fontSize: '18px', color: 'white' }} />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        
        {/* Username */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            Benutzername
            <button
              onClick={() => setUsernameEditable(!usernameEditable)}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer'
              }}
            >
              <Edit style={{ fontSize: '16px' }} />
            </button>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!usernameEditable}
            placeholder="Wähle einen Benutzernamen"
            style={{
              width: '100%',
              padding: '12px',
              background: usernameEditable 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${usernameEditable 
                ? 'rgba(102, 126, 234, 0.3)' 
                : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px'
            }}
          />
        </div>
        
        {/* Display Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            Anzeigename
            <button
              onClick={() => setDisplayNameEditable(!displayNameEditable)}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer'
              }}
            >
              <Edit style={{ fontSize: '16px' }} />
            </button>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!displayNameEditable}
            placeholder="Dein Anzeigename"
            style={{
              width: '100%',
              padding: '12px',
              background: displayNameEditable 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${displayNameEditable 
                ? 'rgba(102, 126, 234, 0.3)' 
                : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px'
            }}
          />
        </div>
        
        {/* Privacy Settings */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div 
            onClick={handleTogglePublic}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isPublic ? (
                <Public style={{ fontSize: '24px', color: '#00d4aa' }} />
              ) : (
                <PublicOff style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.5)' }} />
              )}
              <div>
                <h4 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>
                  Öffentliches Profil
                </h4>
                <p style={{ 
                  fontSize: '13px', 
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0
                }}>
                  {isPublic ? 'Deine Liste ist öffentlich sichtbar' : 'Deine Liste ist privat'}
                </p>
              </div>
            </div>
            
            <div style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: isPublic ? '#00d4aa' : 'rgba(255, 255, 255, 0.2)',
              position: 'relative',
              transition: 'background 0.2s ease'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: isPublic ? '22px' : '2px',
                transition: 'left 0.2s ease'
              }} />
            </div>
          </div>
          
          {isPublic && (
            <button
              onClick={generateMyPublicLink}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '8px',
                color: '#667eea',
                fontSize: '14px',
                fontWeight: 600,
                marginTop: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Share style={{ fontSize: '18px' }} />
              Öffentlichen Link kopieren
            </button>
          )}
        </div>
        
        {/* Additional Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => navigate('/theme')}
            style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Palette style={{ fontSize: '20px', color: '#764ba2' }} />
              <span>Theme Editor</span>
            </div>
            <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
          </button>
          
          <button
            onClick={handleRestartTour}
            style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Tour style={{ fontSize: '20px', color: '#00b4d8' }} />
              <span>Tour neu starten</span>
            </div>
            <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
          </button>
        </div>
      </div>
    </div>
  );
};