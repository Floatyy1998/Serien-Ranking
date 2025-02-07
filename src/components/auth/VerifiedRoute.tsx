import { Button, Card, CardContent, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();

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

  // Neuer useEffect – periodisch alle 5 Sekunden prüfen, ob die Email verifiziert wurde
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (!isVerified) {
      intervalId = setInterval(() => {
        const user = firebase.auth().currentUser;
        if (user) {
          user.reload().then(() => {
            if (user.emailVerified) {
              setIsVerified(true);
              clearInterval(intervalId);
            }
          });
        }
      }, 5000);
    }
    return () => clearInterval(intervalId);
  }, [isVerified]);

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
      <Card
        style={{
          margin: '20px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent>
          <Typography variant='h5' gutterBottom>
            Email nicht verifiziert
          </Typography>
          <Typography variant='body1' gutterBottom>
            Bitte überprüfen Sie Ihr Postfach und klicken Sie auf den
            Verifizierungslink.
          </Typography>
          <Button
            variant='contained'
            color='primary'
            onClick={resendVerification}
          >
            Link erneut senden
          </Button>
          {message && (
            <Typography variant='body2' style={{ marginTop: '10px' }}>
              {message}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
