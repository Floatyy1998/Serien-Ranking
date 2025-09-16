import React, { useEffect, useRef, useState } from 'react';
import { Pet, PET_COLORS } from '../types/pet.types';
import { petMoodService } from '../services/petMoodService';

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
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, color + '22');
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
        drawDog(ctx, pet, pet.level, pixelSize, color, darkColor, lightColor, moodBounce, animated);
      } else if (pet.type === 'dragon') {
        drawDragon(ctx, pet.level, pixelSize, color, darkColor, lightColor, moodBounce);
      } else if (pet.type === 'bird') {
        drawBird(ctx, pet.level, pixelSize, color, darkColor, lightColor, moodBounce, animated);
      } else if (pet.type === 'fox') {
        drawFox(ctx, pet.level, pixelSize, color, darkColor, lightColor, moodBounce);
      }

      // Dann zeichne ALLE Accessoires OBEN DRAUF
      if (pet.accessories && pet.accessories.length > 0) {
        pet.accessories.forEach(accessory => {
          if (!accessory.equipped) return;
          drawAccessory(ctx, accessory, pixelSize, moodBounce);
        });
      }

      // Mood-Indikator entfernt - wird schon im PetWidget angezeigt

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
        ctx.fillText('💭🍖', size - 40, 20);
      }

      // Level-Anzeige
      if (pet.level > 1) {
        ctx.fillStyle = pet.level >= 10 ? 'gold' : pet.level >= 5 ? color : darkColor;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Lv.${pet.level}`, 4, size - 4);
      }
    };

    const drawAccessory = (ctx: any, accessory: any, ps: number, offset: number) => {
      const centerX = 16;
      const centerY = 16;

      // Zeichne Accessoire basierend auf Typ - ALLE Accessoires deutlich sichtbar
      switch (accessory.type) {
          case 'hat':
            if (accessory.id === 'santaHat') {
              // Weihnachtsmütze - größer und deutlicher
              ctx.fillStyle = '#DC143C';
              ctx.fillRect((centerX - 4) * ps, (centerY - 12) * ps + offset, ps * 8, ps * 4);
              ctx.fillRect((centerX - 3) * ps, (centerY - 13) * ps + offset, ps * 6, ps);
              ctx.fillRect((centerX - 2) * ps, (centerY - 14) * ps + offset, ps * 4, ps);
              ctx.fillStyle = '#FFF';
              ctx.fillRect((centerX - 4) * ps, (centerY - 9) * ps + offset, ps * 8, ps);
              ctx.fillRect((centerX + 2) * ps, (centerY - 15) * ps + offset, ps * 2, ps * 2);
            } else if (accessory.id === 'partyHat') {
              // Partyhut - bunter und auffälliger
              ctx.fillStyle = '#FFD700';
              ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps * 6, ps * 2);
              ctx.fillRect((centerX - 2) * ps, (centerY - 13) * ps + offset, ps * 4, ps * 2);
              ctx.fillRect((centerX - 1) * ps, (centerY - 15) * ps + offset, ps * 2, ps * 2);
              ctx.fillStyle = '#FF69B4';
              ctx.fillRect(centerX * ps, (centerY - 16) * ps + offset, ps * 2, ps * 2);
            }
            break;
          case 'glasses':
            if (accessory.id === 'sunglasses') {
              // Sonnenbrille - größer und dunkler
              ctx.fillStyle = '#000';
              ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 3, ps * 2);
              ctx.fillRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 3, ps * 2);
              ctx.fillRect((centerX - 2) * ps, (centerY - 2.5) * ps + offset, ps * 4, ps);
              // Rahmen
              ctx.strokeStyle = '#333';
              ctx.lineWidth = ps * 0.3;
              ctx.strokeRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 3, ps * 2);
              ctx.strokeRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 3, ps * 2);
            }
            break;
          case 'crown':
            // Krone - viel größer und königlicher
            ctx.fillStyle = '#FFD700';
            ctx.fillRect((centerX - 4) * ps, (centerY - 9) * ps + offset, ps * 8, ps * 2);
            // Zacken
            ctx.fillRect((centerX - 3) * ps, (centerY - 12) * ps + offset, ps, ps * 3);
            ctx.fillRect((centerX - 1) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
            ctx.fillRect((centerX + 1) * ps, (centerY - 12) * ps + offset, ps, ps * 3);
            ctx.fillRect((centerX + 3) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
            // Juwelen - größer und bunter
            ctx.fillStyle = '#FF0000';
            ctx.fillRect((centerX - 2.5) * ps, (centerY - 8.5) * ps + offset, ps * 0.8, ps * 0.8);
            ctx.fillStyle = '#0000FF';
            ctx.fillRect(centerX * ps, (centerY - 8.5) * ps + offset, ps * 0.8, ps * 0.8);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect((centerX + 2.5) * ps, (centerY - 8.5) * ps + offset, ps * 0.8, ps * 0.8);
            break;
          case 'collar':
            // Halsband - dicker und auffälliger
            ctx.fillStyle = accessory.color || '#8B4513';
            ctx.fillRect((centerX - 5) * ps, (centerY + 3) * ps + offset, ps * 10, ps * 1.5);
            // Nieten
            ctx.fillStyle = '#C0C0C0';
            for (let i = -4; i <= 4; i += 2) {
              ctx.fillRect((centerX + i) * ps, (centerY + 3.2) * ps + offset, ps * 0.6, ps * 0.6);
            }
            // Anhänger - größer
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(centerX * ps, (centerY + 5.5) * ps + offset, ps * 1, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'bow':
            // Schleife - größer und auffälliger
            ctx.fillStyle = accessory.color || '#FF69B4';
            ctx.fillRect((centerX - 3) * ps, (centerY + 2) * ps + offset, ps * 6, ps);
            ctx.fillRect((centerX - 4) * ps, (centerY + 1.5) * ps + offset, ps * 3, ps * 2);
            ctx.fillRect((centerX + 1) * ps, (centerY + 1.5) * ps + offset, ps * 3, ps * 2);
            // Mittelknoten
            ctx.fillStyle = '#CC1493';
            ctx.fillRect((centerX - 1) * ps, (centerY + 1.5) * ps + offset, ps * 2, ps * 2);
            break;
          case 'scarf':
            // Schal - viel deutlicher
            ctx.fillStyle = '#B22222';
            ctx.fillRect((centerX - 5) * ps, (centerY + 2) * ps + offset, ps * 10, ps * 2);
            // Fransen links
            ctx.fillRect((centerX - 7) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 3);
            ctx.fillRect((centerX - 8) * ps, (centerY + 6) * ps + offset, ps, ps * 2);
            // Fransen rechts
            ctx.fillRect((centerX + 5) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 3);
            ctx.fillRect((centerX + 7) * ps, (centerY + 6) * ps + offset, ps, ps * 2);
            // Muster
            ctx.fillStyle = '#FFF';
            for (let i = -4; i <= 4; i += 2) {
              ctx.fillRect((centerX + i) * ps, (centerY + 2.5) * ps + offset, ps * 0.5, ps * 0.5);
            }
            break;
          case 'bandana':
            // Bandana - sehr auffällig
            ctx.fillStyle = accessory.color || '#FF0000';
            ctx.fillRect((centerX - 6) * ps, (centerY - 5) * ps + offset, ps * 12, ps * 3);
            ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 8, ps);
            // Knoten hinten
            ctx.fillRect((centerX + 5) * ps, (centerY - 4) * ps + offset, ps * 3, ps * 2);
            ctx.fillRect((centerX + 6) * ps, (centerY - 3) * ps + offset, ps, ps);
            // Muster
            ctx.fillStyle = '#FFF';
            for (let i = -3; i <= 3; i += 2) {
              ctx.fillRect((centerX + i) * ps, (centerY - 4.5) * ps + offset, ps * 0.8, ps * 0.8);
            }
            break;
          default:
            // Fallback für unbekannte Accessoire-Typen
            break;
        }
    };

    // drawMoodIndicator entfernt - nicht mehr benötigt

    const drawCat = (ctx: any, _pet: Pet, level: number, ps: number, color: string, dark: string, light: string, offset: number) => {
      const centerX = 16;
      const centerY = 16;

      // Evolution: Körpergröße wächst mit Level
      const headSize = level >= 10 ? 1.25 : level >= 7 ? 1.15 : level >= 3 ? 1.08 : 1;

      // Kopf (wird größer und ändert Form mit Level)
      ctx.fillStyle = color;
      // Hauptkopf
      ctx.fillRect((centerX - 4 * headSize) * ps, (centerY - 4) * ps + offset, ps * 8 * headSize, ps * 6);

      // Rundungen oben und unten ZUERST
      ctx.fillRect((centerX - 3 * headSize) * ps, (centerY - 5) * ps + offset, ps * 6 * headSize, ps);
      ctx.fillRect((centerX - 3 * headSize) * ps, (centerY + 2) * ps + offset, ps * 6 * headSize, ps);

      // Ohren Evolution (werden etwas spitzer)
      const earHeight = level >= 10 ? 3 : level >= 5 ? 2.5 : 2;
      ctx.fillStyle = dark;
      // Linkes Ohr
      ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 2, ps);
      ctx.fillRect((centerX - 3) * ps, (centerY - 7) * ps + offset, ps * 2, ps);
      ctx.fillRect((centerX - 3) * ps, (centerY - 8) * ps + offset, ps, ps * earHeight);
      // Rechtes Ohr
      ctx.fillRect((centerX + 2) * ps, (centerY - 6) * ps + offset, ps * 2, ps);
      ctx.fillRect((centerX + 2) * ps, (centerY - 7) * ps + offset, ps * 2, ps);
      ctx.fillRect((centerX + 2) * ps, (centerY - 8) * ps + offset, ps, ps * earHeight);

      // Level 10+ kleine Ohrenbüschel
      if (level >= 10) {
        ctx.fillStyle = light;
        ctx.fillRect((centerX - 3) * ps, (centerY - 9) * ps + offset, ps * 0.3, ps * 0.5);
        ctx.fillRect((centerX + 2.7) * ps, (centerY - 9) * ps + offset, ps * 0.3, ps * 0.5);
      }

      // Ohren-Inneres (rosa)
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect((centerX - 2) * ps, (centerY - 6) * ps + offset, ps, ps);
      ctx.fillRect((centerX + 1) * ps, (centerY - 6) * ps + offset, ps, ps);

      // KEINE MUSTER MEHR - sauberes Design

      // Körper Evolution (wird größer)
      const bodyWidth = level >= 10 ? 8 : level >= 7 ? 7.5 : level >= 3 ? 6.5 : 6;
      const bodyHeight = level >= 10 ? 8 : level >= 7 ? 7.5 : level >= 3 ? 6.5 : 6;
      ctx.fillStyle = color;
      ctx.fillRect((centerX - bodyWidth/2) * ps, (centerY + 3) * ps + offset, ps * bodyWidth, ps * bodyHeight);
      ctx.fillRect((centerX - 2) * ps, (centerY + 3 + bodyHeight) * ps + offset, ps * 4, ps * 2);

      // Level 7+ subtile Muskel-Definition
      if (level >= 7) {
        ctx.fillStyle = dark;
        ctx.fillRect((centerX - bodyWidth/2 + 1) * ps, (centerY + 4) * ps + offset, ps * 0.3, ps * 2);
        ctx.fillRect((centerX + bodyWidth/2 - 1.3) * ps, (centerY + 4) * ps + offset, ps * 0.3, ps * 2);
      }

      // Bauch (heller)
      ctx.fillStyle = light;
      ctx.fillRect((centerX - 2) * ps, (centerY + 4) * ps + offset, ps * 4, ps * 4);

      // Pfoten
      ctx.fillStyle = dark;
      // Vorderpfoten
      ctx.fillRect((centerX - 3) * ps, (centerY + 9) * ps + offset, ps * 2, ps * 3);
      ctx.fillRect((centerX + 1) * ps, (centerY + 9) * ps + offset, ps * 2, ps * 3);
      // Hinterpfoten
      ctx.fillRect((centerX - 3) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);

      // Schwanz Evolution (wird etwas flauschiger)
      const tailLength = level >= 10 ? 4 : level >= 5 ? 3.5 : 3;
      ctx.fillStyle = color;
      for (let i = 0; i < tailLength; i++) {
        const width = 2 + (level >= 7 ? 0.5 : 0);
        ctx.fillRect((centerX + 3 + i * 2) * ps, (centerY + 7 - i * 2) * ps + offset, ps * width, ps * 2);
      }

      // Level 5+ Gestreifter Schwanz
      if (level >= 5) {
        ctx.fillStyle = dark;
        for (let i = 0; i < tailLength; i += 2) {
          ctx.fillRect((centerX + 3 + i * 2) * ps, (centerY + 7 - i * 2) * ps + offset, ps * 2, ps * 0.3);
        }
      }

      // Schwanzspitze
      ctx.fillStyle = level >= 10 ? light : dark;
      ctx.fillRect((centerX + 3 + tailLength * 2) * ps, (centerY + 7 - tailLength * 2) * ps + offset, ps, ps * 2);

      // Gesicht Details
      // Augen Evolution (ändern Farbe deutlicher)
      const eyeColor = level >= 10 ? '#9400D3' : level >= 7 ? '#00CED1' : level >= 5 ? '#00FF7F' : '#00FF00'; // Violett > Türkis > Mint > Grün
      const eyeSize = level >= 7 ? 2.2 : 2;

      ctx.fillStyle = eyeColor;
      ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
      ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);

      // Pupillen (werden etwas schmaler)
      ctx.fillStyle = '#000';
      const pupilWidth = level >= 7 ? 0.4 : 0.5;
      ctx.fillRect((centerX - 2) * ps, (centerY - 2) * ps + offset, ps * pupilWidth, ps);
      ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * pupilWidth, ps);

      // Level 10+ subtiles Leuchten
      if (level >= 10) {
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = ps * 1.5;
        ctx.fillStyle = eyeColor;
        ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
        ctx.fillRect((centerX + 1) * ps, (centerY - 2) * ps + offset, ps * eyeSize, ps);
        ctx.shadowBlur = 0;
      }

      // Nase (klein, rosa)
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect((centerX - 0.5) * ps, (centerY) * ps + offset, ps, ps * 0.5);

      // Mund (Y-förmig)
      ctx.fillStyle = dark;
      ctx.fillRect((centerX - 1) * ps, (centerY + 0.5) * ps + offset, ps * 2, ps * 0.3);

      // SCHNURRHAARE (immer sichtbar!)
      ctx.strokeStyle = dark;
      ctx.lineWidth = ps * 0.3;
      // Links
      ctx.beginPath();
      ctx.moveTo((centerX - 4) * ps, (centerY - 1) * ps + offset);
      ctx.lineTo((centerX - 7) * ps, (centerY - 1.5) * ps + offset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((centerX - 4) * ps, (centerY) * ps + offset);
      ctx.lineTo((centerX - 7) * ps, (centerY) * ps + offset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((centerX - 4) * ps, (centerY + 1) * ps + offset);
      ctx.lineTo((centerX - 7) * ps, (centerY + 0.5) * ps + offset);
      ctx.stroke();
      // Rechts
      ctx.beginPath();
      ctx.moveTo((centerX + 4) * ps, (centerY - 1) * ps + offset);
      ctx.lineTo((centerX + 7) * ps, (centerY - 1.5) * ps + offset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((centerX + 4) * ps, (centerY) * ps + offset);
      ctx.lineTo((centerX + 7) * ps, (centerY) * ps + offset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((centerX + 4) * ps, (centerY + 1) * ps + offset);
      ctx.lineTo((centerX + 7) * ps, (centerY + 0.5) * ps + offset);
      ctx.stroke();

      // Level-basierte Features
      if (level >= 3) {
        // Tiger-Streifen (deutlicher)
        ctx.fillStyle = dark;
        for (let i = 0; i < 4; i++) {
          ctx.fillRect((centerX - 2.5) * ps, (centerY + 3 + i * 1.8) * ps + offset, ps * 5, ps * 0.4);
        }
      }

      if (level >= 5) {
        // Kleine Flügel-Ansätze
        ctx.fillStyle = light;
        ctx.fillRect((centerX - 5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 2);
        ctx.fillRect((centerX + 3.5) * ps, (centerY + 2) * ps + offset, ps * 1.5, ps * 2);
      }

      if (level >= 7) {
        // Größere Flügel
        ctx.fillStyle = color + '88';
        ctx.fillRect((centerX - 6) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
        ctx.fillRect((centerX + 4) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
        ctx.fillStyle = light;
        ctx.fillRect((centerX - 5.5) * ps, (centerY + 2) * ps + offset, ps, ps * 2);
        ctx.fillRect((centerX + 4.5) * ps, (centerY + 2) * ps + offset, ps, ps * 2);
      }

      if (level >= 10) {
        // Majestätische Krone + Mähne
        // Mähne
        ctx.fillStyle = dark;
        ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps, ps * 3);
        ctx.fillRect((centerX + 4) * ps, (centerY - 3) * ps + offset, ps, ps * 3);
        ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 8, ps * 0.5);

        // Goldene Krone
        ctx.fillStyle = 'gold';
        ctx.fillRect((centerX - 2) * ps, (centerY - 10) * ps + offset, ps * 4, ps);
        ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
        ctx.fillRect(centerX * ps, (centerY - 11) * ps + offset, ps, ps * 2);
        ctx.fillRect((centerX + 2) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
        // Drei Juwelen
        ctx.fillStyle = '#FF1493';
        ctx.fillRect((centerX - 2) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
        ctx.fillStyle = '#00CED1';
        ctx.fillRect((centerX - 0.3) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
        ctx.fillStyle = '#9400D3';
        ctx.fillRect((centerX + 1.4) * ps, (centerY - 10.5) * ps + offset, ps * 0.6, ps * 0.6);
      }
    };

    const drawDog = (ctx: any, pet: Pet, level: number, ps: number, color: string, dark: string, light: string, offset: number, animated: boolean) => {
      const centerX = 16;
      const centerY = 16;

      // Evolution: Vom Welpen zum Wolf-Hund
      const headSize = level >= 10 ? 1.3 : level >= 7 ? 1.2 : level >= 3 ? 1.1 : 1;

      // Kopf (wird wolfartiger mit Level)
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 4 * headSize) * ps, (centerY - 3) * ps + offset, ps * 8 * headSize, ps * 6);
      ctx.fillRect((centerX - 3 * headSize) * ps, (centerY - 4) * ps + offset, ps * 6 * headSize, ps);

      // Schnauze (hervorstehend)
      ctx.fillStyle = light;
      ctx.fillRect((centerX - 2) * ps, (centerY + 1) * ps + offset, ps * 4, ps * 3);
      ctx.fillRect((centerX - 3) * ps, (centerY + 2) * ps + offset, ps * 6, ps * 2);

      // Ohren Evolution (werden etwas aufrechter)
      ctx.fillStyle = dark;
      if (level < 7) {
        // Hängende Ohren (werden allmählich aufrechter)
        const hangAmount = level >= 5 ? 4 : 5;
        ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 2, ps * hangAmount);
        ctx.fillRect((centerX - 6) * ps, (centerY - 2) * ps + offset, ps * 2, ps * (hangAmount - 1));
        ctx.fillRect((centerX + 3) * ps, (centerY - 3) * ps + offset, ps * 2, ps * hangAmount);
        ctx.fillRect((centerX + 4) * ps, (centerY - 2) * ps + offset, ps * 2, ps * (hangAmount - 1));
      } else {
        // Halb-aufrechte Ohren
        ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 2, ps * 4);
        ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps, ps * 2);
        ctx.fillRect((centerX + 2) * ps, (centerY - 4) * ps + offset, ps * 2, ps * 4);
        ctx.fillRect((centerX + 4) * ps, (centerY - 3) * ps + offset, ps, ps * 2);
      }

      // Körper Evolution (wird deutlich kräftiger)
      const bodyWidth = level >= 10 ? 10 : level >= 7 ? 9 : level >= 3 ? 8.5 : 8;
      const bodyHeight = level >= 10 ? 9 : level >= 7 ? 8 : level >= 3 ? 7.5 : 7;
      ctx.fillStyle = color;
      ctx.fillRect((centerX - bodyWidth/2) * ps, (centerY + 4) * ps + offset, ps * bodyWidth, ps * bodyHeight);
      ctx.fillRect((centerX - 3) * ps, (centerY + 4 + bodyHeight) * ps + offset, ps * 6, ps);

      // Level 7+ dezente Muskeln
      if (level >= 7) {
        ctx.fillStyle = dark;
        ctx.fillRect((centerX - 1) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 0.2);
      }

      // Bauch
      ctx.fillStyle = light;
      ctx.fillRect((centerX - 3) * ps, (centerY + 6) * ps + offset, ps * 6, ps * 4);

      // Beine (stämmiger)
      ctx.fillStyle = color;
      // Vorderbeine
      ctx.fillRect((centerX - 4) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 4);
      ctx.fillRect((centerX + 2) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 4);
      // Hinterbeine
      ctx.fillRect((centerX - 4) * ps, (centerY + 12) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 2) * ps, (centerY + 12) * ps + offset, ps * 2, ps * 2);

      // Pfoten (dunkler)
      ctx.fillStyle = dark;
      ctx.fillRect((centerX - 4) * ps, (centerY + 13) * ps + offset, ps * 2, ps);
      ctx.fillRect((centerX + 2) * ps, (centerY + 13) * ps + offset, ps * 2, ps);

      // Schwanz (wedelt)
      const tailWag = animated ? Math.sin(frameRef.current * 0.15 * animationSpeed) * 2 : 0;
      ctx.fillStyle = color;
      ctx.fillRect((centerX + 4 + tailWag) * ps, (centerY + 6) * ps + offset, ps * 3, ps * 2);
      ctx.fillRect((centerX + 6 + tailWag) * ps, (centerY + 5) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 7 + tailWag) * ps, (centerY + 4) * ps + offset, ps, ps * 2);

      // Gesicht Details
      // Augen Evolution (werden etwas intensiver)
      const eyeColor = level >= 10 ? '#DAA520' : level >= 7 ? '#CD853F' : '#8B4513'; // Goldbraun > Hellbraun > Braun
      const eyeShape = 2;

      ctx.fillStyle = eyeColor;
      ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps * eyeShape);
      ctx.fillRect((centerX + 1) * ps, (centerY - 1) * ps + offset, ps * 2, ps * eyeShape);

      // Pupillen
      ctx.fillStyle = '#000';
      ctx.fillRect((centerX - 2) * ps, (centerY - 1) * ps + offset, ps, ps);
      ctx.fillRect((centerX + 1) * ps, (centerY - 1) * ps + offset, ps, ps);
      // Glanzpunkte
      ctx.fillStyle = '#FFF';
      ctx.fillRect((centerX - 2.5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);
      ctx.fillRect((centerX + 1.5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);

      // Nase (groß, schwarz)
      ctx.fillStyle = '#000';
      ctx.fillRect((centerX - 1) * ps, (centerY + 2.5) * ps + offset, ps * 2, ps * 1.5);
      // Nasenlöcher
      ctx.fillStyle = '#333';
      ctx.fillRect((centerX - 0.7) * ps, (centerY + 3) * ps + offset, ps * 0.5, ps * 0.5);
      ctx.fillRect((centerX + 0.2) * ps, (centerY + 3) * ps + offset, ps * 0.5, ps * 0.5);

      // Mund
      ctx.strokeStyle = dark;
      ctx.lineWidth = ps * 0.3;
      ctx.beginPath();
      ctx.moveTo(centerX * ps, (centerY + 4) * ps + offset);
      ctx.lineTo((centerX - 1) * ps, (centerY + 4.5) * ps + offset);
      ctx.moveTo(centerX * ps, (centerY + 4) * ps + offset);
      ctx.lineTo((centerX + 1) * ps, (centerY + 4.5) * ps + offset);
      ctx.stroke();

      // Zunge (wenn glücklich)
      if (pet.happiness > 60) {
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect((centerX - 0.5) * ps, (centerY + 4.5) * ps + offset, ps * 1.5, ps * 2);
        ctx.fillRect((centerX) * ps, (centerY + 6.5) * ps + offset, ps * 0.8, ps * 0.5);
      }

      // Level Features
      if (level >= 3) {
        // Fell-Flecken
        ctx.fillStyle = dark;
        ctx.fillRect((centerX - 2) * ps, (centerY + 6) * ps + offset, ps * 1.5, ps * 1.5);
        ctx.fillRect((centerX + 1) * ps, (centerY + 7) * ps + offset, ps * 2, ps);
        ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps, ps * 1.5);
      }

      if (level >= 5) {
        // Reißzähne
        ctx.fillStyle = '#FFF';
        ctx.fillRect((centerX - 2) * ps, (centerY + 3) * ps + offset, ps * 0.4, ps * 0.6);
        ctx.fillRect((centerX + 1.6) * ps, (centerY + 3) * ps + offset, ps * 0.4, ps * 0.6);
      }

      if (level >= 7) {
        // Wolf-Mähne um den Hals
        ctx.fillStyle = dark;
        for (let i = -2; i <= 2; i++) {
          const height = 2.5 - Math.abs(i) * 0.3;
          ctx.fillRect((centerX + i * 1.5) * ps, (centerY + 3) * ps + offset, ps, ps * height);
        }
      }

      if (level >= 10) {
        // Alpha-Status
        // Leichtes Glühen
        ctx.shadowColor = color;
        ctx.shadowBlur = ps * 2;
        ctx.fillStyle = color;
        ctx.fillRect((centerX - 4) * ps, (centerY - 1) * ps + offset, ps * 8, ps * 0.1);
        ctx.shadowBlur = 0;

        // Stachelhalsband
        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect((centerX - 4) * ps, (centerY + 4) * ps + offset, ps * 8, ps * 1.2);
        // Metallstacheln
        ctx.fillStyle = '#C0C0C0';
        for (let i = -3; i <= 3; i++) {
          ctx.fillRect((centerX + i * 1.3) * ps, (centerY + 3.8) * ps + offset, ps * 0.4, ps * 0.8);
        }
        // Goldmedaillon
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(centerX * ps, (centerY + 6) * ps + offset, ps * 1, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawDragon = (ctx: any, level: number, ps: number, color: string, dark: string, light: string, offset: number) => {
      const centerX = 16;
      const centerY = 16;

      // Kopf (länglich wie Echse)
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 4) * ps, (centerY - 5) * ps + offset, ps * 8, ps * 5);
      ctx.fillRect((centerX - 5) * ps, (centerY - 3) * ps + offset, ps * 10, ps * 3);

      // Schnauze (spitz zulaufend)
      ctx.fillStyle = dark;
      ctx.fillRect((centerX - 6) * ps, (centerY - 2) * ps + offset, ps * 3, ps * 2);
      ctx.fillRect((centerX - 7) * ps, (centerY - 1) * ps + offset, ps * 2, ps);

      // Hörner (gebogen)
      ctx.fillStyle = '#FFD700';
      // Linkes Horn
      ctx.fillRect((centerX - 3) * ps, (centerY - 6) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX - 4) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX - 5) * ps, (centerY - 8) * ps + offset, ps, ps);
      // Rechtes Horn
      ctx.fillRect((centerX + 2) * ps, (centerY - 6) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 3) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 4) * ps, (centerY - 8) * ps + offset, ps, ps);

      // Nackenstacheln
      ctx.fillStyle = light;
      ctx.fillRect((centerX - 1) * ps, (centerY - 5) * ps + offset, ps, ps);
      ctx.fillRect(centerX * ps, (centerY - 6) * ps + offset, ps, ps);
      ctx.fillRect((centerX + 1) * ps, (centerY - 5) * ps + offset, ps, ps);

      // Körper (muskulös und schuppig)
      for (let y = 0; y < 10; y++) {
        const width = 8 - Math.abs(y - 5) * 0.5;
        // Schuppenmuster
        ctx.fillStyle = (y % 2 === 0) ? color : dark;
        ctx.fillRect((centerX - width/2) * ps, (centerY + y) * ps + offset, ps * width, ps);
      }

      // Bauch (heller, mit Schuppen-Textur)
      ctx.fillStyle = light;
      ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 6);
      // Bauchschuppen-Linien
      ctx.strokeStyle = color;
      ctx.lineWidth = ps * 0.2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo((centerX - 2) * ps, (centerY + 3 + i * 1.5) * ps + offset);
        ctx.lineTo((centerX + 2) * ps, (centerY + 3 + i * 1.5) * ps + offset);
        ctx.stroke();
      }

      // Flügel (Fledermaus-artig)
      const wingFlap = animated ? Math.sin(frameRef.current * 0.1 * animationSpeed) * 2 : 0;
      // Linker Flügel
      ctx.fillStyle = dark;
      ctx.fillRect((centerX - 5 - wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
      ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY) * ps + offset, ps * 3, ps * 6);
      ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
      // Flügelmembran
      ctx.fillStyle = color + '88';
      ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 3);

      // Rechter Flügel
      ctx.fillStyle = dark;
      ctx.fillRect((centerX + 2 + wingFlap) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 8);
      ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY) * ps + offset, ps * 3, ps * 6);
      ctx.fillRect((centerX + 7 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 2, ps * 4);
      // Flügelmembran
      ctx.fillStyle = color + '88';
      ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 3);

      // Beine (kräftig mit Krallen)
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 4);
      ctx.fillRect((centerX + 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 4);
      // Krallen
      ctx.fillStyle = '#FFD700';
      ctx.fillRect((centerX - 3.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
      ctx.fillRect((centerX - 2.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
      ctx.fillRect((centerX - 1.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
      ctx.fillRect((centerX + 0.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
      ctx.fillRect((centerX + 1.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);
      ctx.fillRect((centerX + 2.5) * ps, (centerY + 11.5) * ps + offset, ps * 0.5, ps);

      // Schwanz (lang mit Stacheln)
      ctx.fillStyle = color;
      ctx.fillRect((centerX + 3) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 2);
      ctx.fillRect((centerX + 6) * ps, (centerY + 5) * ps + offset, ps * 3, ps * 2);
      ctx.fillRect((centerX + 8) * ps, (centerY + 4) * ps + offset, ps * 2, ps * 2);
      // Schwanzstacheln
      ctx.fillStyle = dark;
      ctx.fillRect((centerX + 4) * ps, (centerY + 5) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 6) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 8) * ps, (centerY + 3) * ps + offset, ps, ps * 2);
      // Schwanzspitze (Pfeil)
      ctx.fillStyle = dark;
      ctx.fillRect((centerX + 9) * ps, (centerY + 3) * ps + offset, ps * 2, ps);
      ctx.fillRect((centerX + 10) * ps, (centerY + 2) * ps + offset, ps, ps * 3);

      // Augen (reptilienartig)
      ctx.fillStyle = '#FFD700';
      ctx.fillRect((centerX - 3) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
      // Schlitzpupillen
      ctx.fillStyle = '#000';
      ctx.fillRect((centerX - 2) * ps, (centerY - 3) * ps + offset, ps * 0.3, ps * 2);
      ctx.fillRect((centerX + 1.7) * ps, (centerY - 3) * ps + offset, ps * 0.3, ps * 2);
      // Rotes Glühen bei höherem Level
      if (level >= 5) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect((centerX - 2.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.5, ps * 0.5);
        ctx.fillRect((centerX + 1.5) * ps, (centerY - 2.5) * ps + offset, ps * 0.5, ps * 0.5);
      }

      // Nasenlöcher (Rauch)
      ctx.fillStyle = '#333';
      ctx.fillRect((centerX - 5) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);
      ctx.fillRect((centerX - 4) * ps, (centerY - 1.5) * ps + offset, ps * 0.5, ps * 0.5);

      // Feueratem Evolution
      if (level >= 3 && animated && Math.random() > 0.3) {
        const fireSize = 1 + (level - 3) * 0.15;
        // Farbe ändert sich dramatisch
        const fireColor = level >= 10 ? '#00FFFF' : level >= 7 ? '#9400FF' : level >= 5 ? '#FF1493' : '#FF4500';
        const innerColor = level >= 10 ? '#FFFFFF' : level >= 7 ? '#FF00FF' : level >= 5 ? '#FFB6C1' : '#FFD700';

        // Hauptfeuer
        ctx.fillStyle = fireColor;
        ctx.fillRect((centerX - 6 * fireSize) * ps, (centerY) * ps + offset, ps * 2 * fireSize, ps * 1.5 * fireSize);
        ctx.fillRect((centerX - 8 * fireSize) * ps, (centerY + 0.5) * ps + offset, ps * 2 * fireSize, ps * fireSize);

        // Inneres Feuer
        ctx.fillStyle = innerColor;
        ctx.fillRect((centerX - 7 * fireSize) * ps, (centerY + 0.3) * ps + offset, ps * 1.5 * fireSize, ps * 0.8);

        // Level 5+ mehr Flammen
        if (level >= 5) {
          ctx.fillStyle = fireColor;
          ctx.fillRect((centerX - 9 * fireSize) * ps, (centerY - 0.5) * ps + offset, ps * fireSize, ps * 0.8);
          ctx.fillRect((centerX - 10 * fireSize) * ps, (centerY + 1) * ps + offset, ps * fireSize * 0.8, ps * 0.5);
        }

        // Level 10+ Explosion
        if (level >= 10) {
          ctx.fillStyle = fireColor + '44';
          ctx.fillRect((centerX - 11) * ps, (centerY - 1) * ps + offset, ps * 4, ps * 3);
        }
      }

      // Level Features
      if (level >= 5) {
        // Größere Flügel
        const wingFlap = animated ? Math.sin(frameRef.current * 0.1 * animationSpeed) * 1.5 : 0;
        ctx.fillStyle = dark + 'AA';
        ctx.fillRect((centerX - 6 - wingFlap) * ps, (centerY) * ps + offset, ps * 2, ps * 6);
        ctx.fillRect((centerX + 4 + wingFlap) * ps, (centerY) * ps + offset, ps * 2, ps * 6);
      }

      if (level >= 10) {
        // Drachenrüstung
        ctx.fillStyle = '#808080';
        ctx.fillRect((centerX - 3) * ps, (centerY + 2) * ps + offset, ps * 6, ps * 3);
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect((centerX - 2.5) * ps, (centerY + 2.5) * ps + offset, ps * 5, ps * 2);
        // Goldene Verzierung
        ctx.fillStyle = '#FFD700';
        ctx.fillRect((centerX - 0.5) * ps, (centerY + 3) * ps + offset, ps, ps * 0.5);
      }
    };

    const drawBird = (ctx: any, level: number, ps: number, color: string, dark: string, light: string, offset: number, animated: boolean) => {
      const centerX = 16;
      const centerY = 16;
      const wingFlap = animated ? Math.sin(frameRef.current * 0.2 * animationSpeed) * 3 : 0;

      // Kopf (rund mit Federkrone)
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 3) * ps, (centerY - 5) * ps + offset, ps * 6, ps * 5);
      ctx.fillRect((centerX - 2) * ps, (centerY - 6) * ps + offset, ps * 4, ps);

      // Federkamm oben (Papagei-Style)
      ctx.fillStyle = dark;
      ctx.fillRect((centerX - 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX - 2) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY - 7) * ps + offset, ps, ps * 2);

      // Bunter Kamm bei höherem Level
      if (level >= 5) {
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(centerX * ps, (centerY - 9) * ps + offset, ps, ps * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect((centerX - 1) * ps, (centerY - 9) * ps + offset, ps, ps);
      }

      // Körper (stromlinienförmig)
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 3) * ps, (centerY) * ps + offset, ps * 6, ps * 8);
      ctx.fillRect((centerX - 2) * ps, (centerY + 8) * ps + offset, ps * 4, ps * 2);

      // Bauchbereich (heller)
      ctx.fillStyle = light;
      ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 5);

      // Flügel (detailliert mit Federn)
      // Linker Flügel
      ctx.fillStyle = dark;
      ctx.fillRect((centerX - 6 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 6);
      ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);
      // Flügelfedern
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 3) * ps + offset, ps, ps * 3);
      ctx.fillRect((centerX - 9 - wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);

      // Rechter Flügel
      ctx.fillStyle = dark;
      ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 3, ps * 6);
      ctx.fillRect((centerX + 5 + wingFlap) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 4);
      // Flügelfedern
      ctx.fillStyle = color;
      ctx.fillRect((centerX + 7 + wingFlap) * ps, (centerY + 3) * ps + offset, ps, ps * 3);
      ctx.fillRect((centerX + 8 + wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);

      // Schnabel (gebogen wie Papagei) - Farbe hängt von Vogelfarbe ab
      const beakColor = color === '#FFA500' ? '#DC143C' : '#FFA500'; // Dunkelrot wenn Vogel orange ist
      const beakTipColor = color === '#FFA500' ? '#8B0000' : '#FF8C00';
      ctx.fillStyle = beakColor;
      ctx.fillRect((centerX - 2) * ps, (centerY - 2) * ps + offset, ps * 4, ps * 2);
      ctx.fillRect((centerX - 3) * ps, (centerY - 1) * ps + offset, ps * 2, ps);
      // Schnabelspitze
      ctx.fillStyle = beakTipColor;
      ctx.fillRect((centerX - 3) * ps, (centerY) * ps + offset, ps * 2, ps * 0.5);

      // Augen (groß und ausdrucksstark)
      ctx.fillStyle = '#FFF';
      ctx.fillRect((centerX - 4) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 2) * ps, (centerY - 3) * ps + offset, ps * 2, ps * 2);
      // Iris
      ctx.fillStyle = '#4169E1';
      ctx.fillRect((centerX - 3.5) * ps, (centerY - 2.5) * ps + offset, ps * 1.5, ps * 1.5);
      ctx.fillRect((centerX + 2) * ps, (centerY - 2.5) * ps + offset, ps * 1.5, ps * 1.5);
      // Pupille
      ctx.fillStyle = '#000';
      ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);
      ctx.fillRect((centerX + 2.2) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);

      // Level 3+ Kleiner bunter Kamm
      if (level >= 3) {
        // Einfacher roter Kamm
        ctx.fillStyle = '#FF6347';
        ctx.fillRect((centerX - 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
        ctx.fillRect((centerX - 0.5) * ps, (centerY - 9) * ps + offset, ps, ps);

        // Flügelspitzen bekommen Farbe
        ctx.fillStyle = '#00CED1';
        ctx.fillRect((centerX - 7 - wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
        ctx.fillRect((centerX + 6 + wingFlap) * ps, (centerY + 4) * ps + offset, ps, ps * 2);
      }

      // Level 5+ Bunter Kamm und Schwanz
      if (level >= 5) {
        // Dreifarbiger Kamm (Papagei-Style)
        ctx.fillStyle = '#FF1493';
        ctx.fillRect((centerX - 1.5) * ps, (centerY - 8) * ps + offset, ps, ps * 3);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect((centerX - 0.5) * ps, (centerY - 9) * ps + offset, ps, ps * 4);
        ctx.fillStyle = '#00CED1';
        ctx.fillRect((centerX + 0.5) * ps, (centerY - 8) * ps + offset, ps, ps * 3);

        // Bunte Schwanzfedern (3 Farben)
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect((centerX - 2) * ps, (centerY + 11) * ps + offset, ps, ps * 4);
        ctx.fillStyle = '#40E0D0';
        ctx.fillRect((centerX - 1) * ps, (centerY + 11) * ps + offset, ps, ps * 5);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(centerX * ps, (centerY + 11) * ps + offset, ps, ps * 4);
      }

      // Level 7+ Kakadu-Kamm
      if (level >= 7) {
        // Aufstellbarer Kamm (5 Federn)
        const crestColors = ['#FFD700', '#FF6347', '#FFD700', '#FF6347', '#FFD700'];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = crestColors[i];
          const height = 4 - Math.abs(i - 2) * 0.8;
          ctx.fillRect((centerX - 2 + i * 0.8) * ps, (centerY - 7 - height) * ps + offset, ps * 0.7, ps * height);
        }

        // Flügel mit Farbverläufen
        const gradient = ctx.createLinearGradient(
          (centerX - 8) * ps, centerY * ps,
          (centerX - 3) * ps, centerY * ps
        );
        gradient.addColorStop(0, dark);
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, '#00CED1');
        ctx.fillStyle = gradient;
        ctx.fillRect((centerX - 8 - wingFlap) * ps, (centerY + 1) * ps + offset, ps * 5, ps * 6);
        ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1) * ps + offset, ps * 5, ps * 6);

        // Längere bunte Schwanzfedern
        for (let i = 0; i < 3; i++) {
          const colors = ['#FF1493', '#00CED1', '#FFD700'];
          ctx.fillStyle = colors[i];
          ctx.fillRect((centerX - 1 + i - 1) * ps, (centerY + 11) * ps + offset, ps, ps * (5 + i));
          // Weiße Spitzen
          ctx.fillStyle = '#FFF';
          ctx.fillRect((centerX - 1 + i - 1) * ps, (centerY + 16 + i) * ps + offset, ps, ps * 0.5);
        }
      }

      // Level 10+ Paradiesvogel (aber dezenter)
      if (level >= 10) {
        // Goldene Federkrone (7 Federn)
        for (let i = 0; i < 7; i++) {
          const height = 5 - Math.abs(i - 3) * 0.7;
          // Abwechselnd Gold und Rot
          ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FF6347';
          ctx.fillRect((centerX - 3 + i * 0.9) * ps, (centerY - 8 - height) * ps + offset, ps * 0.8, ps * height);
          // Weiße Spitzen
          ctx.fillStyle = '#FFF';
          ctx.fillRect((centerX - 3 + i * 0.9) * ps, (centerY - 8 - height) * ps + offset, ps * 0.8, ps * 0.3);
        }

        // Flügel mit mehreren Farben
        const wingColors = [dark, color, '#00CED1', '#9400D3', '#FF1493'];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = wingColors[i];
          ctx.fillRect((centerX - 8 + i - wingFlap) * ps, (centerY + 1 + i) * ps + offset, ps * (6 - i), ps);
          ctx.fillRect((centerX + 3 + wingFlap) * ps, (centerY + 1 + i) * ps + offset, ps * (6 - i), ps);
        }

        // Prächtiger Schwanz (5 lange Federn)
        const tailColors = ['#FF1493', '#00CED1', '#FFD700', '#9400D3', '#FF6347'];
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = tailColors[i];
          const length = 7 - Math.abs(i - 2);
          ctx.fillRect((centerX - 2 + i) * ps, (centerY + 10) * ps + offset, ps, ps * length);

          // Pfauenauge am Ende (nur bei mittleren Federn)
          if (i >= 1 && i <= 3) {
            ctx.fillStyle = '#00CED1';
            ctx.beginPath();
            ctx.arc((centerX - 2 + i + 0.5) * ps, (centerY + 9 + length) * ps + offset, ps * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc((centerX - 2 + i + 0.5) * ps, (centerY + 9 + length) * ps + offset, ps * 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Füße (Krallen)
      ctx.fillStyle = '#FFD700';
      ctx.fillRect((centerX - 2) * ps, (centerY + 9) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY + 9) * ps + offset, ps, ps * 2);
      // Krallen
      ctx.fillStyle = '#FFA500';
      ctx.fillRect((centerX - 2.5) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
      ctx.fillRect((centerX - 1.5) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
      ctx.fillRect((centerX + 1) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);
      ctx.fillRect((centerX + 2) * ps, (centerY + 10.5) * ps + offset, ps * 0.5, ps);

      // Level 10+ Goldene Krone
      if (level >= 10) {
        ctx.fillStyle = 'gold';
        ctx.fillRect((centerX - 2) * ps, (centerY - 10) * ps + offset, ps * 4, ps);
        ctx.fillRect((centerX - 3) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
        ctx.fillRect(centerX * ps, (centerY - 11) * ps + offset, ps, ps * 2);
        ctx.fillRect((centerX + 2) * ps, (centerY - 11) * ps + offset, ps, ps * 2);
      }
    };

    const drawFox = (ctx: any, level: number, ps: number, color: string, _dark: string, light: string, offset: number) => {
      const centerX = 16;
      const centerY = 16;

      // Kopf (spitze Schnauze)
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 4) * ps, (centerY - 4) * ps + offset, ps * 8, ps * 5);
      ctx.fillRect((centerX - 3) * ps, (centerY - 5) * ps + offset, ps * 6, ps);

      // Spitze Schnauze
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 5) * ps, (centerY - 1) * ps + offset, ps * 3, ps * 2);
      ctx.fillRect((centerX - 6) * ps, (centerY) * ps + offset, ps * 2, ps);

      // Große spitze Ohren (charakteristisch für Füchse)
      ctx.fillStyle = color;
      // Linkes Ohr
      ctx.fillRect((centerX - 4) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 2);
      ctx.fillRect((centerX - 3) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX - 2) * ps, (centerY - 9) * ps + offset, ps, ps);
      // Rechtes Ohr
      ctx.fillRect((centerX + 1) * ps, (centerY - 6) * ps + offset, ps * 3, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY - 8) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY - 9) * ps + offset, ps, ps);

      // Ohren-Inneres (schwarz/dunkel)
      ctx.fillStyle = '#000';
      ctx.fillRect((centerX - 2) * ps, (centerY - 7) * ps + offset, ps, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY - 7) * ps + offset, ps, ps * 2);

      // Weiße Wangen (charakteristisch)
      ctx.fillStyle = '#FFF';
      ctx.fillRect((centerX - 4) * ps, (centerY - 2) * ps + offset, ps * 2, ps * 3);
      ctx.fillRect((centerX + 2) * ps, (centerY - 2) * ps + offset, ps * 2, ps * 3);

      // Körper (schlank und elegant)
      ctx.fillStyle = color;
      ctx.fillRect((centerX - 3) * ps, (centerY + 1) * ps + offset, ps * 6, ps * 8);
      ctx.fillRect((centerX - 2) * ps, (centerY + 9) * ps + offset, ps * 4, ps * 2);

      // Weißer Bauch/Brust
      ctx.fillStyle = '#FFF';
      ctx.fillRect((centerX - 2) * ps, (centerY + 2) * ps + offset, ps * 4, ps * 6);
      ctx.fillRect((centerX - 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 2);

      // Beine (schwarz am Ende)
      ctx.fillStyle = color;
      // Vorderbeine
      ctx.fillRect((centerX - 3) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 3);
      ctx.fillRect((centerX + 1) * ps, (centerY + 8) * ps + offset, ps * 2, ps * 3);
      // Hinterbeine
      ctx.fillRect((centerX - 3) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY + 10) * ps + offset, ps * 2, ps * 2);

      // Schwarze "Socken"
      ctx.fillStyle = '#000';
      ctx.fillRect((centerX - 3) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 1) * ps, (centerY + 11) * ps + offset, ps * 2, ps * 2);

      // Buschiger Schwanz (das Markenzeichen!)
      ctx.fillStyle = color;
      ctx.fillRect((centerX + 3) * ps, (centerY + 6) * ps + offset, ps * 4, ps * 3);
      ctx.fillRect((centerX + 6) * ps, (centerY + 4) * ps + offset, ps * 3, ps * 4);
      ctx.fillRect((centerX + 8) * ps, (centerY + 2) * ps + offset, ps * 2, ps * 5);
      ctx.fillRect((centerX + 9) * ps, (centerY) * ps + offset, ps * 2, ps * 4);

      // Weiße Schwanzspitze (typisch für Füchse)
      ctx.fillStyle = '#FFF';
      ctx.fillRect((centerX + 9) * ps, (centerY - 1) * ps + offset, ps * 2, ps * 2);
      ctx.fillRect((centerX + 10) * ps, (centerY - 2) * ps + offset, ps, ps * 2);

      // Augen (schmal und schlau)
      ctx.fillStyle = '#000';
      ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
      ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
      // Bernstein-farbene Iris
      ctx.fillStyle = '#FFA500';
      ctx.fillRect((centerX - 2.5) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);
      ctx.fillRect((centerX + 1.7) * ps, (centerY - 2) * ps + offset, ps * 0.8, ps * 0.8);

      // Kleine schwarze Nase
      ctx.fillStyle = '#000';
      ctx.fillRect((centerX - 0.5) * ps, (centerY + 0.5) * ps + offset, ps, ps * 0.5);

      // Mund (V-förmig)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = ps * 0.2;
      ctx.beginPath();
      ctx.moveTo(centerX * ps, (centerY + 1) * ps + offset);
      ctx.lineTo((centerX - 1) * ps, (centerY + 1.5) * ps + offset);
      ctx.moveTo(centerX * ps, (centerY + 1) * ps + offset);
      ctx.lineTo((centerX + 1) * ps, (centerY + 1.5) * ps + offset);
      ctx.stroke();

      // Japanische Mythologie Evolution

      // Level 3+ Erste spirituelle Zeichen
      if (level >= 3) {
        // Zweiter Schwanz beginnt zu wachsen
        ctx.fillStyle = color;
        ctx.fillRect((centerX + 4) * ps, (centerY + 7) * ps + offset, ps * 3, ps * 1.5);
        ctx.fillRect((centerX + 6) * ps, (centerY + 6) * ps + offset, ps * 2, ps * 1.5);
        ctx.fillStyle = '#FFF';
        ctx.fillRect((centerX + 7) * ps, (centerY + 6) * ps + offset, ps, ps);

        // Rote Markierungen auf Wangen (japanisch)
        ctx.fillStyle = '#DC143C';
        ctx.fillRect((centerX - 4.5) * ps, (centerY - 1) * ps + offset, ps * 0.8, ps * 0.8);
        ctx.fillRect((centerX + 3.7) * ps, (centerY - 1) * ps + offset, ps * 0.8, ps * 0.8);
      }

      // Level 5+ Torii-Tor Symbole und 3 Schwänze
      if (level >= 5) {
        // Dritter Schwanz
        ctx.fillStyle = light;
        ctx.fillRect((centerX + 3) * ps, (centerY + 4) * ps + offset, ps * 4, ps * 2);
        ctx.fillRect((centerX + 6) * ps, (centerY + 3) * ps + offset, ps * 2, ps * 2);
        ctx.fillStyle = '#FFF';
        ctx.fillRect((centerX + 7) * ps, (centerY + 3) * ps + offset, ps, ps * 1.5);

        // Torii-Tor Symbol auf Stirn (vereinfacht)
        ctx.fillStyle = '#DC143C';
        ctx.fillRect((centerX - 1) * ps, (centerY - 5) * ps + offset, ps * 2, ps * 0.3);
        ctx.fillRect((centerX - 0.5) * ps, (centerY - 4.5) * ps + offset, ps * 0.3, ps);
        ctx.fillRect((centerX + 0.2) * ps, (centerY - 4.5) * ps + offset, ps * 0.3, ps);

        // Spirituelle blaue Flammen an Pfoten
        ctx.fillStyle = '#4169E1';
        ctx.fillRect((centerX - 3.5) * ps, (centerY + 12) * ps + offset, ps * 0.5, ps * 0.5);
        ctx.fillRect((centerX - 2.5) * ps, (centerY + 12.5) * ps + offset, ps * 0.5, ps * 0.5);
        ctx.fillRect((centerX + 1.5) * ps, (centerY + 12) * ps + offset, ps * 0.5, ps * 0.5);
        ctx.fillRect((centerX + 2.5) * ps, (centerY + 12.5) * ps + offset, ps * 0.5, ps * 0.5);
      }

      // Level 7+ Inari-Fuchs mit 5 Schwänzen
      if (level >= 7) {
        // Fünf Schwänze
        for (let i = 0; i < 5; i++) {
          const angle = (i - 2) * 0.4;
          const xOffset = Math.sin(angle) * 3;
          const yOffset = i * 1.5;

          ctx.fillStyle = i % 2 === 0 ? color : light;
          ctx.fillRect((centerX + 3 + xOffset) * ps, (centerY + 2 + yOffset) * ps + offset, ps * 4, ps * 1.5);
          ctx.fillRect((centerX + 6 + xOffset) * ps, (centerY + 1 + yOffset) * ps + offset, ps * 2, ps * 1.5);

          // Spirituelle Flammen (blau/weiß)
          ctx.fillStyle = i % 2 === 0 ? '#87CEEB' : '#E0FFFF';
          ctx.fillRect((centerX + 7 + xOffset) * ps, (centerY + 1 + yOffset) * ps + offset, ps, ps);
        }

        // Magatama-Halskette (japanisches Symbol)
        ctx.fillStyle = '#2E8B57';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.arc((centerX + i * 1.5) * ps, (centerY + 3.5) * ps + offset, ps * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Rote Augen mit spirituellem Glanz
        ctx.fillStyle = '#DC143C';
        ctx.fillRect((centerX - 3) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
        ctx.fillRect((centerX + 1.5) * ps, (centerY - 2) * ps + offset, ps * 1.5, ps);
        ctx.fillStyle = '#FFF';
        ctx.fillRect((centerX - 2.8) * ps, (centerY - 2.3) * ps + offset, ps * 0.3, ps * 0.3);
        ctx.fillRect((centerX + 2.5) * ps, (centerY - 2.3) * ps + offset, ps * 0.3, ps * 0.3);
      }

      // Level 10+ Kitsune mit 9 Schwänzen (klarer erkennbar)
      if (level >= 10) {
        // Neun Schwänze in Fächer-Formation
        for (let i = 0; i < 9; i++) {
          const angle = (i - 4) * 0.25;
          const xOffset = Math.sin(angle) * 3;
          const yOffset = Math.abs(i - 4) * 0.8;

          // Abwechselnde Farben für bessere Sichtbarkeit
          ctx.fillStyle = i % 2 === 0 ? color : light;
          ctx.fillRect((centerX + 3 + xOffset) * ps, (centerY + 3 + yOffset) * ps + offset, ps * 5, ps * 2);
          ctx.fillRect((centerX + 7 + xOffset) * ps, (centerY + 2 + yOffset) * ps + offset, ps * 3, ps * 2);

          // Weiße Schwanzspitzen (typisch für Kitsune)
          ctx.fillStyle = '#FFF';
          ctx.fillRect((centerX + 9 + xOffset) * ps, (centerY + 2 + yOffset) * ps + offset, ps * 1.5, ps * 2);

          // Blaue spirituelle Flamme nur an jedem 3. Schwanz
          if (i % 3 === 0) {
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect((centerX + 10 + xOffset) * ps, (centerY + 2.5 + yOffset) * ps + offset, ps * 0.8, ps);
          }
        }

        // Rotes Torii-Symbol auf Stirn (einfacher)
        ctx.fillStyle = '#DC143C';
        // Horizontaler Balken
        ctx.fillRect((centerX - 1.5) * ps, (centerY - 5) * ps + offset, ps * 3, ps * 0.4);
        // Vertikale Pfosten
        ctx.fillRect((centerX - 1) * ps, (centerY - 4.5) * ps + offset, ps * 0.4, ps * 1.5);
        ctx.fillRect((centerX + 0.6) * ps, (centerY - 4.5) * ps + offset, ps * 0.4, ps * 1.5);

        // Goldene Magatama-Kette (deutlicher)
        ctx.fillStyle = '#FFD700';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.arc((centerX + i * 1.5) * ps, (centerY + 3) * ps + offset, ps * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Rote mystische Linien an den Wangen
        ctx.strokeStyle = '#DC143C';
        ctx.lineWidth = ps * 0.4;
        // Links
        ctx.beginPath();
        ctx.moveTo((centerX - 4) * ps, (centerY - 1) * ps + offset);
        ctx.lineTo((centerX - 5) * ps, (centerY - 0.5) * ps + offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((centerX - 4) * ps, (centerY) * ps + offset);
        ctx.lineTo((centerX - 5) * ps, (centerY + 0.5) * ps + offset);
        ctx.stroke();
        // Rechts
        ctx.beginPath();
        ctx.moveTo((centerX + 4) * ps, (centerY - 1) * ps + offset);
        ctx.lineTo((centerX + 5) * ps, (centerY - 0.5) * ps + offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((centerX + 4) * ps, (centerY) * ps + offset);
        ctx.lineTo((centerX + 5) * ps, (centerY + 0.5) * ps + offset);
        ctx.stroke();
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

  // Farbe dunkler/heller machen
  const adjustColor = (color: string, amount: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount));
    const b = Math.min(255, Math.max(0, (num & 255) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

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