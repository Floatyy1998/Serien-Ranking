import React from 'react';
import { Pet, PET_TYPES, PET_COLORS } from '../types/pet.types';
import { motion } from 'framer-motion';

interface SimplePetProps {
  pet: Pet;
  size?: number;
  animated?: boolean;
}

export const SimplePet: React.FC<SimplePetProps> = ({ pet, size = 64, animated = true }) => {
  const emoji = PET_TYPES[pet.type];
  const color = PET_COLORS[pet.color as keyof typeof PET_COLORS] || PET_COLORS.blau;

  // Pet wird größer mit höherem Level
  const levelScale = 1 + (pet.level - 1) * 0.1; // +10% pro Level
  const actualSize = size * levelScale;

  // Animation basierend auf Stimmung
  const getAnimation = () => {
    if (!animated) return {};

    if (pet.happiness > 80) {
      // Glücklich - hüpft
      return {
        y: [0, -10, 0],
        rotate: [0, -5, 5, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse' as const
        }
      };
    } else if (pet.happiness < 30) {
      // Traurig - langsames schwanken
      return {
        rotate: [-2, 2, -2],
        transition: {
          duration: 3,
          repeat: Infinity,
          repeatType: 'reverse' as const
        }
      };
    } else {
      // Normal - leichtes atmen
      return {
        scale: [1, 1.05, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse' as const
        }
      };
    }
  };

  // Spezielle Effekte basierend auf Level
  const getLevelEffects = () => {
    if (pet.level >= 10) {
      // Level 10+ - Goldener Schimmer
      return {
        filter: `drop-shadow(0 0 8px gold) drop-shadow(0 2px 4px ${color}44)`,
      };
    } else if (pet.level >= 5) {
      // Level 5+ - Farbiger Glow
      return {
        filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 2px 4px ${color}44)`,
      };
    } else {
      // Normal
      return {
        filter: `drop-shadow(0 2px 4px ${color}44)`,
      };
    }
  };

  return (
    <div style={{ position: 'relative', width: actualSize, height: actualSize }}>
      <motion.div
        animate={getAnimation()}
        style={{
          fontSize: actualSize * 0.8,
          textAlign: 'center',
          lineHeight: `${actualSize}px`,
          position: 'relative',
          ...getLevelEffects()
        }}
      >
        {emoji}
      </motion.div>

      {/* Krone für Level 10+ */}
      {pet.level >= 10 && (
        <div style={{
          position: 'absolute',
          top: -actualSize * 0.15,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: actualSize * 0.25
        }}>
          👑
        </div>
      )}

      {/* Sterne für Level 5+ */}
      {pet.level >= 5 && pet.level < 10 && (
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{
            position: 'absolute',
            top: -actualSize * 0.1,
            right: actualSize * 0.1,
            fontSize: actualSize * 0.2
          }}
        >
          ⭐
        </motion.div>
      )}

      {/* Stimmungs-Indikator */}
      {pet.happiness < 30 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            fontSize: size * 0.3
          }}
        >
          😢
        </motion.div>
      )}

      {pet.happiness > 80 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            fontSize: size * 0.3
          }}
        >
          ✨
        </motion.div>
      )}

      {/* Hunger-Indikator */}
      {pet.hunger > 70 && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
          style={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            fontSize: size * 0.25
          }}
        >
          🍖
        </motion.div>
      )}

      {/* Level Badge */}
      {pet.level > 1 && (
        <div style={{
          position: 'absolute',
          bottom: -8,
          left: -8,
          background: pet.level >= 10
            ? 'linear-gradient(135deg, gold, #FFA500)'
            : pet.level >= 5
              ? `linear-gradient(135deg, ${color}, ${color}dd)`
              : `linear-gradient(135deg, ${color}88, ${color}cc)`,
          color: '#fff',
          borderRadius: '50%',
          width: actualSize * 0.3,
          height: actualSize * 0.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: actualSize * 0.15,
          fontWeight: 'bold',
          boxShadow: pet.level >= 10
            ? '0 2px 8px rgba(255,215,0,0.5)'
            : '0 2px 4px rgba(0,0,0,0.2)',
          border: pet.level >= 10 ? '2px solid gold' : 'none'
        }}>
          {pet.level}
        </div>
      )}
    </div>
  );
};