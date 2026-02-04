import React, { useEffect, useRef, useState } from 'react';
import { Pet, PET_COLORS } from '../../types/pet.types';
import { petMoodService } from '../../services/petMoodService';
import { adjustColor } from './colorUtils';
import { drawAccessory } from './drawAccessory';
import { drawCat } from './drawCat';
import { drawDog } from './drawDog';
import { drawDragon } from './drawDragon';
import { drawBird } from './drawBird';
import { drawFox } from './drawFox';

interface EvolvingPixelPetProps {
  pet: Pet;
  size?: number;
  animated?: boolean;
}

export const EvolvingPixelPet: React.FC<EvolvingPixelPetProps> = ({
  pet,
  size = 128,
  animated = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const [currentMood] = useState(() => petMoodService.calculateCurrentMood(pet));

  // Detect if mobile device - slower on desktop, normal on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  const animationSpeed = isMobile ? 1 : 0.4; // Mobile gets full speed, desktop gets 40% speed

  // Mood-basierte Animation Speed
  const moodSpeedMultiplier = currentMood === 'excited' ? 1.5 :
                              currentMood === 'playful' ? 1.3 :
                              currentMood === 'sleepy' ? 0.5 :
                              currentMood === 'sad' ? 0.7 : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Imagesmoothing aus für scharfe Pixel
    ctx.imageSmoothingEnabled = false;

    const gridSize = 32; // 32x32 Grid
    const pixelSize = Math.floor(size / gridSize); // Dynamische Pixelgröße basierend auf Canvas-Größe
    const color = PET_COLORS[pet.color as keyof typeof PET_COLORS] || PET_COLORS.blau;

    // Farben für verschiedene Teile
    const darkColor = adjustColor(color, -40);
    const lightColor = adjustColor(color, 40);

    const drawPet = () => {
      ctx.clearRect(0, 0, size, size);

      // Hintergrund-Glow basierend auf Level
      if (pet.level >= 5) {
        const glowIntensity = pet.level >= 25 ? '33' : pet.level >= 20 ? '2a' : pet.level >= 15 ? '26' : '22';
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, color + glowIntensity);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }

      // Einfache Bounce-Animation
      const bounceOffset = animated ? Math.sin(frameRef.current * 0.05 * animationSpeed * moodSpeedMultiplier) * 2 : 0;

      // Mood-basierte Bounce-Intensität
      const moodBounce = currentMood === 'excited' ? bounceOffset * 2 :
                        currentMood === 'playful' ? bounceOffset * 1.5 :
                        currentMood === 'sleepy' ? bounceOffset * 0.5 : bounceOffset;

      // Zeichne zuerst das Pet
      if (pet.type === 'cat') {
        drawCat(ctx, pet, pet.level, pixelSize, color, darkColor, lightColor, moodBounce);
      } else if (pet.type === 'dog') {
        drawDog(ctx, pet, pet.level, pixelSize, color, darkColor, lightColor, moodBounce, animated, frameRef.current, animationSpeed);
      } else if (pet.type === 'dragon') {
        drawDragon(ctx, pet.level, pixelSize, color, darkColor, lightColor, moodBounce, animated, frameRef.current, animationSpeed);
      } else if (pet.type === 'bird') {
        drawBird(ctx, pet.level, pixelSize, color, darkColor, lightColor, moodBounce, animated, frameRef.current, animationSpeed);
      } else if (pet.type === 'fox') {
        drawFox(ctx, pet.level, pixelSize, color, darkColor, lightColor, moodBounce, animated, frameRef.current, animationSpeed);
      }

      // Dann zeichne ALLE Accessoires OBEN DRAUF
      if (pet.accessories && pet.accessories.length > 0) {
        pet.accessories.forEach(accessory => {
          if (!accessory.equipped) return;
          drawAccessory(ctx, accessory, pixelSize, moodBounce);
        });
      }

      // Mood-Indikator entfernt - wird schon im PetWidget angezeigt

      // Level 15+ Sparkle-Partikel
      if (pet.level >= 15 && animated) {
        const sparkleCount = pet.level >= 25 ? 8 : pet.level >= 20 ? 6 : 4;
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (frameRef.current * 0.02 * animationSpeed + i * (Math.PI * 2 / sparkleCount));
          const radius = size * 0.35 + Math.sin(frameRef.current * 0.03 + i) * size * 0.05;
          const sx = size / 2 + Math.cos(angle) * radius;
          const sy = size / 2 + Math.sin(angle) * radius + moodBounce;
          const sparkleAlpha = 0.4 + Math.sin(frameRef.current * 0.08 + i * 1.5) * 0.3;
          const sparkleSize = pixelSize * (0.5 + Math.sin(frameRef.current * 0.06 + i) * 0.3);
          ctx.fillStyle = pet.level >= 25 ? `rgba(255, 215, 0, ${sparkleAlpha})` :
                          pet.level >= 20 ? `rgba(168, 85, 247, ${sparkleAlpha})` :
                          `rgba(255, 255, 255, ${sparkleAlpha})`;
          ctx.fillRect(sx - sparkleSize / 2, sy - sparkleSize / 2, sparkleSize, sparkleSize);
        }
      }

      // Level 20+ Pulsing Aura
      if (pet.level >= 20 && animated) {
        const auraPhase = frameRef.current * 0.025 * animationSpeed;
        const auraAlpha = 0.06 + Math.sin(auraPhase) * 0.04;
        const auraRadius = size * 0.42 + Math.sin(auraPhase) * size * 0.03;
        const auraGradient = ctx.createRadialGradient(size / 2, size / 2 + moodBounce, 0, size / 2, size / 2 + moodBounce, auraRadius);
        const auraColor = pet.level >= 25 ? '255, 215, 0' : '168, 85, 247';
        auraGradient.addColorStop(0, `rgba(${auraColor}, 0)`);
        auraGradient.addColorStop(0.6, `rgba(${auraColor}, ${auraAlpha})`);
        auraGradient.addColorStop(1, `rgba(${auraColor}, 0)`);
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2 + moodBounce, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Level 25+ Orbiting Energy Dots
      if (pet.level >= 25 && animated) {
        const dotCount = 3;
        for (let i = 0; i < dotCount; i++) {
          const orbitAngle = frameRef.current * 0.04 * animationSpeed + i * (Math.PI * 2 / dotCount);
          const orbitRadius = size * 0.4;
          const dx = size / 2 + Math.cos(orbitAngle) * orbitRadius;
          const dy = size / 2 + Math.sin(orbitAngle) * orbitRadius * 0.4 + moodBounce;
          const dotAlpha = 0.7 + Math.sin(frameRef.current * 0.1 + i) * 0.3;
          ctx.fillStyle = `rgba(255, 215, 0, ${dotAlpha})`;
          ctx.beginPath();
          ctx.arc(dx, dy, pixelSize * 0.8, 0, Math.PI * 2);
          ctx.fill();
          // Kleiner Trail
          ctx.fillStyle = `rgba(255, 215, 0, ${dotAlpha * 0.3})`;
          const trailAngle = orbitAngle - 0.3;
          ctx.beginPath();
          ctx.arc(size / 2 + Math.cos(trailAngle) * orbitRadius, size / 2 + Math.sin(trailAngle) * orbitRadius * 0.4 + moodBounce, pixelSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Status-Effekte
      if (pet.happiness < 30) {
        // Träne
        ctx.fillStyle = '#4FC3F7';
        ctx.fillRect(22 * pixelSize, 12 * pixelSize + bounceOffset, pixelSize * 2, pixelSize * 3);
      }

      if (pet.hunger > 70) {
        // Hungrig
        ctx.fillStyle = '#FFB300';
        ctx.font = '16px Arial';
        ctx.fillText('\uD83D\uDCAD\uD83C\uDF56', size - 40, 20);
      }

      // Level-Anzeige
      if (pet.level > 1) {
        ctx.fillStyle = pet.level >= 25 ? '#FF4500' : pet.level >= 20 ? '#9400D3' : pet.level >= 15 ? '#00CED1' : pet.level >= 10 ? 'gold' : pet.level >= 5 ? color : darkColor;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Lv.${pet.level}`, 4, size - 4);
      }
    };

    let animationId: number;
    const animate = () => {
      frameRef.current++;
      drawPet();
      if (animated) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [pet, size, animated, animationSpeed]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated',
        width: size,
        height: size
      }}
    />
  );
};
