import {
  Delete as DeleteIcon,
  Image as ImageIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import React, { useState } from 'react';
import { useAuth } from '../../App';

interface BackgroundImageFirebaseUploadProps {
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  backgroundImageBlur?: number;
  primaryColor: string;
  surfaceColor: string;
  onImageChange: (imageUrl: string | undefined) => void;
  onOpacityChange: (opacity: number) => void;
  onBlurChange: (blur: number) => void;
  isVideo?: boolean;
  onIsVideoChange?: (isVideo: boolean) => void;
}

export const BackgroundImageFirebaseUpload: React.FC<
  BackgroundImageFirebaseUploadProps
> = ({
  backgroundImage,
  backgroundImageOpacity = 0.5,
  backgroundImageBlur = 0,
  primaryColor,
  surfaceColor,
  onImageChange,
  onOpacityChange,
  onBlurChange,
  isVideo = false,
  onIsVideoChange,
}) => {
  const { user } = useAuth()!;
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Detect if mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  };

  // Compress image for mobile devices
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Komprimierung fehlgeschlagen'));
              }
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };
        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');

    if (!isImageFile && !isVideoFile) {
      setError('Bitte wähle eine Bild- oder Videodatei aus');
      return;
    }

    // Update isVideo state
    if (onIsVideoChange) {
      onIsVideoChange(isVideoFile);
    }

    // Different size limits for mobile vs desktop
    const mobile = isMobile();
    const maxSizeVideo = mobile ? 50 * 1024 * 1024 : 300 * 1024 * 1024; // 50MB mobile, 300MB desktop
    const maxSizeImage = mobile ? 50 * 1024 * 1024 : 100 * 1024 * 1024; // 50MB mobile, 100MB desktop

    // Check file size based on type
    if (isVideoFile && file.size > maxSizeVideo) {
      setError(`Videos dürfen maximal ${mobile ? '50' : '300'}MB groß sein`);
      return;
    }

    if (isImageFile && file.size > maxSizeImage) {
      // Try to compress if it's an image on mobile
      if (mobile) {
        setError('Bild wird für Mobile optimiert...');
      } else {
        setError(`Bilder dürfen maximal 100MB groß sein`);
        return;
      }
    }

    setUploading(true);
    setError(null);

    try {
      let fileToUpload: File | Blob = file;

      // Compress images on mobile devices or if image is too large
      if (isImageFile && (mobile || file.size > maxSizeImage)) {
        try {
          const compressed = await compressImage(
            file,
            mobile ? 1280 : 1920, // Smaller dimensions for mobile
            mobile ? 720 : 1080
          );
          
          // Check if compression was successful
          if (compressed.size < file.size) {
            fileToUpload = compressed;
            console.log(`Komprimiert von ${(file.size / 1024 / 1024).toFixed(2)}MB auf ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
          }

          // Final check after compression
          if (compressed.size > maxSizeImage) {
            setError('Bild ist auch nach Komprimierung zu groß. Bitte wähle ein kleineres Bild.');
            setUploading(false);
            return;
          }
        } catch (compressError) {
          console.error('Fehler bei Bildkomprimierung:', compressError);
          setError('Fehler bei der Bildoptimierung');
          setUploading(false);
          return;
        }
      }

      // Note: We don't delete old image here anymore
      // The reference counting system in ThemeEditor will handle it
      // when the theme is saved with the new image
      
      // Create a unique filename
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
      const filename = `backgrounds/${user.uid}/${timestamp}_${originalName}`;

      // Upload to Firebase Storage
      const storageRef = firebase.storage().ref();
      const fileRef = storageRef.child(filename);
      const uploadTask = fileRef.put(fileToUpload);

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Fehler beim Hochladen des Bildes');
          setUploading(false);
        },
        async () => {
          // Get download URL
          const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
          onImageChange(downloadUrl);
          setUploading(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Fehler beim Hochladen des Bildes');
      setUploading(false);
    }
  };


  const handleRemoveImage = async () => {
    // Note: We don't delete the image from storage here anymore
    // The reference counting system will handle deletion
    // when no themes reference this image anymore
    
    // Update state first
    onImageChange(undefined);
    if (onIsVideoChange) {
      onIsVideoChange(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Immediately remove CSS variables and classes
    const root = document.documentElement;
    root.style.removeProperty('--background-image');
    root.style.removeProperty('--background-image-opacity');
    root.style.removeProperty('--background-image-blur');
    document.body.classList.remove('has-background-image');
    document.body.classList.remove('has-background-video');

    // Update localStorage immediately to persist the change
    const savedTheme = localStorage.getItem('customTheme');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        delete theme.backgroundImage;
        delete theme.backgroundIsVideo;
        delete theme.backgroundImageOpacity;
        delete theme.backgroundImageBlur;
        localStorage.setItem('customTheme', JSON.stringify(theme));
      } catch (error) {
        console.error('Error updating theme in localStorage:', error);
      }
    }

    // Force immediate update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('themeChanged'));
    }, 50);
  };

  return (
    <Stack spacing={2}>
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: primaryColor,
          letterSpacing: 0.5,
        }}
      >
        HINTERGRUNDBILD
      </Typography>

      {error && (
        <Alert
          severity='error'
          onClose={() => setError(null)}
          sx={{
            fontSize: '0.75rem',
            py: 0.5,
          }}
        >
          {error}
        </Alert>
      )}

      {!backgroundImage ? (
        <Box>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*,video/*'
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id='background-image-upload'
            disabled={uploading || !user}
          />
          <label htmlFor='background-image-upload'>
            <Button
              component='span'
              variant='outlined'
              startIcon={
                uploading ? <CircularProgress size={16} /> : <UploadIcon />
              }
              disabled={uploading || !user}
              sx={{
                width: '100%',
                color: primaryColor,
                borderColor: `${primaryColor}50`,
                '&:hover': {
                  borderColor: primaryColor,
                  bgcolor: `${primaryColor}10`,
                },
              }}
            >
              {uploading
                ? `Uploading... ${uploadProgress}%`
                : 'Bild/Video hochladen'}
            </Button>
          </label>
          {!user && (
            <Typography
              variant='caption'
              sx={{
                color: 'error.main',
                display: 'block',
                mt: 1,
                fontSize: '0.7rem',
              }}
            >
              Bitte melde dich an, um einen Hintergrund hochzuladen
            </Typography>
          )}
        </Box>
      ) : (
        <>
          {/* Mobile Warning for Videos */}
          {isVideo && (
            <Alert
              severity='info'
              sx={{
                fontSize: '0.7rem',
                py: 0.5,
                px: 1,
                '& .MuiAlert-message': {
                  fontSize: '0.7rem',
                },
              }}
            >
              Hinweis: Videos werden auf mobilen Geräten aus Performance-Gründen nicht angezeigt
            </Alert>
          )}

          {/* Image/Video Preview */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 150,
              borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${primaryColor}30`,
              bgcolor: surfaceColor,
            }}
          >
            {isVideo ? (
              <video
                src={backgroundImage}
                autoPlay
                loop
                muted
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: backgroundImageOpacity,
                  filter: `blur(${backgroundImageBlur}px)`,
                  transition: 'opacity 0.2s, filter 0.2s',
                }}
              />
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: backgroundImageOpacity,
                  filter: `blur(${backgroundImageBlur}px)`,
                  transition: 'opacity 0.2s, filter 0.2s',
                }}
              />
            )}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
              }}
            >
              <IconButton
                size='small'
                onClick={handleRemoveImage}
                disabled={uploading}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                  },
                }}
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}
            >
              <ImageIcon fontSize='small' />
              <Typography fontSize='0.75rem'>Vorschau</Typography>
            </Box>
          </Box>

          {/* Opacity Control */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: primaryColor,
                opacity: 0.8,
                mb: 1,
              }}
            >
              Transparenz: {Math.round((1 - backgroundImageOpacity) * 100)}%
            </Typography>
            <Slider
              value={1 - backgroundImageOpacity}
              onChange={(_, value) => onOpacityChange(1 - (value as number))}
              min={0}
              max={1}
              step={0.05}
              sx={{
                color: primaryColor,
                '& .MuiSlider-track': {
                  bgcolor: primaryColor,
                },
                '& .MuiSlider-thumb': {
                  bgcolor: primaryColor,
                },
              }}
            />
          </Box>

          {/* Blur Control */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: primaryColor,
                opacity: 0.8,
                mb: 1,
              }}
            >
              Unschärfe: {Math.round((backgroundImageBlur / 20) * 100)}%
            </Typography>
            <Slider
              value={backgroundImageBlur}
              onChange={(_, value) => onBlurChange(value as number)}
              min={0}
              max={20}
              step={1}
              sx={{
                color: primaryColor,
                '& .MuiSlider-track': {
                  bgcolor: primaryColor,
                },
                '& .MuiSlider-thumb': {
                  bgcolor: primaryColor,
                },
              }}
            />
          </Box>

          {/* Replace Image Button */}
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*,video/*'
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id='background-image-replace'
            disabled={uploading}
          />
          <label htmlFor='background-image-replace'>
            <Button
              component='span'
              variant='text'
              size='small'
              startIcon={
                uploading ? <CircularProgress size={16} /> : <UploadIcon />
              }
              disabled={uploading}
              sx={{
                color: primaryColor,
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              {uploading
                ? `Uploading... ${uploadProgress}%`
                : 'Anderes Bild wählen'}
            </Button>
          </label>
        </>
      )}
    </Stack>
  );
};
