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
import { GradientText } from '../../components/ui';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  color?: string;
}

const FeatureCard = ({ icon, title, description, delay, color = '#a855f7' }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    style={{ height: '100%' }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        transition: 'all 0.2s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${color}40`,
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          background: `${color}12`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          color: color,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          mb: 1,
          fontWeight: 600,
          fontSize: '1.05rem',
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.45)',
          lineHeight: 1.7,
          fontSize: '0.9rem',
        }}
      >
        {description}
      </Typography>
    </Paper>
  </motion.div>
);

export const StartPage = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 6, sm: 8, md: 12 },
        }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'inline-block',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                mb: 3,
              }}
            >
              Serien & Film Tracker
            </Typography>

            <GradientText as="h1" from="#a855f7" to="#f97316" style={{
                fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
                fontWeight: 800,
                marginBottom: '24px',
                letterSpacing: '-0.03em',
              }}
            >
              TV-RANK
            </GradientText>

            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 300,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                mb: 2,
              }}
            >
              Dein ultimativer Serien & Film Tracker
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                maxWidth: 550,
                mx: 'auto',
                mb: 5,
                lineHeight: 1.7,
              }}
            >
              Entdecke neue Serien, verwalte deine Watchlist, tracke deinen Fortschritt
              und teile deine Favoriten mit Freunden.
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
                  background: '#a855f7',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    background: '#9333ea',
                    boxShadow: 'none',
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
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                  fontSize: '1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'rgba(168, 85, 247, 0.5)',
                    background: 'rgba(168, 85, 247, 0.08)',
                  },
                }}
              >
                Anmelden
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Features Grid */}
        <Box sx={{ mb: 10 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 1.5,
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2.25rem' },
              }}
            >
              Alles was du brauchst
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                mb: 6,
                maxWidth: 450,
                mx: 'auto',
              }}
            >
              Features für das beste Streaming-Erlebnis
            </Typography>
          </motion.div>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr',
              },
              gap: 2.5,
            }}
          >
            <FeatureCard
              icon={<Tv sx={{ fontSize: 24 }} />}
              title="Serien-Tracking"
              description="Verfolge jede Episode, markiere gesehene Folgen und verpasse nie wieder eine neue Staffel."
              delay={0.1}
              color="#a855f7"
            />
            <FeatureCard
              icon={<Movie sx={{ fontSize: 24 }} />}
              title="Film-Bibliothek"
              description="Organisiere deine Filmsammlung, bewerte Filme und entdecke neue Highlights."
              delay={0.15}
              color="#ec4899"
            />
            <FeatureCard
              icon={<Star sx={{ fontSize: 24 }} />}
              title="Bewertungssystem"
              description="Bewerte nach verschiedenen Kategorien und behalte den Überblick über deine Favoriten."
              delay={0.2}
              color="#f97316"
            />
            <FeatureCard
              icon={<EmojiEvents sx={{ fontSize: 24 }} />}
              title="Badges & Erfolge"
              description="Sammle Badges für deine Aktivitäten und zeige deine Achievements."
              delay={0.25}
              color="#c084fc"
            />
            <FeatureCard
              icon={<People sx={{ fontSize: 24 }} />}
              title="Freunde-System"
              description="Teile deine Listen mit Freunden und entdecke, was andere schauen."
              delay={0.3}
              color="#f472b6"
            />
            <FeatureCard
              icon={<TrendingUp sx={{ fontSize: 24 }} />}
              title="Statistiken"
              description="Detaillierte Einblicke in deine Sehgewohnheiten und Fortschritt."
              delay={0.35}
              color="#fb923c"
            />
          </Box>
        </Box>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Box sx={{ mb: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 3,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.9)',
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
                {[
                  { icon: Speed, title: 'Blitzschnell', desc: 'Optimierte Performance für ein flüssiges Erlebnis', color: '#a855f7' },
                  { icon: CloudSync, title: 'Cloud-Sync', desc: 'Deine Daten auf allen Geräten synchronisiert', color: '#ec4899' },
                  { icon: Notifications, title: 'Smart Notifications', desc: 'Benachrichtigungen für neue Episoden und Updates', color: '#f97316' },
                  { icon: Analytics, title: 'Deep Analytics', desc: 'Umfassende Einblicke in deine Sehgewohnheiten', color: '#c084fc' },
                ].map(({ icon: Icon, title, desc, color }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          background: `${color}12`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ color: color, fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600, fontSize: '0.95rem', mb: 0.25 }}>
                          {title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.85rem' }}>
                          {desc}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Paper>
          </Box>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              py: 5,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 1.5,
                fontWeight: 700,
              }}
            >
              Bereit loszulegen?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                mb: 4,
              }}
            >
              Starte noch heute und entdecke deine neue Lieblingsserie
            </Typography>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              sx={{
                px: 5,
                py: 1.75,
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1.1rem',
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
                  boxShadow: 'none',
                },
              }}
            >
              Jetzt kostenlos registrieren
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default StartPage;
