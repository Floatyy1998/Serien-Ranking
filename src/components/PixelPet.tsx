import React, { useEffect, useRef } from 'react';
import { Pet, PET_COLORS } from '../types/pet.types';

interface PixelPetProps {
  pet: Pet;
  size?: number;
  animated?: boolean;
}

export const PixelPet: React.FC<PixelPetProps> = ({ pet, size = 64, animated = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelSize = size / 16; // 16x16 pixel grid
    const color = PET_COLORS[pet.color as keyof typeof PET_COLORS] || PET_COLORS.blau;

    const drawPet = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;

      // Verbesserte Pixel-Pet Formen
      const patterns: Record<Pet['type'], number[][]> = {
        cat: [
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0],
          [0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0],
          [0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [0,1,1,0,0,1,1,1,1,1,0,0,1,1,0,0],
          [0,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
          [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
          [0,0,1,1,0,1,1,0,0,1,1,0,1,1,0,0],
          [0,0,1,1,0,1,1,0,0,1,1,0,1,1,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        dog: [
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
          [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
          [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
          [0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,0],
          [0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,0],
          [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
          [0,0,0,1,1,0,1,1,0,1,1,0,0,0,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,0],
          [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],
          [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        bird: [
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
          [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
          [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
          [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
          [0,0,1,1,0,1,1,1,1,1,0,1,1,0,0,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
          [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
          [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
          [0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
          [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        dragon: [
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
          [0,0,1,0,0,1,1,1,1,0,0,1,1,0,0,0],
          [0,0,1,0,0,1,1,1,1,0,0,1,1,0,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
          [0,0,1,1,1,0,1,1,0,1,1,1,1,0,0,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,0,0,0,1,1,1,1,0,0,0],
          [0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0],
          [0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        fox: [
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
          [0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
          [0,0,1,0,0,1,1,1,1,1,0,0,1,1,0,0],
          [0,0,1,0,0,1,1,1,1,1,0,0,1,1,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0],
          [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
          [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
          [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
          [0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0],
          [0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
      };

      const pattern = patterns[pet.type] || patterns.cat;
      const bounceOffset = animated ? Math.sin(frameRef.current * 0.1) * 2 : 0;

      // Zeichne das Pet
      pattern.forEach((row, y) => {
        row.forEach((pixel, x) => {
          if (pixel === 1) {
            ctx.fillRect(
              x * pixelSize,
              (y * pixelSize) + bounceOffset,
              pixelSize,
              pixelSize
            );
          }
        });
      });

      // Zeichne Augen
      ctx.fillStyle = '#000';
      const eyePositions = {
        cat: [[5, 5], [10, 5]],
        dog: [[5, 5], [9, 5]],
        bird: [[6, 4], [8, 4]],
        dragon: [[4, 4], [9, 4]],
        fox: [[4, 5], [10, 5]]
      };

      const eyes = eyePositions[pet.type] || eyePositions.cat;
      eyes.forEach(([x, y]) => {
        ctx.fillRect(
          x * pixelSize,
          (y * pixelSize) + bounceOffset,
          pixelSize,
          pixelSize
        );
      });

      // Mood-Indikator basierend auf Happiness
      if (pet.happiness < 30) {
        // Traurig - Träne
        ctx.fillStyle = '#4FC3F7';
        ctx.fillRect(11 * pixelSize, (6 * pixelSize) + bounceOffset, pixelSize, pixelSize * 2);
      } else if (pet.happiness > 80) {
        // Glücklich - Herz
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(13 * pixelSize, 2 * pixelSize, pixelSize, pixelSize);
        ctx.fillRect(14 * pixelSize, 2 * pixelSize, pixelSize, pixelSize);
        ctx.fillRect(13.5 * pixelSize, 3 * pixelSize, pixelSize, pixelSize);
      }

      // Hunger-Indikator
      if (pet.hunger > 70) {
        // Hungrig - Magen knurrt
        ctx.fillStyle = '#FFA500';
        ctx.font = `${pixelSize * 3}px Arial`;
        ctx.fillText('💭🍖', size - 30, 20);
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
  }, [pet, size, animated]);

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