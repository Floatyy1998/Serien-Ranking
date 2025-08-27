import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cloud as CloudIcon,
  Computer as ComputerIcon,
  DeleteForever as DeleteForeverIcon,
  RestartAlt as RestartAltIcon,
} from '@mui/icons-material';
import { BackgroundImageFirebaseUpload } from './BackgroundImageFirebaseUpload';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import React, { useState, useCallback, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

// Ensure Firebase is initialized
if (!firebase.apps.length) {
  console.warn('Firebase not initialized in ThemeEditor');
}
import { useAuth } from '../../App';
import { backgroundImageManager } from '../../services/backgroundImageManager';

interface ThemeEditorProps {
  open: boolean;
  onClose: () => void;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ open, onClose }) => {
  const { user } = useAuth()!;
  
  // Get current CSS variables as initial state to prevent flicker
  const getInitialColor = (varName: string, fallback: string) => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      return computedStyle.getPropertyValue(varName).trim() || fallback;
    }
    return fallback;
  };
  
  // Lokaler State für eigenständigen Theme-Editor - Initialize with current values
  const [tempPrimaryColor, setTempPrimaryColor] = useState(() => 
    getInitialColor('--theme-primary', '#00fed7'));
  const [tempBackgroundColor, setTempBackgroundColor] = useState(() => 
    getInitialColor('--theme-background', '#000000'));
  const [tempSurfaceColor, setTempSurfaceColor] = useState(() => 
    getInitialColor('--theme-surface', '#2d2d30'));
  const [tempAccentColor, setTempAccentColor] = useState(() => 
    getInitialColor('--theme-accent', '#00e6c3'));
  const [tempBackgroundImage, setTempBackgroundImage] = useState<string | undefined>(undefined);
  const [tempBackgroundImageOpacity, setTempBackgroundImageOpacity] = useState(0.5);
  const [tempBackgroundImageBlur, setTempBackgroundImageBlur] = useState(0);
  const [tempBackgroundIsVideo, setTempBackgroundIsVideo] = useState(false);
  
  // Store original values to restore on cancel
  const originalValuesRef = useRef<{
    primaryColor: string;
    backgroundColor: string;
    surfaceColor: string;
    accentColor: string;
    backgroundImage?: string;
    backgroundImageOpacity: number;
    backgroundImageBlur: number;
    backgroundIsVideo: boolean;
  } | null>(null);
  
  // Sync Mode - local oder cloud
  const [syncMode, setSyncMode] = useState<'local' | 'cloud'>('local');
  
  // Welche Farbe wird gerade bearbeitet
  const [activeColor, setActiveColor] = useState<'primary' | 'background' | 'surface' | 'accent'>('primary');
  
  // Debounce timer ref für Flacker-Vermeidung
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if initial load is complete
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [localResetModalOpen, setLocalResetModalOpen] = useState(false);
  const [cloudDeleteModalOpen, setCloudDeleteModalOpen] = useState(false);
  const [cloudThemePreview, setCloudThemePreview] = useState<any>(null);

  // Theme von Cloud laden
  const loadCloudTheme = async () => {
    if (!user) {
      console.log('loadCloudTheme: No user available');
      return null;
    }
    
    try {
      // Ensure Firebase is imported and initialized
      if (!firebase.database) {
        console.error('Firebase database not available');
        return null;
      }
      
      console.log('Loading cloud theme for user:', user.uid);
      const themeRef = firebase.database().ref(`users/${user.uid}/theme`);
      const snapshot = await themeRef.once('value');
      const theme = snapshot.val();
      console.log('Cloud theme data:', theme);
      return theme;
    } catch (error) {
      console.error('Fehler beim Laden des Cloud-Themes:', error);
      return null;
    }
  };

  // Gespeichertes Theme beim Öffnen laden
  React.useEffect(() => {
    const loadTheme = async () => {
      if (open) {
        setLoading(true);
        
        // Set user ID for background image manager
        if (user) {
          backgroundImageManager.setUserId(user.uid);
        }
        
        // WICHTIG: Lokales Theme hat Vorrang
        let theme = null;
        
        // Erst lokales Theme versuchen
        const savedTheme = localStorage.getItem('customTheme');
        if (savedTheme) {
          try {
            theme = JSON.parse(savedTheme);
            // Sync-Mode basierend auf gespeicherter Präferenz oder default auf local
            const savedSyncMode = localStorage.getItem('themeSyncMode');
            setSyncMode((savedSyncMode as 'local' | 'cloud') || 'local');
            
            // Migrate existing local theme to use reference counting
            await backgroundImageManager.migrateExistingTheme(theme, 'local');
          } catch (error) {
            console.error('Fehler beim Laden des lokalen Themes:', error);
          }
        }
        
        // Falls kein lokales Theme, Cloud-Theme als Fallback
        let isUsingCloudTheme = false;
        if (!theme && user) {
          const cloudTheme = await loadCloudTheme();
          if (cloudTheme) {
            theme = cloudTheme;
            isUsingCloudTheme = true;
            setSyncMode('cloud'); // Wenn nur Cloud-Theme existiert, default auf cloud
            
            // Migrate existing cloud theme to use reference counting
            await backgroundImageManager.migrateExistingTheme(cloudTheme, 'cloud');
            
            // WICHTIG: Speichere Cloud-Theme temporär im localStorage,
            // damit BackgroundMedia Komponente es aufgreifen kann (speziell für Videos)
            localStorage.setItem('customTheme', JSON.stringify(cloudTheme));
            console.log('Cloud-Theme als Fallback geladen und im localStorage gespeichert');
          }
        }
        
        if (theme) {
          const primary = theme.primaryColor || '#00fed7';
          const background = theme.backgroundColor || '#000000';
          const surface = theme.surfaceColor || '#2d2d30';
          const accent = theme.accentColor || '#00e6c3';
          const bgImage = theme.backgroundImage;
          const bgOpacity = theme.backgroundImageOpacity ?? 0.5;
          const bgBlur = theme.backgroundImageBlur ?? 0;
          const bgIsVideo = theme.backgroundIsVideo ?? false;
          
          setTempPrimaryColor(primary);
          setTempBackgroundColor(background);
          setTempSurfaceColor(surface);
          setTempAccentColor(accent);
          setTempBackgroundImage(bgImage);
          setTempBackgroundImageOpacity(bgOpacity);
          setTempBackgroundImageBlur(bgBlur);
          setTempBackgroundIsVideo(bgIsVideo);
          
          // Store original values
          originalValuesRef.current = {
            primaryColor: primary,
            backgroundColor: background,
            surfaceColor: surface,
            accentColor: accent,
            backgroundImage: bgImage,
            backgroundImageOpacity: bgOpacity,
            backgroundImageBlur: bgBlur,
            backgroundIsVideo: bgIsVideo,
          };
          
          // Trigger theme change event wenn Cloud-Theme als Fallback verwendet wird
          if (isUsingCloudTheme) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('themeChanged'));
            }, 100);
          }
        } else {
          // Wenn kein Theme gespeichert ist, aktuelle CSS-Variablen lesen
          const computedStyle = getComputedStyle(document.documentElement);
          const currentPrimary = computedStyle.getPropertyValue('--theme-primary').trim() || '#00fed7';
          const currentBackground = computedStyle.getPropertyValue('--theme-background').trim() || '#000000';
          const currentSurface = computedStyle.getPropertyValue('--theme-surface').trim() || '#2d2d30';
          const currentAccent = computedStyle.getPropertyValue('--theme-accent').trim() || '#00e6c3';
          
          setTempPrimaryColor(currentPrimary);
          setTempBackgroundColor(currentBackground);
          setTempSurfaceColor(currentSurface);
          setTempAccentColor(currentAccent);
          
          // Store original values
          originalValuesRef.current = {
            primaryColor: currentPrimary,
            backgroundColor: currentBackground,
            surfaceColor: currentSurface,
            accentColor: currentAccent,
            backgroundImageOpacity: 0.5,
            backgroundImageBlur: 0,
            backgroundIsVideo: false,
          };
        }
        
        setIsInitialized(true);
        setLoading(false);
      } else {
        setIsInitialized(false);
      }
    };
    
    loadTheme();
  }, [open, user]);

  // Funktion um eine Farbe heller zu machen
  const adjustBrightness = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  };

  const updateCSSVariables = useCallback(
    (
      primary: string,
      background: string,
      surface: string,
      accent: string,
      backgroundImage?: string,
      backgroundImageOpacity?: number,
      backgroundImageBlur?: number
    ) => {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', primary);
      const primaryHover = adjustBrightness(primary, 10);
      root.style.setProperty('--theme-primary-hover', primaryHover);
      root.style.setProperty('--theme-accent', accent);
      root.style.setProperty('--theme-background', background);
      root.style.setProperty('--theme-surface', surface);
      root.style.setProperty('--theme-text-primary', primary);
      root.style.setProperty('--theme-text-secondary', '#ffffff');
      
      // Background image
      if (backgroundImage) {
        root.style.setProperty('--background-image', `url(${backgroundImage})`);
        root.style.setProperty('--background-image-opacity', String(backgroundImageOpacity || 0.5));
        root.style.setProperty('--background-image-blur', `${backgroundImageBlur || 0}px`);
        document.body.classList.add('has-background-image');
      } else {
        root.style.removeProperty('--background-image');
        root.style.removeProperty('--background-image-opacity');
        root.style.removeProperty('--background-image-blur');
        document.body.classList.remove('has-background-image');
        document.body.classList.remove('has-background-video');
      }
      
      // Update theme-color Meta-Tag für PWA Status Bar
      const metaThemeColor = document.getElementById('theme-color-meta') as HTMLMetaElement;
      if (metaThemeColor) {
        metaThemeColor.content = background;
      }
    },
    []
  );

  // Debounced update function
  const debouncedUpdate = useCallback(() => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    updateTimerRef.current = setTimeout(() => {
      updateCSSVariables(tempPrimaryColor, tempBackgroundColor, tempSurfaceColor, tempAccentColor, tempBackgroundImage, tempBackgroundImageOpacity, tempBackgroundImageBlur);
      
      // Force update theme if image was removed
      if (!tempBackgroundImage) {
        const root = document.documentElement;
        root.style.removeProperty('--background-image');
        root.style.removeProperty('--background-image-opacity');
        root.style.removeProperty('--background-image-blur');
        document.body.classList.remove('has-background-image');
        document.body.classList.remove('has-background-video');
      }
      
      window.dispatchEvent(new CustomEvent('themeChanged'));
    }, 50);
  }, [tempPrimaryColor, tempBackgroundColor, tempSurfaceColor, tempAccentColor, tempBackgroundImage, tempBackgroundImageOpacity, tempBackgroundImageBlur, updateCSSVariables]);

  // Live update beim Ändern - aber nur nach Initialisierung
  React.useEffect(() => {
    if (isInitialized && open) {
      debouncedUpdate();
    }
  }, [tempPrimaryColor, tempBackgroundColor, tempSurfaceColor, tempAccentColor, debouncedUpdate, isInitialized, open]);

  const handleSave = async () => {
    const themeData: any = {
      primaryColor: tempPrimaryColor,
      backgroundColor: tempBackgroundColor,
      surfaceColor: tempSurfaceColor,
      accentColor: tempAccentColor,
      backgroundImageOpacity: tempBackgroundImageOpacity,
      backgroundImageBlur: tempBackgroundImageBlur,
      backgroundIsVideo: tempBackgroundIsVideo,
    };
    
    // Firebase akzeptiert kein undefined - verwende null oder lasse Feld weg
    if (tempBackgroundImage !== undefined) {
      themeData.backgroundImage = tempBackgroundImage;
    } else {
      themeData.backgroundImage = null;
    }
    
    setLoading(true);
    
    // Timeout für Mobile - falls Firebase hängt
    const saveTimeout = setTimeout(() => {
      console.warn('Speichern dauert zu lange, schließe Dialog...');
      setLoading(false);
      onClose();
    }, 5000); // 5 Sekunden Timeout
    
    try {
      // Get current themes to track image changes
      const currentLocalTheme = localStorage.getItem('customTheme');
      const oldLocalTheme = currentLocalTheme ? JSON.parse(currentLocalTheme) : null;
      
      // IMMER lokal speichern - das gibt dem Gerät ein lokales Theme
      localStorage.setItem('customTheme', JSON.stringify(themeData));
      localStorage.setItem('themeSyncMode', syncMode);
      
      // Update local theme image reference
      await backgroundImageManager.updateImageReference(
        oldLocalTheme?.backgroundImage,
        themeData.backgroundImage,
        'local'
      );
      
      if (syncMode === 'cloud' && user) {
        try {
          // Firebase-Operationen mit Timeout (max 3 Sekunden)
          await Promise.race([
            (async () => {
              // Get old cloud theme for reference tracking
              const oldCloudTheme = await loadCloudTheme();
              
              // ZUSÄTZLICH in Cloud speichern für andere Geräte
              const themeRef = firebase.database().ref(`users/${user.uid}/theme`);
              await themeRef.set(themeData);
              
              // Update cloud theme image reference
              await backgroundImageManager.updateImageReference(
                oldCloudTheme?.backgroundImage,
                themeData.backgroundImage,
                'cloud'
              );
            })(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Firebase timeout')), 3000)
            )
          ]);
          
          console.log('Theme saved to cloud and locally with reference tracking');
        } catch (firebaseError) {
          console.warn('Firebase save timed out or failed, but local save succeeded:', firebaseError);
          // Kein Problem - lokales Theme wurde gespeichert
        }
      } else {
        // NUR lokal gespeichert
        console.log('Theme saved locally only with reference tracking');
        
        // Optional: Cloud-Theme löschen wenn explizit auf "local" gewechselt
        // Auskommentiert, da User vielleicht Cloud-Theme als Fallback behalten will
        // if (user) {
        //   const themeRef = firebase.database().ref(`users/${user.uid}/theme`);
        //   await themeRef.remove();
        // }
      }
      
      updateCSSVariables(
        tempPrimaryColor,
        tempBackgroundColor,
        tempSurfaceColor,
        tempAccentColor,
        tempBackgroundImage,
        tempBackgroundImageOpacity,
        tempBackgroundImageBlur
      );
      
      window.dispatchEvent(new CustomEvent('themeChanged'));
      
      // Clear timeout und schließe Dialog
      clearTimeout(saveTimeout);
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Themes:', error);
      clearTimeout(saveTimeout);
      setLoading(false);
      
      // Bei Fehler trotzdem schließen, da das Theme lokal gespeichert wurde
      // und der User nicht "hängen" bleiben soll
      alert('Theme wurde lokal gespeichert. Cloud-Synchronisation fehlgeschlagen.');
      onClose();
    }
  };

  const handleLocalResetClick = async () => {
    // Always try to load cloud theme for preview (regardless of sync mode)
    if (user) {
      const cloudTheme = await loadCloudTheme();
      setCloudThemePreview(cloudTheme);
    } else {
      setCloudThemePreview(null);
    }
    setLocalResetModalOpen(true);
  };
  
  const handleLocalReset = async () => {
    setLocalResetModalOpen(false);
    setLoading(true);
    
    try {
      // Get current local theme for reference cleanup
      const currentLocalTheme = localStorage.getItem('customTheme');
      const oldLocalTheme = currentLocalTheme ? JSON.parse(currentLocalTheme) : null;
      
      // Remove local image reference if exists
      if (oldLocalTheme?.backgroundImage) {
        await backgroundImageManager.removeImageReference(oldLocalTheme.backgroundImage, 'local');
      }
      
      // Remove local theme (but keep syncMode!)
      localStorage.removeItem('customTheme');
      // Keep syncMode: localStorage.getItem('themeSyncMode') bleibt erhalten
      
      // Load appropriate theme immediately
      let themeToApply = null;
      
      // Debug logging
      console.log('Reset Debug:', {
        user: user?.uid,
        syncMode,
        savedSyncMode: localStorage.getItem('themeSyncMode')
      });
      
      // Try to load cloud theme as fallback (regardless of sync mode!)
      // When local theme is deleted, cloud theme should always be the fallback if it exists
      if (user) {
        console.log('Loading cloud theme as fallback for user:', user.uid);
        themeToApply = await loadCloudTheme();
        if (themeToApply) {
          console.log('Cloud theme found and will be applied:', themeToApply);
        } else {
          console.log('No cloud theme found, will use defaults');
        }
      } else {
        console.log('No user logged in, will use defaults');
      }
      
      if (themeToApply) {
        // Apply cloud theme to dialog state
        setTempPrimaryColor(themeToApply.primaryColor || '#00fed7');
        setTempBackgroundColor(themeToApply.backgroundColor || '#000000');
        setTempSurfaceColor(themeToApply.surfaceColor || '#2d2d30');
        setTempAccentColor(themeToApply.accentColor || '#00e6c3');
        setTempBackgroundImage(themeToApply.backgroundImage || undefined);
        setTempBackgroundImageOpacity(themeToApply.backgroundImageOpacity ?? 0.5);
        setTempBackgroundImageBlur(themeToApply.backgroundImageBlur ?? 0);
        setTempBackgroundIsVideo(themeToApply.backgroundIsVideo ?? false);
        
        // Apply to CSS immediately
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', themeToApply.primaryColor || '#00fed7');
        const primaryHover = adjustBrightness(themeToApply.primaryColor || '#00fed7', 10);
        root.style.setProperty('--theme-primary-hover', primaryHover);
        root.style.setProperty('--theme-accent', themeToApply.accentColor || '#00e6c3');
        root.style.setProperty('--theme-background', themeToApply.backgroundColor || '#000000');
        root.style.setProperty('--theme-surface', themeToApply.surfaceColor || '#2d2d30');
        root.style.setProperty('--theme-text-primary', themeToApply.primaryColor || '#00fed7');
        root.style.setProperty('--theme-text-secondary', '#ffffff');
        
        // Background image/video
        if (themeToApply.backgroundImage) {
          root.style.setProperty('--background-image', `url(${themeToApply.backgroundImage})`);
          root.style.setProperty('--background-image-opacity', String(themeToApply.backgroundImageOpacity || 0.5));
          root.style.setProperty('--background-image-blur', `${themeToApply.backgroundImageBlur || 0}px`);
          document.body.classList.add('has-background-image');
          
          // Add video class if needed
          if (themeToApply.backgroundIsVideo) {
            document.body.classList.add('has-background-video');
          } else {
            document.body.classList.remove('has-background-video');
          }
        } else {
          root.style.removeProperty('--background-image');
          root.style.removeProperty('--background-image-opacity');
          root.style.removeProperty('--background-image-blur');
          document.body.classList.remove('has-background-image');
          document.body.classList.remove('has-background-video');
        }
        
        // Update PWA theme color
        const metaThemeColor = document.getElementById('theme-color-meta') as HTMLMetaElement;
        if (metaThemeColor) {
          metaThemeColor.content = themeToApply.backgroundColor || '#000000';
        }
        
        // WICHTIG: Speichere das Cloud-Theme temporär im localStorage,
        // damit BackgroundMedia Komponente es aufgreifen kann (speziell für Videos)
        localStorage.setItem('customTheme', JSON.stringify(themeToApply));
        
        console.log('Cloud-Theme erfolgreich angewendet und temporär lokal gespeichert');
      } else {
        // Apply defaults
        console.log('Kein Cloud-Theme gefunden, verwende Defaults');
        applyDefaultTheme();
      }
      
      // Trigger theme change event
      window.dispatchEvent(new CustomEvent('themeChanged'));
      
    } catch (error) {
      console.error('Fehler beim Reset:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloudDeleteClick = () => {
    if (!user) return;
    setCloudDeleteModalOpen(true);
  };
  
  const handleCloudDelete = async () => {
    setCloudDeleteModalOpen(false);
    
    try {
      // Get cloud theme for reference cleanup
      const cloudTheme = await loadCloudTheme();
      
      // Remove cloud image reference if exists
      if (cloudTheme?.backgroundImage) {
        await backgroundImageManager.removeImageReference(cloudTheme.backgroundImage, 'cloud');
      }
      
      // Delete cloud theme
      const themeRef = firebase.database().ref(`users/${user!.uid}/theme`);
      await themeRef.remove();
      
      console.log('Cloud-Theme gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen des Cloud-Themes:', error);
      alert('Fehler beim Löschen des Cloud-Themes');
    }
  };
  
  const applyDefaultTheme = () => {
    setTempPrimaryColor('#00fed7');
    setTempBackgroundColor('#000000');
    setTempSurfaceColor('#2d2d30');
    setTempAccentColor('#00e6c3');
    setTempBackgroundImage(undefined);
    setTempBackgroundImageOpacity(0.5);
    setTempBackgroundImageBlur(0);
    setTempBackgroundIsVideo(false);
    
    updateCSSVariables(
      '#00fed7',
      '#000000',
      '#2d2d30',
      '#00e6c3',
      undefined,
      0.5,
      0
    );
  };

  // Quick Theme Presets
  const presets = [
    { name: '🌊', p: '#00fed7', b: '#000000', s: '#2d2d30', a: '#ff6b6b' },
    { name: '🔥', p: '#ef4444', b: '#18181b', s: '#3f3f46', a: '#fbbf24' },
    { name: '🌸', p: '#ec4899', b: '#1a0b14', s: '#3d1929', a: '#a78bfa' },
    { name: '💎', p: '#06b6d4', b: '#020617', s: '#0f172a', a: '#38bdf8' },
    { name: '🌿', p: '#22c55e', b: '#020403', s: '#0a1f0d', a: '#86efac' },
    { name: '⚡', p: '#facc15', b: '#0a0a0a', s: '#262626', a: '#fb923c' },
    { name: '🦄', p: '#e879f9', b: '#0f0019', s: '#2e1065', a: '#c084fc' },
    { name: '🌅', p: '#fb923c', b: '#1c0a00', s: '#431407', a: '#fde047' },
  ];

  const getCurrentColor = () => {
    switch(activeColor) {
      case 'primary': return tempPrimaryColor;
      case 'background': return tempBackgroundColor;
      case 'surface': return tempSurfaceColor;
      case 'accent': return tempAccentColor;
    }
  };

  const setCurrentColor = (color: string) => {
    switch(activeColor) {
      case 'primary': setTempPrimaryColor(color); break;
      case 'background': setTempBackgroundColor(color); break;
      case 'surface': setTempSurfaceColor(color); break;
      case 'accent': setTempAccentColor(color); break;
    }
  };
  
  // Restore original theme when closing without saving
  const handleClose = () => {
    if (originalValuesRef.current) {
      // Restore original CSS variables
      updateCSSVariables(
        originalValuesRef.current.primaryColor,
        originalValuesRef.current.backgroundColor,
        originalValuesRef.current.surfaceColor,
        originalValuesRef.current.accentColor,
        originalValuesRef.current.backgroundImage,
        originalValuesRef.current.backgroundImageOpacity,
        originalValuesRef.current.backgroundImageBlur
      );
      
      // If there was a background video, restore it
      if (originalValuesRef.current.backgroundIsVideo && originalValuesRef.current.backgroundImage) {
        document.body.classList.add('has-background-video');
      } else {
        document.body.classList.remove('has-background-video');
      }
      
      // Trigger theme change event to update BackgroundMedia
      window.dispatchEvent(new CustomEvent('themeChanged'));
    }
    
    // Clear update timer if exists
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    onClose();
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: tempBackgroundColor,
          backgroundImage: 'none',
          borderRadius: 3,
          width: { xs: '95%', sm: '500px' },
          maxWidth: '500px',
          border: `2px solid ${tempPrimaryColor}`,
        },
      }}
    >
      {/* Minimalistischer Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 3,
        borderBottom: `1px solid ${tempPrimaryColor}20`,
      }}>
        <Typography sx={{ 
          fontSize: '1rem',
          fontWeight: 600,
          color: tempPrimaryColor,
          letterSpacing: 1,
        }}>
          THEME
        </Typography>
        
        {/* Sync Mode Toggle - More prominent */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mx: 'auto' }}>
          <ToggleButtonGroup
            value={syncMode}
            exclusive
            onChange={(_, newMode) => newMode && setSyncMode(newMode)}
            size="small"
          >
            <ToggleButton 
              value="local" 
              sx={{ 
                px: 2,
                gap: 0.5,
                color: syncMode === 'local' ? tempBackgroundColor : tempPrimaryColor,
                borderColor: tempPrimaryColor,
                bgcolor: syncMode === 'local' ? tempPrimaryColor : 'transparent',
                '&:hover': {
                  bgcolor: syncMode === 'local' ? tempPrimaryColor : `${tempPrimaryColor}20`,
                },
                '&.Mui-selected': {
                  bgcolor: tempPrimaryColor,
                  color: tempBackgroundColor,
                  '&:hover': {
                    bgcolor: adjustBrightness(tempPrimaryColor, -10),
                  },
                },
              }}
            >
              <ComputerIcon sx={{ fontSize: '1.2rem' }} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                Lokal
              </Typography>
            </ToggleButton>
            <ToggleButton 
              value="cloud" 
              disabled={!user}
              sx={{ 
                px: 2,
                gap: 0.5,
                color: syncMode === 'cloud' ? tempBackgroundColor : tempPrimaryColor,
                borderColor: tempPrimaryColor,
                bgcolor: syncMode === 'cloud' ? tempPrimaryColor : 'transparent',
                opacity: !user ? 0.5 : 1,
                '&:hover': {
                  bgcolor: syncMode === 'cloud' ? tempPrimaryColor : `${tempPrimaryColor}20`,
                },
                '&.Mui-selected': {
                  bgcolor: tempPrimaryColor,
                  color: tempBackgroundColor,
                  '&:hover': {
                    bgcolor: adjustBrightness(tempPrimaryColor, -10),
                  },
                },
              }}
            >
              <CloudIcon sx={{ fontSize: '1.2rem' }} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                Cloud
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        
        <IconButton onClick={handleClose} size="small" sx={{ color: tempPrimaryColor }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 },
        overflowX: 'hidden' 
      }}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
          {/* Sync Mode Info - Clear explanation */}
          <Box sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: syncMode === 'cloud' ? `${tempPrimaryColor}10` : `${tempSurfaceColor}50`,
            border: `1px solid ${syncMode === 'cloud' ? tempPrimaryColor : tempPrimaryColor}30`,
          }}>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {syncMode === 'cloud' ? (
                  <CloudIcon sx={{ fontSize: '1.2rem', color: tempPrimaryColor }} />
                ) : (
                  <ComputerIcon sx={{ fontSize: '1.2rem', color: tempPrimaryColor }} />
                )}
                <Typography sx={{ 
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: tempPrimaryColor,
                }}>
                  {syncMode === 'cloud' ? 'Cloud-Sync Modus' : 'Lokaler Modus'}
                </Typography>
              </Stack>
              
              <Typography sx={{ 
                fontSize: '0.75rem',
                color: '#fff',
                opacity: 0.9,
              }}>
                {syncMode === 'cloud' 
                  ? 'Dein Theme wird lokal UND in der Cloud gespeichert. Neue Geräte laden automatisch dein Cloud-Theme.'
                  : 'Dein Theme wird NUR auf diesem Gerät gespeichert. Andere Geräte sind nicht betroffen.'}
              </Typography>
              
              {syncMode === 'cloud' && (
                <Typography sx={{ 
                  fontSize: '0.7rem',
                  color: tempAccentColor,
                  opacity: 0.8,
                  fontStyle: 'italic',
                }}>
                  💡 Tipp: Jedes Gerät kann trotzdem eigene Anpassungen haben (lokales Theme überschreibt Cloud)
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Quick Presets - Responsive Grid */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { 
              xs: 'repeat(4, 1fr)',  // 4 columns on mobile
              sm: 'repeat(8, 1fr)'   // 8 columns on desktop
            },
            gap: 1.5,
          }}>
            {presets.map((preset, i) => (
              <Box
                key={i}
                onClick={() => {
                  setTempPrimaryColor(preset.p);
                  setTempBackgroundColor(preset.b);
                  setTempSurfaceColor(preset.s);
                  setTempAccentColor(preset.a);
                }}
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  bgcolor: preset.s,
                  border: `2px solid ${preset.p}`,
                  cursor: 'pointer',
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
              >
                {preset.name}
              </Box>
            ))}
          </Box>

          {/* Color Selector - Even Grid */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1.5,
          }}>
            {[
              { key: 'primary' as const, label: 'Primär' },
              { key: 'background' as const, label: 'Hintergrund' },
              { key: 'surface' as const, label: 'Fläche' },
              { key: 'accent' as const, label: 'Akzent' },
            ].map((item) => (
              <Box
                key={item.key}
                onClick={() => setActiveColor(item.key)}
                sx={{
                  aspectRatio: '1.5',
                  bgcolor: 
                    item.key === 'primary' ? tempPrimaryColor :
                    item.key === 'background' ? tempBackgroundColor :
                    item.key === 'surface' ? tempSurfaceColor :
                    tempAccentColor,
                  borderRadius: 2,
                  cursor: 'pointer',
                  position: 'relative',
                  border: activeColor === item.key ? `3px solid #fff` : `1px solid ${tempPrimaryColor}30`,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  pb: 1,
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              >
                <Typography sx={{
                  fontSize: '0.65rem',
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  fontWeight: 600,
                }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Color Picker - Centered */}
          <Stack spacing={2} alignItems="center">
            <HexColorPicker
              color={getCurrentColor()}
              onChange={setCurrentColor}
              style={{ 
                width: '100%', 
                maxWidth: '280px',
                height: '200px',
              }}
            />
            
            {/* Hex Input */}
            <input
              type="text"
              value={getCurrentColor()}
              onChange={(e) => setCurrentColor(e.target.value)}
              style={{
                padding: '10px 20px',
                backgroundColor: tempSurfaceColor,
                border: `1px solid ${tempPrimaryColor}30`,
                borderRadius: '8px',
                color: '#fff',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '14px',
                width: '140px',
                outline: 'none',
              }}
            />
          </Stack>

          {/* Background Image Upload */}
          <BackgroundImageFirebaseUpload
            backgroundImage={tempBackgroundImage}
            backgroundImageOpacity={tempBackgroundImageOpacity}
            backgroundImageBlur={tempBackgroundImageBlur}
            primaryColor={tempPrimaryColor}
            surfaceColor={tempSurfaceColor}
            onImageChange={setTempBackgroundImage}
            onOpacityChange={setTempBackgroundImageOpacity}
            onBlurChange={setTempBackgroundImageBlur}
            isVideo={tempBackgroundIsVideo}
            onIsVideoChange={setTempBackgroundIsVideo}
          />

          {/* Live Preview - Minimal */}
          <Box sx={{ 
            p: 2.5,
            bgcolor: tempSurfaceColor,
            borderRadius: 2,
            border: `1px solid ${tempPrimaryColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Button
              size="small"
              sx={{
                bgcolor: tempPrimaryColor,
                color: tempBackgroundColor,
                fontSize: '0.7rem',
                px: 2,
                '&:hover': { bgcolor: adjustBrightness(tempPrimaryColor, 10) },
              }}
            >
              Button
            </Button>
            
            <Typography sx={{ 
              color: tempPrimaryColor,
              fontSize: '0.8rem',
              textDecoration: 'underline',
            }}>
              Link
            </Typography>
            
            <Box sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: tempAccentColor,
            }} />
            
            <Typography sx={{ 
              color: '#fff',
              fontSize: '0.8rem',
              opacity: 0.7,
            }}>
              Text
            </Typography>
          </Box>

          {/* Actions - Multiple buttons */}
          <Stack spacing={1.5}>
            {/* Save Button - Full Width */}
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              startIcon={<SaveIcon sx={{ fontSize: '1rem' }} />}
              fullWidth
              sx={{
                bgcolor: tempPrimaryColor,
                color: tempBackgroundColor,
                fontSize: '0.85rem',
                fontWeight: 600,
                py: 1.2,
                '&:hover': { bgcolor: adjustBrightness(tempPrimaryColor, 10) },
              }}
            >
              {loading ? 'Speichert...' : 'Speichern'}
            </Button>
            
            {/* Reset Buttons - Side by Side */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
            }}>
              <Button
                variant="outlined"
                onClick={handleLocalResetClick}
                disabled={loading}
                startIcon={<RestartAltIcon sx={{ fontSize: '0.9rem' }} />}
                sx={{
                  color: tempPrimaryColor,
                  borderColor: `${tempPrimaryColor}50`,
                  fontSize: '0.75rem',
                  py: 0.8,
                  '&:hover': {
                    borderColor: tempPrimaryColor,
                    bgcolor: `${tempPrimaryColor}10`,
                  },
                }}
              >
                Lokal Reset
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleCloudDeleteClick}
                disabled={loading || !user || syncMode !== 'cloud'}
                startIcon={<DeleteForeverIcon sx={{ fontSize: '0.9rem' }} />}
                sx={{
                  color: syncMode === 'cloud' ? '#ff4444' : tempPrimaryColor,
                  borderColor: syncMode === 'cloud' ? '#ff444450' : `${tempPrimaryColor}30`,
                  fontSize: '0.75rem',
                  py: 0.8,
                  opacity: (!user || syncMode !== 'cloud') ? 0.5 : 1,
                  '&:hover': {
                    borderColor: syncMode === 'cloud' ? '#ff4444' : tempPrimaryColor,
                    bgcolor: syncMode === 'cloud' ? '#ff444410' : `${tempPrimaryColor}10`,
                  },
                }}
              >
                Cloud löschen
              </Button>
            </Box>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
    
    {/* Local Reset Modal */}
    <Dialog
      open={localResetModalOpen}
      onClose={() => setLocalResetModalOpen(false)}
      PaperProps={{
        sx: {
          bgcolor: tempBackgroundColor,
          backgroundImage: 'none',
          borderRadius: 2,
          border: `2px solid ${tempPrimaryColor}`,
          minWidth: { xs: '90%', sm: '400px' },
        },
      }}
    >
      <DialogTitle sx={{ 
        color: tempPrimaryColor,
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <RestartAltIcon />
        Lokales Theme zurücksetzen
      </DialogTitle>
      
      <Divider sx={{ borderColor: `${tempPrimaryColor}30` }} />
      
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ color: '#fff', mb: 2, fontSize: '0.9rem' }}>
              ✅ <strong>Was passiert:</strong>
            </Typography>
            <Stack spacing={1} sx={{ pl: 2 }}>
              <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                • Dein lokales Theme auf diesem Gerät wird gelöscht
              </Typography>
              {cloudThemePreview ? (
                <>
                  <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                    • Das Cloud-Theme wird automatisch geladen
                  </Typography>
                  <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                    • Andere Geräte sind nicht betroffen
                  </Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                    • Standard-Farben werden wiederhergestellt
                  </Typography>
                  <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                    • Kein Cloud-Theme vorhanden zum Laden
                  </Typography>
                  <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                    • Andere Geräte sind nicht betroffen
                  </Typography>
                </>
              )}
            </Stack>
          </Box>
          
          {cloudThemePreview && (
            <Box>
              <Typography sx={{ color: tempPrimaryColor, mb: 2, fontSize: '0.9rem' }}>
                ☁️ <strong>Cloud-Theme Vorschau:</strong>
              </Typography>
              <Box sx={{
                p: 2,
                borderRadius: 1,
                border: `1px solid ${tempPrimaryColor}30`,
                bgcolor: cloudThemePreview.surfaceColor || '#2d2d30',
              }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1,
                    bgcolor: cloudThemePreview.primaryColor || '#00fed7',
                    border: '2px solid #fff',
                  }} />
                  <Box sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1,
                    bgcolor: cloudThemePreview.backgroundColor || '#000000',
                    border: '1px solid #fff',
                  }} />
                  <Box sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1,
                    bgcolor: cloudThemePreview.accentColor || '#00e6c3',
                    border: '1px solid #fff',
                  }} />
                  {cloudThemePreview.backgroundImage && (
                    <Typography sx={{ color: '#fff', fontSize: '0.8rem', ml: 'auto' }}>
                      📷 Bild/Video
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={() => setLocalResetModalOpen(false)}
          sx={{
            color: tempPrimaryColor,
            '&:hover': { bgcolor: `${tempPrimaryColor}10` },
          }}
        >
          Abbrechen
        </Button>
        <Button
          onClick={handleLocalReset}
          variant="contained"
          startIcon={<RestartAltIcon />}
          sx={{
            bgcolor: tempPrimaryColor,
            color: tempBackgroundColor,
            '&:hover': { bgcolor: adjustBrightness(tempPrimaryColor, 10) },
          }}
        >
          Zurücksetzen
        </Button>
      </DialogActions>
    </Dialog>
    
    {/* Cloud Delete Modal */}
    <Dialog
      open={cloudDeleteModalOpen}
      onClose={() => setCloudDeleteModalOpen(false)}
      PaperProps={{
        sx: {
          bgcolor: tempBackgroundColor,
          backgroundImage: 'none',
          borderRadius: 2,
          border: `2px solid #ff4444`,
          minWidth: { xs: '90%', sm: '400px' },
        },
      }}
    >
      <DialogTitle sx={{ 
        color: '#ff4444',
        pb: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <DeleteForeverIcon />
        Cloud-Theme löschen
      </DialogTitle>
      
      <Divider sx={{ borderColor: '#ff444430' }} />
      
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <Box sx={{
            p: 2,
            borderRadius: 1,
            bgcolor: '#ff444410',
            border: '1px solid #ff444430',
          }}>
            <Typography sx={{ color: '#ff4444', mb: 1, fontWeight: 600 }}>
              ⚠️ Warnung
            </Typography>
            <Typography sx={{ color: '#fff', fontSize: '0.85rem' }}>
              Dies entfernt das Theme für <strong>ALLE</strong> deine Geräte!
            </Typography>
          </Box>
          
          <Box>
            <Typography sx={{ color: '#fff', mb: 2, fontSize: '0.9rem' }}>
              Was passiert:
            </Typography>
            <Stack spacing={1} sx={{ pl: 2 }}>
              <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                • Cloud-Theme wird unwiderruflich gelöscht
              </Typography>
              <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                • Neue Geräte erhalten kein gespeichertes Theme mehr
              </Typography>
              <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                • Lokale Themes auf anderen Geräten bleiben erhalten
              </Typography>
              <Typography sx={{ color: '#fff', opacity: 0.9, fontSize: '0.85rem' }}>
                • Dieses Gerät behält sein lokales Theme
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={() => setCloudDeleteModalOpen(false)}
          sx={{
            color: tempPrimaryColor,
            '&:hover': { bgcolor: `${tempPrimaryColor}10` },
          }}
        >
          Abbrechen
        </Button>
        <Button
          onClick={handleCloudDelete}
          variant="contained"
          startIcon={<DeleteForeverIcon />}
          sx={{
            bgcolor: '#ff4444',
            color: '#fff',
            '&:hover': { bgcolor: '#cc0000' },
          }}
        >
          Cloud-Theme löschen
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};