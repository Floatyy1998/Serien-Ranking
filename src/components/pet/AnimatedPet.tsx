import { motion, useAnimationControls } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Pet, PetAccessory } from '../../types/pet.types';
import { petMoodService } from '../../services/petMoodService';
import { EvolvingPixelPet } from './EvolvingPixelPet';

interface AnimatedPetProps {
  pet: Pet;
  size?: number;
  showAccessories?: boolean;
  borderWalk?: boolean;
  onClick?: () => void;
}

export const AnimatedPet: React.FC<AnimatedPetProps> = ({
  pet,
  size = 70,
  showAccessories = true,
  borderWalk = false,
  onClick
}) => {
  const [currentMood, setCurrentMood] = useState<Pet['mood']>('happy');
  const controls = useAnimationControls();
  const [isWalking, setIsWalking] = useState(false);

  useEffect(() => {
    const mood = petMoodService.calculateCurrentMood(pet);
    setCurrentMood(mood);
  }, [pet.hunger, pet.happiness, pet.isAlive]);

  // Border Walk Animation
  useEffect(() => {
    if (!borderWalk || !pet.isAlive) return;

    const walkAroundBorder = async () => {
      setIsWalking(true);
      const steps = [
        { x: window.innerWidth - 100, y: 0 }, // Rechts oben
        { x: window.innerWidth - 100, y: window.innerHeight - 200 }, // Rechts unten
        { x: 0, y: window.innerHeight - 200 }, // Links unten
        { x: 0, y: 0 } // Links oben
      ];

      for (const step of steps) {
        await controls.start({
          x: step.x,
          y: step.y,
          transition: { duration: 5, ease: "linear" }
        });
      }
      setIsWalking(false);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% Chance zu laufen
        walkAroundBorder();
      }
    }, 30000); // Alle 30 Sekunden prüfen

    return () => clearInterval(interval);
  }, [borderWalk, pet.isAlive, controls]);

  const moodAnimation = petMoodService.getMoodAnimation(currentMood);
  const moodEmoji = petMoodService.getMoodEmoji(currentMood);

  // Spezielle Farben für Achievements
  const getSpecialColor = () => {
    if (pet.color === 'rainbow') {
      return {
        background: 'linear-gradient(45deg, #FF6B6B, #FFD93D, #95E77E, #4ECDC4, #B794F6)',
        animation: 'rainbow 3s ease-in-out infinite'
      };
    }
    if (pet.color === 'cosmic') {
      return {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)'
      };
    }
    return {};
  };

  return (
    <motion.div
      className="animated-pet"
      animate={controls}
      style={{
        position: borderWalk ? 'fixed' : 'relative',
        zIndex: 1000,
        cursor: onClick ? 'pointer' : 'default',
        ...getSpecialColor()
      }}
      onClick={onClick}
    >
      <motion.div
        animate={pet.isAlive ? moodAnimation : {}}
        transition={{
          duration: currentMood === 'playful' ? 1 : 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{ position: 'relative' }}
      >
        {/* Haupt-Pet */}
        <EvolvingPixelPet
          pet={pet}
          size={size}
          animated={pet.isAlive && !isWalking}
        />

        {/* Stimmungs-Indikator */}
        {pet.isAlive && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: -20,
              right: -10,
              fontSize: size * 0.3,
            }}
          >
            {moodEmoji}
          </motion.div>
        )}

        {/* Accessoires */}
        {showAccessories && pet.accessories?.map((accessory) => {
          if (!accessory.equipped) return null;

          const accessoryStyle = getAccessoryStyle(accessory, size);
          return (
            <div
              key={accessory.id}
              style={{
                position: 'absolute',
                ...accessoryStyle
              }}
            >
              {accessory.icon}
            </div>
          );
        })}

        {/* Walking Animation Indicator */}
        {isWalking && pet.isAlive && (
          <motion.div
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              bottom: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: size * 0.2
            }}
          >
            👟👟
          </motion.div>
        )}

        {/* Spezielle Effekte für Patterns */}
        {pet.pattern === 'galaxy' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, transparent, rgba(255,255,255,0.1))',
              pointerEvents: 'none',
              animation: 'pulse 3s ease-in-out infinite'
            }}
          />
        )}

        {/* Genre-Boost Indikator */}
        {pet.favoriteGenre && (
          <div
            style={{
              position: 'absolute',
              bottom: -15,
              right: -15,
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'white'
            }}
          >
            {pet.favoriteGenre.substring(0, 3)}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

function getAccessoryStyle(accessory: PetAccessory, size: number): React.CSSProperties {
  const scale = size / 70; // Basis-Größe ist 70px

  switch (accessory.type) {
    case 'hat':
    case 'crown':
      return {
        top: -15 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: size * 0.4
      };
    case 'glasses':
      return {
        top: 10 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: size * 0.3
      };
    case 'collar':
    case 'bow':
    case 'bandana':
      return {
        bottom: 5 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: size * 0.25
      };
    case 'scarf':
      return {
        bottom: 10 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: size * 0.3
      };
    default:
      return {};
  }
}
