import { Box, Typography, Button, Container, Paper, keyframes } from '@mui/material';
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
  AutoAwesome,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Premium animations
const pulseGlow = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const FeatureCard = ({ icon, title, description, delay, color = '#00fed7' }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    whileHover={{ y: -8, transition: { duration: 0.3 } }}
    style={{ height: '100%' }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 4,
        transition: 'all 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${color}40`,
          boxShadow: `0 20px 40px ${color}15`,
          '&::before': {
            opacity: 1,
          },
        },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${color}20, ${color}05)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5,
          color: color,
          border: `1px solid ${color}30`,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          mb: 1,
          fontWeight: 700,
          fontSize: '1.1rem',
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.55)',
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
        background: '#050508',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(120, 119, 198, 0.25) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: `${pulseGlow} 8s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '45%',
          height: '45%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255, 0, 128, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: `${pulseGlow} 10s ease-in-out infinite 2s`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          right: '20%',
          width: '30%',
          height: '30%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0, 254, 215, 0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: `${pulseGlow} 12s ease-in-out infinite 4s`,
        }}
      />

      {/* Subtle grid pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          py: { xs: 5, sm: 7, md: 10 },
        }}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            {/* Premium badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  mb: 3,
                  background: 'rgba(0, 254, 215, 0.1)',
                  border: '1px solid rgba(0, 254, 215, 0.3)',
                  borderRadius: 10,
                }}
              >
                <AutoAwesome sx={{ fontSize: 16, color: '#00fed7' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#00fed7',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                  }}
                >
                  Die ultimative Streaming-App
                </Typography>
              </Box>
            </motion.div>

            {/* Floating logo */}
            <Box
              sx={{
                position: 'relative',
                display: 'inline-block',
                animation: `${float} 6s ease-in-out infinite`,
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '4rem', sm: '6rem', md: '7.5rem' },
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #00fed7 0%, #7c3aed 50%, #ff0080 100%)',
                  backgroundSize: '200% auto',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                  letterSpacing: '-0.03em',
                  textShadow: '0 0 80px rgba(0, 254, 215, 0.3)',
                  animation: `${shimmer} 4s linear infinite`,
                }}
              >
                TV-RANK
              </Typography>
              {/* Glow effect behind title */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120%',
                  height: '120%',
                  background: 'radial-gradient(ellipse, rgba(0, 254, 215, 0.15) 0%, transparent 60%)',
                  filter: 'blur(30px)',
                  zIndex: -1,
                }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 300,
                fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2.2rem' },
                mb: 2.5,
                letterSpacing: '-0.01em',
              }}
            >
              Dein ultimativer Serien & Film Tracker
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
                maxWidth: 650,
                mx: 'auto',
                mb: 5,
                lineHeight: 1.7,
              }}
            >
              Entdecke neue Serien, verwalte deine Watchlist, tracke deinen Fortschritt
              und teile deine Favoriten mit Freunden - alles in einer App.
            </Typography>

            {/* CTA Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2.5,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  size="large"
                  startIcon={<PersonAdd />}
                  sx={{
                    px: 5,
                    py: 1.75,
                    background: 'linear-gradient(135deg, #00fed7 0%, #00c9b7 100%)',
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: '0 10px 40px rgba(0, 254, 215, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00fed7 0%, #00c9b7 100%)',
                      boxShadow: '0 15px 50px rgba(0, 254, 215, 0.45)',
                    },
                  }}
                >
                  Kostenlos starten
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  size="large"
                  startIcon={<Login />}
                  sx={{
                    px: 5,
                    py: 1.75,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    textTransform: 'none',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#00fed7',
                      background: 'rgba(0, 254, 215, 0.08)',
                      boxShadow: '0 0 30px rgba(0, 254, 215, 0.15)',
                    },
                  }}
                >
                  Anmelden
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>

        {/* Features Grid */}
        <Box sx={{ mb: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Typography
              variant="h3"
              sx={{
                textAlign: 'center',
                color: 'white',
                mb: 2,
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2.75rem' },
              }}
            >
              Alles was du brauchst
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                mb: 6,
                maxWidth: 500,
                mx: 'auto',
              }}
            >
              Leistungsstarke Features für das ultimative Streaming-Erlebnis
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
              gap: 3,
            }}
          >
            <FeatureCard
              icon={<Tv sx={{ fontSize: 28 }} />}
              title="Serien-Tracking"
              description="Verfolge jede Episode, markiere gesehene Folgen und verpasse nie wieder eine neue Staffel."
              delay={0.1}
              color="#00fed7"
            />
            <FeatureCard
              icon={<Movie sx={{ fontSize: 28 }} />}
              title="Film-Bibliothek"
              description="Organisiere deine Filmsammlung, bewerte Filme und entdecke neue Highlights."
              delay={0.15}
              color="#7c3aed"
            />
            <FeatureCard
              icon={<Star sx={{ fontSize: 28 }} />}
              title="Bewertungssystem"
              description="Bewerte nach verschiedenen Kategorien und behalte den Überblick über deine Favoriten."
              delay={0.2}
              color="#ff0080"
            />
            <FeatureCard
              icon={<EmojiEvents sx={{ fontSize: 28 }} />}
              title="Badges & Erfolge"
              description="Sammle Badges für deine Aktivitäten und zeige deine Achievements."
              delay={0.25}
              color="#f59e0b"
            />
            <FeatureCard
              icon={<People sx={{ fontSize: 28 }} />}
              title="Freunde-System"
              description="Teile deine Listen mit Freunden und entdecke, was andere schauen."
              delay={0.3}
              color="#06b6d4"
            />
            <FeatureCard
              icon={<TrendingUp sx={{ fontSize: 28 }} />}
              title="Statistiken"
              description="Detaillierte Einblicke in deine Sehgewohnheiten und Fortschritt."
              delay={0.35}
              color="#10b981"
            />
          </Box>
        </Box>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Box sx={{ mb: 8 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 5,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(0, 254, 215, 0.5), transparent)',
                },
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  textAlign: 'center',
                  color: 'white',
                  mb: 5,
                  fontWeight: 700,
                }}
              >
                Weitere Highlights
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 4,
                }}
              >
                {[
                  { icon: Speed, title: 'Blitzschnell', desc: 'Optimierte Performance für ein flüssiges Erlebnis', color: '#00fed7' },
                  { icon: CloudSync, title: 'Cloud-Sync', desc: 'Deine Daten auf allen Geräten synchronisiert', color: '#7c3aed' },
                  { icon: Notifications, title: 'Smart Notifications', desc: 'Benachrichtigungen für neue Episoden und Updates', color: '#ff0080' },
                  { icon: Analytics, title: 'Deep Analytics', desc: 'Umfassende Einblicke in deine Sehgewohnheiten', color: '#06b6d4' },
                ].map(({ icon: Icon, title, desc, color }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2.5,
                          background: `linear-gradient(135deg, ${color}20, ${color}05)`,
                          border: `1px solid ${color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ color: color, fontSize: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                          {title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              position: 'relative',
            }}
          >
            {/* Glow effect */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '200%',
                background: 'radial-gradient(ellipse, rgba(255, 0, 128, 0.15) 0%, transparent 60%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                mb: 2,
                fontWeight: 700,
                position: 'relative',
              }}
            >
              Bereit loszulegen?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                mb: 4,
                position: 'relative',
              }}
            >
              Starte noch heute und entdecke deine neue Lieblingsserie
            </Typography>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  px: 7,
                  py: 2,
                  background: 'linear-gradient(135deg, #ff0080 0%, #7c3aed 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  borderRadius: 4,
                  textTransform: 'none',
                  boxShadow: '0 10px 40px rgba(255, 0, 128, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ff0080 0%, #7c3aed 100%)',
                    boxShadow: '0 15px 50px rgba(255, 0, 128, 0.45)',
                  },
                }}
              >
                Jetzt kostenlos registrieren
              </Button>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default StartPage;