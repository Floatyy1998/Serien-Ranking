/**
 * PetCard - Displays a single pet with its visual, mood badge, stats bars, and XP bonus status
 */

import { motion } from 'framer-motion';
import { memo } from 'react';
import { EvolvingPixelPet } from '../../components/pet';
import { GradientText } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PET_TYPE_NAMES } from '../../types/pet.types';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  excited: '🤩',
  playful: '🎮',
  sleepy: '😴',
  hungry: '🍖',
  sad: '😢',
  festive: '🎄',
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
}: PetCardProps) {
  const { currentTheme } = useTheme();

  const stats = [
    {
      label: 'Hunger',
      value: hungerPercentage,
      color: currentTheme.status?.error || '#ff6b6b',
      icon: '🍖',
      text: `${Math.round(hungerPercentage)}%`,
    },
    {
      label: 'Glück',
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
            {PET_TYPE_NAMES[pet.type]}
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
              {pet.favoriteGenre}
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
        <div
          className="pet-card-display"
          style={{
            background: `${currentTheme.background.surface}ee`,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          {/* Glow */}
          <div className="pet-card-glow" />

          <EvolvingPixelPet pet={pet} size={160} animated={pet.isAlive} />

          {/* Mood Badge */}
          <div className="pet-card-mood-badges">
            {!pet.isAlive && (
              <div
                className="pet-card-dead-badge"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.status.error}, ${currentTheme.status?.error || '#ef4444'})`,
                }}
              >
                Tot
              </div>
            )}
            <div
              className="pet-card-mood-emoji"
              style={{
                background: currentTheme.background.default,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              {(currentMood && MOOD_EMOJIS[currentMood]) || '😊'}
            </div>
          </div>
        </div>
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
                  XP-Bonus aktiv: +50%
                </div>
                <div
                  className="pet-card-xp-bonus-subtitle"
                  style={{ color: currentTheme.text.muted }}
                >
                  Dein gesundes Pet gibt dir mehr XP pro Episode!
                </div>
              </div>
            </div>
          ) : (
            <div className="pet-card-xp-bonus pet-card-xp-bonus--inactive">
              <span className="pet-card-xp-bonus-sleep-icon">💤</span>
              <div>
                <div className="pet-card-xp-bonus-title pet-card-xp-bonus-title--inactive">
                  XP-Bonus inaktiv
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
