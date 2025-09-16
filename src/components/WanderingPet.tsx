import { motion, useAnimationControls } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Pet } from '../types/pet.types';
import { AnimatedPet } from './AnimatedPet';

interface WanderingPetProps {
  pet: Pet;
  enabled?: boolean;
  onPetClick?: () => void;
}

type Position = { x: number; y: number };
type WalkPath = 'top' | 'right' | 'bottom' | 'left';

export const WanderingPet: React.FC<WanderingPetProps> = ({
  pet,
  enabled = true,
  onPetClick
}) => {
  const controls = useAnimationControls();
  const [currentPath, setCurrentPath] = useState<WalkPath>('bottom');
  const [isWalking, setIsWalking] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 100, y: window.innerHeight - 150 });

  // Berechne Pfad-Positionen basierend auf Bildschirmgröße
  const calculatePath = (path: WalkPath, progress: number): Position => {
    const margin = 80;
    const width = window.innerWidth;
    const height = window.innerHeight;

    switch (path) {
      case 'top':
        return { x: width * progress, y: margin };
      case 'right':
        return { x: width - margin, y: height * progress };
      case 'bottom':
        return { x: width * (1 - progress), y: height - margin - 100 };
      case 'left':
        return { x: margin, y: height * (1 - progress) };
      default:
        return { x: margin, y: height - margin - 100 };
    }
  };

  // Starte Random Walk
  const startRandomWalk = async () => {
    if (!enabled || !pet.isAlive || isWalking) return;

    setIsWalking(true);

    // Wähle zufällige Richtung
    const paths: WalkPath[] = ['top', 'right', 'bottom', 'left'];
    const nextPath = paths[Math.floor(Math.random() * paths.length)];

    // Animiere zum Start des neuen Pfads
    const startPos = calculatePath(nextPath, 0);
    await controls.start({
      x: startPos.x,
      y: startPos.y,
      transition: { duration: 2, ease: 'easeInOut' }
    });

    // Laufe entlang des Pfads
    const endPos = calculatePath(nextPath, 1);
    await controls.start({
      x: endPos.x,
      y: endPos.y,
      transition: { duration: 5, ease: 'linear' }
    });

    setCurrentPath(nextPath);
    setPosition(endPos);
    setIsWalking(false);
  };

  // Idle Animation wenn nicht läuft
  const idleAnimation = async () => {
    if (!enabled || !pet.isAlive || isWalking) return;

    // Kleine zufällige Bewegungen
    const randomX = position.x + (Math.random() - 0.5) * 50;
    const randomY = position.y + (Math.random() - 0.5) * 20;

    await controls.start({
      x: randomX,
      y: randomY,
      transition: { duration: 2, ease: 'easeInOut' }
    });

    setPosition({ x: randomX, y: randomY });
  };

  // Spezielle Animationen basierend auf Tageszeit
  const timeBasedBehavior = () => {
    const hour = new Date().getHours();

    if (hour >= 22 || hour < 6) {
      // Nachts - Pet schläft öfter
      return 'sleeping';
    } else if (hour >= 6 && hour < 10) {
      // Morgens - Pet ist träge
      return 'slow';
    } else if (hour >= 10 && hour < 18) {
      // Tagsüber - Pet ist aktiv
      return 'active';
    } else {
      // Abends - Pet ist aufgeregt
      return 'excited';
    }
  };

  // Haupt-Animation Loop
  useEffect(() => {
    if (!enabled || !pet.isAlive) return;

    const behavior = timeBasedBehavior();
    let interval: NodeJS.Timeout;

    switch (behavior) {
      case 'sleeping':
        // Selten bewegen
        interval = setInterval(() => {
          if (Math.random() > 0.8) idleAnimation();
        }, 10000);
        break;
      case 'slow':
        // Gelegentlich bewegen
        interval = setInterval(() => {
          if (Math.random() > 0.6) {
            Math.random() > 0.5 ? startRandomWalk() : idleAnimation();
          }
        }, 8000);
        break;
      case 'active':
        // Oft bewegen
        interval = setInterval(() => {
          if (Math.random() > 0.3) {
            Math.random() > 0.4 ? startRandomWalk() : idleAnimation();
          }
        }, 5000);
        break;
      case 'excited':
        // Sehr oft bewegen
        interval = setInterval(() => {
          if (Math.random() > 0.2) {
            startRandomWalk();
          }
        }, 3000);
        break;
    }

    return () => clearInterval(interval);
  }, [enabled, pet.isAlive, isWalking, position]);

  if (!enabled || !pet.isAlive) return null;

  return (
    <motion.div
      animate={controls}
      initial={position}
      style={{
        position: 'fixed',
        zIndex: 999,
        pointerEvents: onPetClick ? 'auto' : 'none',
      }}
    >
      {/* Wanderndes Pet */}
      <div style={{ position: 'relative' }}>
        <AnimatedPet
          pet={pet}
          size={60}
          showAccessories={true}
          borderWalk={false}
          onClick={onPetClick}
        />

        {/* Walk Indicator */}
        {isWalking && (
          <motion.div
            animate={{
              opacity: [0, 1, 0],
              scale: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
            style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '8px',
            }}
          >
            {currentPath === 'top' && '⬆️'}
            {currentPath === 'right' && '➡️'}
            {currentPath === 'bottom' && '⬇️'}
            {currentPath === 'left' && '⬅️'}
          </motion.div>
        )}

        {/* Schlaf-ZZZ wenn Nacht */}
        {timeBasedBehavior() === 'sleeping' && !isWalking && (
          <motion.div
            animate={{
              y: [-5, -10, -5],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
            style={{
              position: 'absolute',
              top: -15,
              right: -10,
              fontSize: '12px',
            }}
          >
            💤
          </motion.div>
        )}

        {/* Sprint-Effekt wenn aufgeregt */}
        {timeBasedBehavior() === 'excited' && isWalking && (
          <motion.div
            animate={{
              x: [-5, 5, -5],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity
            }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: -10,
              fontSize: '10px',
            }}
          >
            💨
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};