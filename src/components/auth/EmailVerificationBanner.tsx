import { Alert, Snackbar } from '@mui/material';
import { useState } from 'react';

interface EmailVerificationBannerProps {
  children: React.ReactNode;
}

export const EmailVerificationBanner = ({ children }: EmailVerificationBannerProps) => {
  const [message] = useState('');
  const [snackOpen, setSnackOpen] = useState<boolean>(false);

  const handleSnackClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackOpen(false);
  };

  // Since email verification is disabled (no email service available),
  // always render children without any banner
  return (
    <>
      {children}
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleSnackClose}>
        <Alert
          onClose={handleSnackClose}
          severity={message.includes('Fehler') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};