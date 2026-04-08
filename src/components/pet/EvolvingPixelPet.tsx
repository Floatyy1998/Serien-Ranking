import React, { useEffect, useRef, useState } from 'react';
import type { Pet, AccessorySlot } from '../../types/pet.types';
import { PET_COLORS, ACCESSORIES } from '../../types/pet.types';
import { petMoodService } from '../../services/pet/petMoodService';
import { adjustColor } from './colorUtils';
import { drawAccessory } from './drawAccessory';
import { drawCat } from './drawCat';
import { drawDog } from './drawDog';
import { drawDragon, drawDragonWingsOverlay } from './drawDragon';
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
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
  const animationSpeed = isMobile ? 1 : 0.4; // Mobile gets full speed, desktop gets 40% speed

  // Mood-basierte Animation Speed
  const moodSpeedMultiplier =
    currentMood === 'excited'
      ? 1.5
      : currentMood === 'playful'
        ? 1.3
        : currentMood === 'sleepy'
          ? 0.5
          : currentMood === 'sad'
            ? 0.7
            : 1;

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
        const glowIntensity =
          pet.level >= 100
            ? '55'
            : pet.level >= 75
              ? '44'
              : pet.level >= 50
                ? '3a'
                : pet.level >= 30
                  ? '33'
                  : pet.level >= 20
                    ? '2a'
                    : pet.level >= 15
                      ? '26'
                      : '22';
        const gradient = ctx.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          size / 2
        );
        gradient.addColorStop(0, color + glowIntensity);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }

      // Einfache Bounce-Animation
      const bounceOffset = animated
        ? Math.sin(frameRef.current * 0.05 * animationSpeed * moodSpeedMultiplier) * 2
        : 0;

      // Mood-basierte Bounce-Intensität
      const moodBounce =
        currentMood === 'excited'
          ? bounceOffset * 2
          : currentMood === 'playful'
            ? bounceOffset * 1.5
            : currentMood === 'sleepy'
              ? bounceOffset * 0.5
              : bounceOffset;

      // Bestimme welcher Slot durch ein equipped Accessory belegt ist
      const equippedAcc = pet.accessories?.find((a) => a.equipped);
      const equippedSlot: AccessorySlot | null = equippedAcc
        ? (ACCESSORIES[equippedAcc.id]?.slot ?? null)
        : null;

      // Zeichne zuerst das Pet
      if (pet.type === 'cat') {
        drawCat(
          ctx,
          pet,
          pet.level,
          pixelSize,
          color,
          darkColor,
          lightColor,
          moodBounce,
          equippedSlot
        );
      } else if (pet.type === 'dog') {
        drawDog(
          ctx,
          pet,
          pet.level,
          pixelSize,
          color,
          darkColor,
          lightColor,
          moodBounce,
          animated,
          frameRef.current,
          animationSpeed,
          equippedSlot
        );
      } else if (pet.type === 'dragon') {
        drawDragon(
          ctx,
          pet.level,
          pixelSize,
          color,
          darkColor,
          lightColor,
          moodBounce,
          animated,
          frameRef.current,
          animationSpeed,
          equippedSlot
        );
      } else if (pet.type === 'bird') {
        drawBird(
          ctx,
          pet.level,
          pixelSize,
          color,
          darkColor,
          lightColor,
          moodBounce,
          animated,
          frameRef.current,
          animationSpeed,
          equippedSlot
        );
      } else if (pet.type === 'fox') {
        drawFox(
          ctx,
          pet.level,
          pixelSize,
          color,
          darkColor,
          lightColor,
          moodBounce,
          animated,
          frameRef.current,
          animationSpeed,
          equippedSlot
        );
      }

      // Dann zeichne ALLE Accessoires OBEN DRAUF
      if (pet.accessories && pet.accessories.length > 0) {
        pet.accessories.forEach((accessory) => {
          if (!accessory.equipped) return;
          drawAccessory(ctx, accessory, pixelSize, moodBounce, pet.type, pet.level);
        });
      }

      // Drachen-Flügel ÜBER Accessories zeichnen (damit sie vor dem Schal erscheinen)
      if (pet.type === 'dragon') {
        drawDragonWingsOverlay(
          ctx,
          pet.level,
          pixelSize,
          color,
          darkColor,
          moodBounce,
          animated,
          frameRef.current,
          animationSpeed
        );
      }

      // Mood-Indikator entfernt - wird schon im PetWidget angezeigt

      // Sparkle-Partikel (Stufe 4+, Lv15+)
      if (pet.level >= 15 && animated) {
        const sparkleCount =
          pet.level >= 100
            ? 16
            : pet.level >= 75
              ? 14
              : pet.level >= 50
                ? 12
                : pet.level >= 30
                  ? 10
                  : pet.level >= 20
                    ? 8
                    : pet.level >= 15
                      ? 6
                      : 4;
        for (let i = 0; i < sparkleCount; i++) {
          const angle =
            frameRef.current * 0.02 * animationSpeed + i * ((Math.PI * 2) / sparkleCount);
          const radius = size * 0.35 + Math.sin(frameRef.current * 0.03 + i) * size * 0.05;
          const sx = size / 2 + Math.cos(angle) * radius;
          const sy = size / 2 + Math.sin(angle) * radius + moodBounce;
          const sparkleAlpha = 0.4 + Math.sin(frameRef.current * 0.08 + i * 1.5) * 0.3;
          const sparkleSize = pixelSize * (0.5 + Math.sin(frameRef.current * 0.06 + i) * 0.3);
          ctx.fillStyle =
            pet.level >= 100
              ? `rgba(255, 255, 255, ${sparkleAlpha})`
              : pet.level >= 75
                ? `rgba(255, 100, 100, ${sparkleAlpha})`
                : pet.level >= 50
                  ? `rgba(255, 140, 0, ${sparkleAlpha})`
                  : pet.level >= 30
                    ? `rgba(0, 206, 209, ${sparkleAlpha})`
                    : pet.level >= 20
                      ? `rgba(168, 85, 247, ${sparkleAlpha})`
                      : `rgba(255, 255, 255, ${sparkleAlpha})`;
          ctx.fillRect(sx - sparkleSize / 2, sy - sparkleSize / 2, sparkleSize, sparkleSize);
        }
      }

      // Pulsing Aura (Stufe 5+, Lv20+)
      if (pet.level >= 20 && animated) {
        const auraPhase = frameRef.current * 0.025 * animationSpeed;
        const auraAlpha =
          pet.level >= 100
            ? 0.12 + Math.sin(auraPhase) * 0.08
            : pet.level >= 50
              ? 0.08 + Math.sin(auraPhase) * 0.06
              : 0.06 + Math.sin(auraPhase) * 0.04;
        const auraRadius = size * 0.42 + Math.sin(auraPhase) * size * 0.03;
        const auraGradient = ctx.createRadialGradient(
          size / 2,
          size / 2 + moodBounce,
          0,
          size / 2,
          size / 2 + moodBounce,
          auraRadius
        );
        const auraColor =
          pet.level >= 100
            ? '255, 255, 255'
            : pet.level >= 75
              ? '255, 100, 100'
              : pet.level >= 50
                ? '255, 140, 0'
                : pet.level >= 30
                  ? '0, 206, 209'
                  : '168, 85, 247';
        auraGradient.addColorStop(0, `rgba(${auraColor}, 0)`);
        auraGradient.addColorStop(0.6, `rgba(${auraColor}, ${auraAlpha})`);
        auraGradient.addColorStop(1, `rgba(${auraColor}, 0)`);
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2 + moodBounce, auraRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Orbiting Energy Dots (Stufe 5+, Lv20+)
      if (pet.level >= 20 && animated) {
        const dotCount = pet.level >= 75 ? 6 : pet.level >= 50 ? 5 : pet.level >= 30 ? 4 : 3;
        for (let i = 0; i < dotCount; i++) {
          const orbitAngle =
            frameRef.current * 0.04 * animationSpeed + i * ((Math.PI * 2) / dotCount);
          const orbitRadius = size * 0.4;
          const dx = size / 2 + Math.cos(orbitAngle) * orbitRadius;
          const dy = size / 2 + Math.sin(orbitAngle) * orbitRadius * 0.4 + moodBounce;
          const dotAlpha = 0.7 + Math.sin(frameRef.current * 0.1 + i) * 0.3;
          ctx.fillStyle =
            pet.level >= 100
              ? `rgba(255, 255, 255, ${dotAlpha})`
              : pet.level >= 75
                ? `rgba(255, 100, 100, ${dotAlpha})`
                : pet.level >= 50
                  ? `rgba(255, 140, 0, ${dotAlpha})`
                  : `rgba(255, 215, 0, ${dotAlpha})`;
          ctx.beginPath();
          ctx.arc(dx, dy, pixelSize * 0.8, 0, Math.PI * 2);
          ctx.fill();
          // Trail
          ctx.fillStyle =
            pet.level >= 100
              ? `rgba(255, 255, 255, ${dotAlpha * 0.3})`
              : pet.level >= 50
                ? `rgba(255, 140, 0, ${dotAlpha * 0.3})`
                : `rgba(255, 215, 0, ${dotAlpha * 0.3})`;
          const trailAngle = orbitAngle - 0.3;
          ctx.beginPath();
          ctx.arc(
            size / 2 + Math.cos(trailAngle) * orbitRadius,
            size / 2 + Math.sin(trailAngle) * orbitRadius * 0.4 + moodBounce,
            pixelSize * 0.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // === STUFE 7 (Lv40+): Energie-Ring ===
      if (pet.level >= 40 && animated) {
        const ringPhase = frameRef.current * 0.03 * animationSpeed;
        const ringAlpha = 0.15 + Math.sin(ringPhase) * 0.1;
        const ringColor =
          pet.level >= 100
            ? `rgba(255, 255, 255, ${ringAlpha})`
            : pet.level >= 75
              ? `rgba(255, 100, 100, ${ringAlpha})`
              : pet.level >= 50
                ? `rgba(255, 140, 0, ${ringAlpha})`
                : `rgba(0, 206, 209, ${ringAlpha})`;
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = pixelSize * 0.4;
        ctx.beginPath();
        ctx.ellipse(
          size / 2,
          size / 2 + moodBounce,
          size * 0.38,
          size * 0.15,
          ringPhase * 0.5,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // === STUFE 8 (Lv50+): Elementar-Aura / Flammen-Partikel ===
      if (pet.level >= 50 && animated) {
        const particlePhase = frameRef.current * 0.04 * animationSpeed;
        for (let i = 0; i < 6; i++) {
          const px =
            size / 2 +
            (Math.random() - 0.5) * size * 0.6 +
            Math.sin(particlePhase + i * 1.5) * size * 0.1;
          const py =
            size * 0.7 +
            Math.sin(particlePhase + i) * size * 0.15 -
            ((frameRef.current * 0.3 + i * 5) % (size * 0.4));
          const pAlpha = 0.3 + Math.sin(particlePhase + i * 2) * 0.2;
          const pSize = pixelSize * (0.3 + Math.sin(particlePhase + i) * 0.2);

          ctx.fillStyle =
            pet.level >= 100
              ? `rgba(255, 255, 255, ${pAlpha})`
              : pet.level >= 75
                ? `rgba(255, 100, 100, ${pAlpha})`
                : `rgba(255, 140, 0, ${pAlpha})`;
          ctx.fillRect(px, py + moodBounce, pSize, pSize);
        }
      }

      // === STUFE 9 (Lv60+): Doppelte Orbits + Trail-Effekte ===
      if (pet.level >= 60 && animated) {
        // Zweiter Orbit-Ring (gegenläufig)
        const orbit2Phase = frameRef.current * -0.03 * animationSpeed;
        for (let i = 0; i < 3; i++) {
          const o2Angle = orbit2Phase + i * ((Math.PI * 2) / 3);
          const o2Radius = size * 0.45;
          const o2x = size / 2 + Math.cos(o2Angle) * o2Radius;
          const o2y = size / 2 + Math.sin(o2Angle) * o2Radius * 0.3 + moodBounce;
          const o2Alpha = 0.5 + Math.sin(frameRef.current * 0.08 + i) * 0.3;
          ctx.fillStyle =
            pet.level >= 100
              ? `rgba(200, 200, 255, ${o2Alpha})`
              : `rgba(100, 200, 255, ${o2Alpha})`;
          ctx.beginPath();
          ctx.arc(o2x, o2y, pixelSize * 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Längerer Trail
          for (let t = 1; t <= 3; t++) {
            const tAngle = o2Angle - t * 0.15;
            ctx.fillStyle =
              pet.level >= 100
                ? `rgba(200, 200, 255, ${o2Alpha * (0.3 / t)})`
                : `rgba(100, 200, 255, ${o2Alpha * (0.3 / t)})`;
            ctx.beginPath();
            ctx.arc(
              size / 2 + Math.cos(tAngle) * o2Radius,
              size / 2 + Math.sin(tAngle) * o2Radius * 0.3 + moodBounce,
              pixelSize * (0.4 / t),
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }

      // === STUFE 10 (Lv75+): Halo + Partikel-Explosion ===
      if (pet.level >= 75 && animated) {
        // Heiligenschein oben
        const haloPhase = frameRef.current * 0.02 * animationSpeed;
        const haloAlpha = 0.3 + Math.sin(haloPhase) * 0.15;
        ctx.strokeStyle =
          pet.level >= 100
            ? `rgba(255, 255, 255, ${haloAlpha})`
            : `rgba(255, 215, 0, ${haloAlpha})`;
        ctx.lineWidth = pixelSize * 0.5;
        ctx.beginPath();
        ctx.ellipse(
          size / 2,
          size * 0.15 + moodBounce,
          size * 0.18,
          size * 0.06,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();

        // Partikel-Explosion (radial nach außen)
        for (let i = 0; i < 8; i++) {
          const expAngle = (i / 8) * Math.PI * 2 + frameRef.current * 0.01 * animationSpeed;
          const expDist =
            (size * 0.25 + ((frameRef.current * 0.5 + i * 20) % (size * 0.3))) % (size * 0.3);
          const expX = size / 2 + Math.cos(expAngle) * expDist;
          const expY = size / 2 + Math.sin(expAngle) * expDist + moodBounce;
          const expAlpha = 0.4 * (1 - expDist / (size * 0.3));
          const expSize = pixelSize * (0.4 * (1 - expDist / (size * 0.3)));
          if (expAlpha > 0.05) {
            ctx.fillStyle = `rgba(255, 200, 100, ${expAlpha})`;
            ctx.fillRect(expX - expSize / 2, expY - expSize / 2, expSize, expSize);
          }
        }
      }

      // === STUFE 11 (Lv100): Regenbogen-Schimmer + Shockwave-Pulse ===
      if (pet.level >= 100 && animated) {
        // Regenbogen-Schimmer (rotierende Farben)
        const rainbowPhase = frameRef.current * 0.015 * animationSpeed;
        const rainbowColors = [
          [255, 0, 0],
          [255, 127, 0],
          [255, 255, 0],
          [0, 255, 0],
          [0, 0, 255],
          [75, 0, 130],
          [148, 0, 211],
        ];
        for (let i = 0; i < 12; i++) {
          const rAngle = rainbowPhase + i * ((Math.PI * 2) / 12);
          const rDist = size * 0.42 + Math.sin(frameRef.current * 0.04 + i) * size * 0.03;
          const rx = size / 2 + Math.cos(rAngle) * rDist;
          const ry = size / 2 + Math.sin(rAngle) * rDist + moodBounce;
          const ci = Math.floor((i + frameRef.current * 0.05) % rainbowColors.length);
          const rc = rainbowColors[ci];
          const rAlpha = 0.25 + Math.sin(frameRef.current * 0.06 + i * 1.2) * 0.15;
          ctx.fillStyle = `rgba(${rc[0]}, ${rc[1]}, ${rc[2]}, ${rAlpha})`;
          const rSize = pixelSize * 0.6;
          ctx.fillRect(rx - rSize / 2, ry - rSize / 2, rSize, rSize);
        }

        // Shockwave-Pulse (expandierender Ring alle ~120 frames)
        const shockwaveCycle = frameRef.current % 120;
        if (shockwaveCycle < 40) {
          const swProgress = shockwaveCycle / 40;
          const swRadius = size * 0.1 + swProgress * size * 0.4;
          const swAlpha = 0.3 * (1 - swProgress);
          ctx.strokeStyle = `rgba(255, 255, 255, ${swAlpha})`;
          ctx.lineWidth = pixelSize * (0.5 * (1 - swProgress));
          ctx.beginPath();
          ctx.arc(size / 2, size / 2 + moodBounce, swRadius, 0, Math.PI * 2);
          ctx.stroke();
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
        ctx.fillStyle =
          pet.level >= 100
            ? '#FFD700'
            : pet.level >= 75
              ? '#FF4500'
              : pet.level >= 50
                ? '#FF8C00'
                : pet.level >= 40
                  ? '#00CED1'
                  : pet.level >= 30
                    ? '#20B2AA'
                    : pet.level >= 20
                      ? '#9400D3'
                      : pet.level >= 15
                        ? '#00CED1'
                        : pet.level >= 10
                          ? 'gold'
                          : pet.level >= 5
                            ? color
                            : darkColor;
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
  }, [pet, size, animated, animationSpeed, currentMood, moodSpeedMultiplier]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        imageRendering: 'pixelated',
        width: size,
        height: size,
      }}
    />
  );
};
