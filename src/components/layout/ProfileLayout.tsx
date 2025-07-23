import { ArrowBack, CalendarToday, Star } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Typography,
} from '@mui/material';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ProfileLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  userProfile?: {
    username: string;
    displayName?: string;
    photoURL?: string;
    isOnline?: boolean;
    lastActive?: number;
  };
  stats?: {
    seriesCount: number;
    moviesCount: number;
    averageRating: number;
    totalWatchedEpisodes: number;
  };
  showBackButton?: boolean;
  backPath?: string;
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({
  children,
  title,
  subtitle,
  userProfile,
  stats,
  showBackButton = false,
  backPath = '/',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavigationButtons = () => {
    if (showBackButton) {
      return (
        <Button
          variant='text'
          onClick={() => navigate(backPath)}
          startIcon={<ArrowBack />}
          sx={{
            color: 'white',
            borderRadius: 2,
            px: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          Zurück
        </Button>
      );
    }

    // Entferne die hässlichen Navigation-Buttons komplett
    return null;
  };

  const getGradientForRoute = () => {
    // Dunkles Theme für alle Bereiche
    if (location.pathname === '/') {
      return 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)'; // Hauptseite
    }
    if (location.pathname === '/movies') {
      return 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)'; // Filme
    }
    if (location.pathname === '/friends') {
      return 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)'; // Freunde
    }
    if (
      location.pathname.startsWith('/profile/') ||
      location.pathname.startsWith('/friend/')
    ) {
      return 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)'; // Profile
    }
    // Default
    return 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)';
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: '#121212' }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        sx={{
          background: getGradientForRoute(),
          p: { xs: 2, md: 3 },
          color: 'white',
          width: '100%',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 },
        }}
      >
        <Box
          display='flex'
          alignItems='center'
          gap={{ xs: 2, md: 3 }}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          {userProfile && (
            <Avatar
              src={userProfile.photoURL}
              sx={{ width: { xs: 60, md: 80 }, height: { xs: 60, md: 80 } }}
            >
              {userProfile.username?.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, flex: 1 }}>
            <Typography
              variant='h4'
              component='h1'
              gutterBottom
              fontWeight='bold'
              sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant='h6'
                sx={{ opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}
              >
                {subtitle}
              </Typography>
            )}
            {userProfile && (
              <Box
                display='flex'
                alignItems='center'
                gap={1}
                mt={1}
                justifyContent={{ xs: 'center', md: 'flex-start' }}
              >
                <Typography variant='body1' sx={{ opacity: 0.9 }}>
                  @{userProfile.username}
                </Typography>
                {userProfile.displayName && (
                  <Typography variant='body2' sx={{ opacity: 0.7 }}>
                    ({userProfile.displayName})
                  </Typography>
                )}
                {userProfile.isOnline && (
                  <Chip
                    label='Online'
                    size='small'
                    sx={{
                      backgroundColor: '#00fed7',
                      color: '#000',
                      fontWeight: 'bold',
                    }}
                  />
                )}
              </Box>
            )}
            {userProfile && !userProfile.isOnline && userProfile.lastActive && (
              <Typography variant='body2' sx={{ opacity: 0.7, mt: 1 }}>
                Zuletzt online:{' '}
                {new Date(userProfile.lastActive).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            )}
          </Box>
        </Box>

        {getNavigationButtons()}
      </Box>

      {/* Statistiken (optional) */}
      {stats && (
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 }, pt: 4, pb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #37474f 0%, #455a64 100%)',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant='h4' gutterBottom fontWeight='bold'>
                {stats.seriesCount}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Serien
              </Typography>
            </Box>

            <Box
              sx={{
                background: 'linear-gradient(135deg, #424242 0%, #546e7a 100%)',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant='h4' gutterBottom fontWeight='bold'>
                {stats.moviesCount}
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Filme
              </Typography>
            </Box>

            <Box
              sx={{
                background: 'linear-gradient(135deg, #546e7a 0%, #607d8b 100%)',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <Box
                display='flex'
                alignItems='center'
                justifyContent='center'
                gap={1}
              >
                <Star sx={{ color: 'white' }} />
                <Typography variant='h4' fontWeight='bold'>
                  {stats.averageRating.toFixed(1)}
                </Typography>
              </Box>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Ø Bewertung
              </Typography>
            </Box>

            <Box
              sx={{
                background: 'linear-gradient(135deg, #607d8b 0%, #78909c 100%)',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <Box
                display='flex'
                alignItems='center'
                justifyContent='center'
                gap={1}
              >
                <CalendarToday sx={{ color: 'white' }} />
                <Typography variant='h4' fontWeight='bold'>
                  {stats.totalWatchedEpisodes}
                </Typography>
              </Box>
              <Typography variant='body2' sx={{ opacity: 0.9 }}>
                Episoden
              </Typography>
            </Box>
          </Box>
        </Container>
      )}

      {/* Content */}
      <Container
        maxWidth={false}
        sx={{ px: { xs: 2, md: 4 }, py: stats ? 2 : 4 }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default ProfileLayout;
