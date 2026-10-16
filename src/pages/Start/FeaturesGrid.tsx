import {
  AutoStories,
  Chat,
  EmojiEvents,
  Insights,
  LocalLibrary,
  Movie,
  Tv,
  Whatshot,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { FeatureCard } from './FeatureCard';
import { t } from '../../services/i18n';

// Pro-Feature-Akzentfarben: bewusste Marketing-Palette der Pre-Auth-Landing,
// entkoppelt vom Theme-System (die Landing rendert ausgeloggt). Nicht auf
// currentTheme/Theme-Tokens umstellen – siehe FeatureCard.
const FEATURES = [
  {
    icon: <Tv sx={{ fontSize: 24 }} />,
    title: 'Serien',
    description: 'Jede Folge im Blick – neue Staffeln, Kalender und Countdowns.',
    delay: 0.1,
    color: '#ef6f8a',
  },
  {
    icon: <Movie sx={{ fontSize: 24 }} />,
    title: 'Filme',
    description: 'Watchlist, Bewertungen und wo der Film gerade läuft.',
    delay: 0.14,
    color: '#e07a3a',
  },
  {
    icon: <Whatshot sx={{ fontSize: 24 }} />,
    title: 'Anime',
    description: 'Die aktuelle Saison mit deutschen Anbietern, Filler und Recaps markiert.',
    delay: 0.18,
    color: '#f97316',
  },
  {
    icon: <AutoStories sx={{ fontSize: 24 }} />,
    title: 'Manga',
    description: 'Manga, Manhwa und Manhua – nach Kapiteln oder Bänden, mit neuen Releases.',
    delay: 0.22,
    color: '#d9903a',
  },
  {
    icon: <LocalLibrary sx={{ fontSize: 24 }} />,
    title: 'Bücher',
    description: 'Dein Regal mit Seiten, Lesejahr, Wunschliste und ISBN-Scanner.',
    delay: 0.26,
    color: '#f2a648',
  },
  {
    icon: <Chat sx={{ fontSize: 24 }} />,
    title: 'Freunde & Chat',
    description: 'Sieh, was Freunde schauen und lesen, empfiehl Titel und schreib im Chat.',
    delay: 0.3,
    color: '#e8905a',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: 24 }} />,
    title: 'Badges & Pets',
    description: 'Sammle Badges und zieh dein Pet groß – es levelt mit jeder Folge.',
    delay: 0.34,
    color: '#ecc06a',
  },
  {
    icon: <Insights sx={{ fontSize: 24 }} />,
    title: 'Wrapped & Statistiken',
    description: 'Dein Jahr in Zahlen – Folgen, Filme, Kapitel und Seiten.',
    delay: 0.38,
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
        {t('Alles was du brauchst')}
      </h2>
      <p className="start-features-subheading" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
        {t('Was TV-Rank alles kann')}
      </p>
    </motion.div>

    <div className="start-features-grid">
      {FEATURES.map((feature) => (
        <FeatureCard
          key={feature.title}
          {...feature}
          title={t(feature.title)}
          description={t(feature.description)}
        />
      ))}
    </div>
  </div>
);
