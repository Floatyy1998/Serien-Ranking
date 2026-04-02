import { Star, TrendingUp, People, EmojiEvents, Movie, Tv, AutoStories } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';

const FEATURES = [
  {
    icon: <Tv sx={{ fontSize: 24 }} />,
    title: 'Serien-Tracking',
    description:
      'Verfolge jede Episode, markiere gesehene Folgen und verpasse nie wieder eine neue Staffel.',
    delay: 0.1,
    color: '#a855f7',
  },
  {
    icon: <Movie sx={{ fontSize: 24 }} />,
    title: 'Film-Bibliothek',
    description: 'Organisiere deine Filmsammlung, bewerte Filme und entdecke neue Highlights.',
    delay: 0.15,
    color: '#ec4899',
  },
  {
    icon: <Star sx={{ fontSize: 24 }} />,
    title: 'Bewertungssystem',
    description:
      'Bewerte nach verschiedenen Kategorien und behalte den Überblick über deine Favoriten.',
    delay: 0.2,
    color: '#f97316',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: 24 }} />,
    title: 'Badges & Erfolge',
    description: 'Sammle Badges für deine Aktivitäten und zeige deine Achievements.',
    delay: 0.25,
    color: '#c084fc',
  },
  {
    icon: <People sx={{ fontSize: 24 }} />,
    title: 'Freunde-System',
    description: 'Teile deine Listen mit Freunden und entdecke, was andere schauen.',
    delay: 0.3,
    color: '#f472b6',
  },
  {
    icon: <AutoStories sx={{ fontSize: 24 }} />,
    title: 'Manga-Tracking',
    description:
      'Tracke Manga, Manhwa und Manhua. Kapitelfortschritt, Bewertungen und Release-Daten.',
    delay: 0.35,
    color: '#38bdf8',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 24 }} />,
    title: 'Statistiken',
    description: 'Detaillierte Einblicke in deine Seh- und Lesegewohnheiten.',
    delay: 0.4,
    color: '#fb923c',
  },
] as const;

export const FeaturesGrid = () => (
  <div className="start-features-section">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <h2 className="start-features-heading" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        Alles was du brauchst
      </h2>
      <p className="start-features-subheading" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
        Features für das beste Tracking-Erlebnis
      </p>
    </motion.div>

    <div className="start-features-grid">
      {FEATURES.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  </div>
);
