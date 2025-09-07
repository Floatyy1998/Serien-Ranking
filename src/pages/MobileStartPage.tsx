import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import {
  Login,
  PersonAdd,
  Star,
  TrendingUp,
  People,
  EmojiEvents,
  Movie,
  Tv,
  Speed,
  CloudSync,
  Notifications,
  Analytics,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    style={{ height: '100%' }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.05)',
          transform: 'translateY(-4px)',
          border: '1px solid rgba(0, 254, 215, 0.3)',
        },
      }}
    >
      <Box sx={{ color: '#00fed7', mb: 2 }}>{icon}</Box>
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          mb: 1,
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Paper>
  </motion.div>
);

export const MobileStartPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Static gradient background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 0, 128, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(0, 255, 215, 0.15) 0%, transparent 50%)
          `,
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 4, sm: 6, md: 8 },
        }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '3.5rem', sm: '5rem', md: '6rem' },
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00fed7 0%, #ff0080 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                letterSpacing: '-0.02em',
              }}
            >
              TV-RANK
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 300,
                fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
                mb: 2,
              }}
            >
              Dein ultimativer Serien & Film Tracker
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
              }}
            >
              Entdecke neue Serien, verwalte deine Watchlist, tracke deinen Fortschritt 
              und teile deine Favoriten mit Freunden - alles in einer App.
            </Typography>

            {/* CTA Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                startIcon={<PersonAdd />}
                sx={{
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #00fed7 0%, #00c9b7 100%)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 8px 32px rgba(0, 254, 215, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00fed7 0%, #00c9b7 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(0, 254, 215, 0.4)',
                  },
                }}
              >
                Kostenlos starten
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                startIcon={<Login />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#00fed7',
                    background: 'rgba(0, 254, 215, 0.1)',
                  },
                }}
              >
                Anmelden
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Features Grid */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              color: 'white',
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.5rem' },
            }}
          >
            Alles was du brauchst
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr',
              },
              gap: 3,
            }}
          >
            <FeatureCard
              icon={<Tv sx={{ fontSize: 40 }} />}
              title="Serien-Tracking"
              description="Verfolge jede Episode, markiere gesehene Folgen und verpasse nie wieder eine neue Staffel."
              delay={0.1}
            />
            <FeatureCard
              icon={<Movie sx={{ fontSize: 40 }} />}
              title="Film-Bibliothek"
              description="Organisiere deine Filmsammlung, bewerte Filme und entdecke neue Highlights."
              delay={0.2}
            />
            <FeatureCard
              icon={<Star sx={{ fontSize: 40 }} />}
              title="Bewertungssystem"
              description="Bewerte nach verschiedenen Kategorien und behalte den Überblick über deine Favoriten."
              delay={0.3}
            />
            <FeatureCard
              icon={<EmojiEvents sx={{ fontSize: 40 }} />}
              title="Badges & Erfolge"
              description="Sammle Badges für deine Aktivitäten und zeige deine Achievements."
              delay={0.4}
            />
            <FeatureCard
              icon={<People sx={{ fontSize: 40 }} />}
              title="Freunde-System"
              description="Teile deine Listen mit Freunden und entdecke, was andere schauen."
              delay={0.5}
            />
            <FeatureCard
              icon={<TrendingUp sx={{ fontSize: 40 }} />}
              title="Statistiken"
              description="Detaillierte Einblicke in deine Sehgewohnheiten und Fortschritt."
              delay={0.6}
            />
          </Box>
        </Box>

        {/* Additional Features */}
        <Box sx={{ mb: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                textAlign: 'center',
                color: 'white',
                mb: 4,
                fontWeight: 600,
              }}
            >
              Weitere Highlights
            </Typography>
            
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Speed sx={{ color: '#00fed7', mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Blitzschnell
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Optimierte Performance für ein flüssiges Erlebnis
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CloudSync sx={{ color: '#00fed7', mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Cloud-Sync
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Deine Daten auf allen Geräten synchronisiert
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Notifications sx={{ color: '#00fed7', mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Smart Notifications
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Benachrichtigungen für neue Episoden und Updates
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Analytics sx={{ color: '#00fed7', mr: 2, fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    Deep Analytics
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Umfassende Einblicke in deine Sehgewohnheiten
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Footer CTA */}
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              mb: 3,
              fontWeight: 600,
            }}
          >
            Bereit loszulegen?
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            size="large"
            sx={{
              px: 6,
              py: 1.5,
              background: 'linear-gradient(135deg, #ff0080 0%, #ff6ec7 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.2rem',
              borderRadius: 3,
              textTransform: 'none',
              boxShadow: '0 8px 32px rgba(255, 0, 128, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #ff0080 0%, #ff6ec7 100%)',
                transform: 'scale(1.05)',
                boxShadow: '0 12px 40px rgba(255, 0, 128, 0.4)',
              },
            }}
          >
            Jetzt kostenlos registrieren
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default MobileStartPage;