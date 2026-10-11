import {
  Bedtime,
  Celebration,
  Favorite,
  Mood,
  MoodBad,
  Restaurant,
  SentimentVerySatisfied,
  SportsEsports,
  Warning,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, type ReactNode } from 'react';
import { PetPlayground } from '../../components/pet/play/PetPlayground';
import { GradientText } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { PET_TYPE_NAMES } from '../../types/pet.types';
import { PET_BACKGROUNDS } from '../../components/pet/data/petBackgrounds';
import { t } from '../../services/i18n';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';

const MOOD_ICONS: Record<string, ReactNode> = {
  happy: <Mood />,
  excited: <SentimentVerySatisfied />,
  playful: <SportsEsports />,
  sleepy: <Bedtime />,
  hungry: <Restaurant />,
  sad: <MoodBad />,
  festive: <Celebration />,
  scared: <Warning />,
  loved: <Favorite />,
};

interface PetCardProps {
  pet: Pet;
  currentMood: Pet['mood'];
  hungerPercentage: number;
  happinessPercentage: number;
  experiencePercentage: number;
  experienceNeeded: number;
  isHealthy: boolean;
  xpBonusHint: string;
  /** Erste Mini-Spiel-Runde des Tages macht das Pet glücklicher. */
  onPlayed?: () => void;
}

export const PetCard = memo(function PetCard({
  pet,
  currentMood,
  hungerPercentage,
  happinessPercentage,
  experiencePercentage,
  experienceNeeded,
  isHealthy,
  xpBonusHint,
  onPlayed,
}: PetCardProps) {
  const { currentTheme } = useTheme();

  // Ampel-Logik: Rot nur bei kritischem Stand, nicht dauerhaft
  const hungerColor =
    hungerPercentage <= 30
      ? currentTheme.status?.error || '#ef4444'
      : hungerPercentage <= 60
        ? currentTheme.status?.warning || '#eab308'
        : currentTheme.status?.success || '#22c55e';

  const stats = [
    {
      label: t('Sättigung'),
      value: hungerPercentage,
      color: hungerColor,
      icon: '🍖',
      text: `${Math.round(hungerPercentage)}%`,
    },
    {
      label: t('Glück'),
      value: happinessPercentage,
      color: currentTheme.primary,
      icon: '😊',
      text: `${Math.round(happinessPercentage)}%`,
    },
    {
      label: 'XP',
      value: experiencePercentage,
      color: currentTheme.accent,
      icon: '⭐',
      text: `${pet.experience}/${experienceNeeded}`,
    },
  ];

  return (
    <>
      {/* Pet Name & Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="pet-card-info"
      >
        <GradientText
          as="h2"
          from={currentTheme.text.primary}
          to={currentTheme.accent}
          style={{
            fontSize: '36px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            margin: '0 0 12px',
          }}
        >
          {pet.name}
        </GradientText>

        <div className="pet-card-badges">
          <div
            className="pet-card-badge"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.primary}10)`,
              border: `1px solid ${currentTheme.primary}40`,
              color: currentTheme.primary,
            }}
          >
            Level {pet.level}
          </div>
          <div
            className="pet-card-badge"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.accent}20, ${currentTheme.accent}10)`,
              border: `1px solid ${currentTheme.accent}40`,
              color: currentTheme.accent,
            }}
          >
            {t(PET_TYPE_NAMES[pet.type])}
          </div>
          {pet.favoriteGenre && (
            <div
              className="pet-card-badge"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.accent}20, ${currentTheme.accent}10)`,
                border: `1px solid ${currentTheme.accent}40`,
                color: currentTheme.accent,
              }}
            >
              {t(pet.favoriteGenre)}
            </div>
          )}
        </div>
      </motion.div>

      {/* Pet Display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="pet-card-display-wrapper"
      >
        <PetPlayground
          pet={pet}
          onPlayed={onPlayed}
          scene={(stage) => (
            <div
              className={`pet-card-display pet-card-display--room${
                pet.equippedBackground && PET_BACKGROUNDS[pet.equippedBackground]?.animationClass
                  ? ` ${PET_BACKGROUNDS[pet.equippedBackground].animationClass}`
                  : ''
              }`}
              style={{
                background:
                  pet.equippedBackground && PET_BACKGROUNDS[pet.equippedBackground]
                    ? PET_BACKGROUNDS[pet.equippedBackground].background
                    : `${currentTheme.background.surface}ee`,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              {/* Custom overlay layer (e.g. scanlines, stars) */}
              {pet.equippedBackground && PET_BACKGROUNDS[pet.equippedBackground]?.overlay && (
                <div
                  className="pet-card-display-overlay"
                  style={{ background: PET_BACKGROUNDS[pet.equippedBackground].overlay }}
                />
              )}
              {/* Glow */}
              <div
                className="pet-card-glow"
                style={
                  pet.equippedBackground && PET_BACKGROUNDS[pet.equippedBackground]?.glowColor
                    ? {
                        background: `radial-gradient(circle, ${PET_BACKGROUNDS[pet.equippedBackground].glowColor}, transparent 70%)`,
                      }
                    : undefined
                }
              />

              {stage}

              {/* Mood Badge */}
              <div className="pet-card-mood-badges">
                {!pet.isAlive && (
                  <div
                    className="pet-card-dead-badge"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.status.error}, ${currentTheme.status?.error || '#ef4444'})`,
                    }}
                  >
                    {t('Tot')}
                  </div>
                )}
                <div
                  className="pet-card-mood-emoji"
                  style={{
                    background: currentTheme.background.default,
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                >
                  {(currentMood && MOOD_ICONS[currentMood]) || <Mood />}
                </div>
              </div>
            </div>
          )}
        />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pet-card-stats-grid"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + index * 0.05 }}
            className="pet-card-stat"
            style={{
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <div className="pet-card-stat-icon">{stat.icon}</div>
            <div className="pet-card-stat-label" style={{ color: currentTheme.text.primary }}>
              {stat.label}
            </div>
            <div className="pet-card-stat-bar" style={{ background: `${stat.color}20` }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.value}%` }}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                className="pet-card-stat-bar-fill"
                style={{
                  background: `linear-gradient(90deg, ${stat.color}, ${stat.color}cc)`,
                }}
              />
            </div>
            <div className="pet-card-stat-text" style={{ color: stat.color }}>
              {stat.text}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* XP Bonus Status */}
      {pet.isAlive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="pet-card-xp-bonus-wrapper"
        >
          {isHealthy ? (
            <div className="pet-card-xp-bonus pet-card-xp-bonus--active">
              <span className="pet-card-xp-bonus-tag">+XP</span>
              <div>
                <div className="pet-card-xp-bonus-title pet-card-xp-bonus-title--active">
                  {t('XP-Bonus aktiv: +50%')}
                </div>
                <div
                  className="pet-card-xp-bonus-subtitle"
                  style={{ color: currentTheme.text.muted }}
                >
                  {t('Dein gesundes Pet gibt dir mehr XP pro Episode!')}
                </div>
              </div>
            </div>
          ) : (
            <div className="pet-card-xp-bonus pet-card-xp-bonus--inactive">
              <span className="pet-card-xp-bonus-sleep-icon">💤</span>
              <div>
                <div className="pet-card-xp-bonus-title pet-card-xp-bonus-title--inactive">
                  {t('XP-Bonus inaktiv')}
                </div>
                <div
                  className="pet-card-xp-bonus-subtitle"
                  style={{ color: currentTheme.text.muted }}
                >
                  {xpBonusHint}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
});
