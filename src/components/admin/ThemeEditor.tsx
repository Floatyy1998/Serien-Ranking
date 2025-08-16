import {
  Close as CloseIcon,
  Save as SaveIcon,
  Cloud as CloudIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import React, { useState, useCallback, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useAuth } from '../../App';

interface ThemeEditorProps {
  open: boolean;
  onClose: () => void;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ open, onClose }) => {
  const { user } = useAuth()!;
  
  // Lokaler State für eigenständigen Theme-Editor
  const [tempPrimaryColor, setTempPrimaryColor] = useState('#00fed7');
  const [tempBackgroundColor, setTempBackgroundColor] = useState('#000000');
  const [tempSurfaceColor, setTempSurfaceColor] = useState('#2d2d30');
  const [tempAccentColor, setTempAccentColor] = useState('#00e6c3');
  
  // Sync Mode - local oder cloud
  const [syncMode, setSyncMode] = useState<'local' | 'cloud'>('local');
  
  // Welche Farbe wird gerade bearbeitet
  const [activeColor, setActiveColor] = useState<'primary' | 'background' | 'surface' | 'accent'>('primary');
  
  // Debounce timer ref für Flacker-Vermeidung
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if initial load is complete
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  // Theme von Cloud laden
  const loadCloudTheme = async () => {
    if (!user) return null;
    
    try {
      const themeRef = firebase.database().ref(`users/${user.uid}/theme`);
      const snapshot = await themeRef.once('value');
      return snapshot.val();
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
          } catch (error) {
            console.error('Fehler beim Laden des lokalen Themes:', error);
          }
        }
        
        // Falls kein lokales Theme, Cloud-Theme als Fallback
        if (!theme && user) {
          const cloudTheme = await loadCloudTheme();
          if (cloudTheme) {
            theme = cloudTheme;
            setSyncMode('cloud'); // Wenn nur Cloud-Theme existiert, default auf cloud
          }
        }
        
        if (theme) {
          setTempPrimaryColor(theme.primaryColor || '#00fed7');
          setTempBackgroundColor(theme.backgroundColor || '#000000');
          setTempSurfaceColor(theme.surfaceColor || '#2d2d30');
          setTempAccentColor(theme.accentColor || '#00e6c3');
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
      accent: string
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
      updateCSSVariables(tempPrimaryColor, tempBackgroundColor, tempSurfaceColor, tempAccentColor);
      window.dispatchEvent(new CustomEvent('themeChanged'));
    }, 50);
  }, [tempPrimaryColor, tempBackgroundColor, tempSurfaceColor, tempAccentColor, updateCSSVariables]);

  // Live update beim Ändern - aber nur nach Initialisierung
  React.useEffect(() => {
    if (isInitialized && open) {
      debouncedUpdate();
    }
  }, [tempPrimaryColor, tempBackgroundColor, tempSurfaceColor, tempAccentColor, debouncedUpdate, isInitialized, open]);

  const handleSave = async () => {
    const themeData = {
      primaryColor: tempPrimaryColor,
      backgroundColor: tempBackgroundColor,
      surfaceColor: tempSurfaceColor,
      accentColor: tempAccentColor,
    };
    
    setLoading(true);
    
    try {
      // IMMER lokal speichern - das gibt dem Gerät ein lokales Theme
      localStorage.setItem('customTheme', JSON.stringify(themeData));
      localStorage.setItem('themeSyncMode', syncMode);
      
      if (syncMode === 'cloud' && user) {
        // ZUSÄTZLICH in Cloud speichern für andere Geräte
        const themeRef = firebase.database().ref(`users/${user.uid}/theme`);
        await themeRef.set(themeData);
        console.log('Theme saved to cloud and locally');
      } else {
        // NUR lokal gespeichert
        console.log('Theme saved locally only');
        
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
        tempAccentColor
      );
      
      window.dispatchEvent(new CustomEvent('themeChanged'));
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setTempPrimaryColor('#00fed7');
    setTempBackgroundColor('#000000');
    setTempSurfaceColor('#2d2d30');
    setTempAccentColor('#00e6c3');
    
    // Theme aus beiden Speichern löschen
    localStorage.removeItem('customTheme');
    localStorage.removeItem('themeSyncMode');
    
    if (user) {
      try {
        const themeRef = firebase.database().ref(`users/${user.uid}/theme`);
        await themeRef.remove();
      } catch (error) {
        console.error('Fehler beim Löschen des Cloud-Themes:', error);
      }
    }
    
    setSyncMode('local');
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        
        {/* Sync Mode Toggle */}
        <ToggleButtonGroup
          value={syncMode}
          exclusive
          onChange={(_, newMode) => newMode && setSyncMode(newMode)}
          size="small"
          sx={{ mx: 'auto' }}
        >
          <ToggleButton 
            value="local" 
            sx={{ 
              color: tempPrimaryColor,
              borderColor: `${tempPrimaryColor}50`,
              '&.Mui-selected': {
                bgcolor: `${tempPrimaryColor}20`,
                color: tempPrimaryColor,
              },
            }}
          >
            <Tooltip title="Nur auf diesem Gerät">
              <ComputerIcon sx={{ fontSize: '1rem' }} />
            </Tooltip>
          </ToggleButton>
          <ToggleButton 
            value="cloud" 
            disabled={!user}
            sx={{ 
              color: tempPrimaryColor,
              borderColor: `${tempPrimaryColor}50`,
              '&.Mui-selected': {
                bgcolor: `${tempPrimaryColor}20`,
                color: tempPrimaryColor,
              },
            }}
          >
            <Tooltip title="Auf allen Geräten">
              <CloudIcon sx={{ fontSize: '1rem' }} />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        
        <IconButton onClick={onClose} size="small" sx={{ color: tempPrimaryColor }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ 
        p: { xs: 2, sm: 3 },
        overflowX: 'hidden' 
      }}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
          {/* Sync Mode Info */}
          <Stack spacing={1}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: tempPrimaryColor, 
                opacity: 0.8,
                textAlign: 'center',
                fontSize: '0.7rem',
              }}
            >
              {syncMode === 'cloud' 
                ? '☁️ Theme wird in die Cloud gespeichert und auf neuen Geräten verwendet'
                : '💻 Theme wird nur lokal auf diesem Gerät gespeichert'}
            </Typography>
            
            {syncMode === 'cloud' && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: tempAccentColor, 
                  opacity: 0.9,
                  textAlign: 'center',
                  fontSize: '0.65rem',
                  fontStyle: 'italic',
                }}
              >
                ⚠️ Lokale Themes haben immer Vorrang vor Cloud-Themes
              </Typography>
            )}
          </Stack>

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

          {/* Actions - Even spaced */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: 1.5,
          }}>
            <Button
              variant="text"
              onClick={handleReset}
              disabled={loading}
              sx={{
                color: tempPrimaryColor,
                opacity: 0.7,
                fontSize: '0.85rem',
                py: 1.2,
              }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              startIcon={<SaveIcon sx={{ fontSize: '1rem' }} />}
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
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};