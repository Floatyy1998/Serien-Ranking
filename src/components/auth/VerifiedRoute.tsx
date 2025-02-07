import { Button, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface VerifiedRouteProps {
  children: React.ReactNode;
}

export const VerifiedRoute = ({ children }: VerifiedRouteProps) => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = firebase.auth().currentUser;
    if (user) {
      user.reload().then(() => {
        setIsVerified(user.emailVerified);
        setLoading(false);
      });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const resendVerification = () => {
    const user = firebase.auth().currentUser;
    if (user) {
      user
        .sendEmailVerification()
        .then(() => {
          setMessage('Verifizierungslink wurde erneut gesendet.');
        })
        .catch((error) => {
          setMessage(error.message);
        });
    }
  };

  if (loading) {
    return <div>Lade...</div>;
  }

  if (!isVerified) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Typography variant='h6' gutterBottom>
          Email nicht verifiziert
        </Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={resendVerification}
        >
          Hier klicken um Link erneut zu senden
        </Button>
        {message && (
          <Typography variant='body2' style={{ marginTop: '10px' }}>
            {message}
          </Typography>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
