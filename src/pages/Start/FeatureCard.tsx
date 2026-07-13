import { Paper } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * Default-Akzent der Feature-Karten (Pre-Auth Landing).
 * BEWUSSTE Marketing-Ausnahme vom Theme-System (fixe Violett-Marke statt
 * currentTheme/var(--theme-primary)); die Landing rendert ausgeloggt, wo nur das
 * Default-Theme Grün/Schwarz greifen würde. Einzelne Karten überschreiben `color`
 * mit der Marketing-Palette (siehe FeaturesGrid).
 */
const BRAND_PURPLE = '#a855f7';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  color?: string;
}

export const FeatureCard = ({
  icon,
  title,
  description,
  delay,
  color = BRAND_PURPLE,
}: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    className="start-feature-card"
  >
    <Paper
      elevation={0}
      className="start-feature-card-paper"
      sx={{
        /* Getöntes Glas in der Akzentfarbe statt grauem Einheitskasten */
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 10%, rgba(255, 255, 255, 0.03)) 0%, color-mix(in srgb, ${color} 4%, rgba(255, 255, 255, 0.02)) 100%)`,
        border: `1px solid ${color}30`,
        '&:hover': {
          background: `linear-gradient(135deg, color-mix(in srgb, ${color} 16%, rgba(255, 255, 255, 0.04)) 0%, color-mix(in srgb, ${color} 7%, rgba(255, 255, 255, 0.03)) 100%)`,
          border: `1px solid ${color}55`,
          transform: 'translateY(-3px)',
          boxShadow: `0 10px 32px ${color}25`,
        },
      }}
    >
      <div
        className="start-feature-icon-box"
        style={{
          background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 72%, #000))`,
          color: '#fff',
        }}
      >
        {icon}
      </div>
      <div className="start-feature-title" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        {title}
      </div>
      <div className="start-feature-description" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
        {description}
      </div>
    </Paper>
  </motion.div>
);
