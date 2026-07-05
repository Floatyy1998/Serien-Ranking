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
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${color}40`,
        },
      }}
    >
      <div className="start-feature-icon-box" style={{ background: `${color}12`, color }}>
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
