/** Google-/Apple-Buttons für Login & Registrierung — gleicher Flow, geteilte Optik. */

import { Box, Button, Divider, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackLogin, trackRegister } from '../../services/firebase/analytics';
import type { SocialProvider } from '../../services/firebase/socialAuth';
import {
  getAuthPlatform,
  signInWithSocial,
  socialAuthErrorMessage,
} from '../../services/firebase/socialAuth';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 384 512" aria-hidden="true">
    <path
      fill="#ffffff"
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
    />
  </svg>
);

const buttonSx = {
  py: 1.4,
  borderRadius: '14px',
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '1rem',
  color: '#fff',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  backdropFilter: 'blur(10px)',
  justifyContent: 'center',
  gap: 1.5,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-1px)',
  },
  '&:disabled': {
    color: 'rgba(255, 255, 255, 0.3)',
  },
};

interface SocialLoginButtonsProps {
  onError: (message: string) => void;
  disabled?: boolean;
}

export const SocialLoginButtons = ({ onError, disabled }: SocialLoginButtonsProps) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  // Apple-Login in der Android-Hülle ausblenden: dort gibt es weder Apple-SDK
  // noch einen WebView-tauglichen OAuth-Flow.
  const showApple = getAuthPlatform() !== 'android';

  const handleClick = async (provider: SocialProvider) => {
    if (busy) return;
    setBusy(provider);
    onError('');
    try {
      const credential = await signInWithSocial(provider);
      if (credential) {
        if (credential.additionalUserInfo?.isNewUser) trackRegister(provider);
        else trackLogin(provider);
        navigate('/');
      }
    } catch (err) {
      onError(await socialAuthErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.85rem', px: 1 }}>
          oder weiter mit
        </Typography>
      </Divider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          fullWidth
          startIcon={<GoogleIcon />}
          disabled={disabled || !!busy}
          onClick={() => handleClick('google')}
          sx={buttonSx}
        >
          {busy === 'google' ? 'Anmelden…' : 'Mit Google anmelden'}
        </Button>
        {showApple && (
          <Button
            fullWidth
            startIcon={<AppleIcon />}
            disabled={disabled || !!busy}
            onClick={() => handleClick('apple')}
            sx={buttonSx}
          >
            {busy === 'apple' ? 'Anmelden…' : 'Mit Apple anmelden'}
          </Button>
        )}
      </Box>
    </Box>
  );
};
