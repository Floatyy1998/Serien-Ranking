import { useCallback, useContext, useRef } from 'react';
import { ThemeContext, useTheme } from '../../../contexts/ThemeContext';
import { PetBrain, type BrainEnv } from '../../../lib/pet/petBrain';
import { DuoDirector } from '../../../lib/pet/petDuo';
import { t } from '../../../services/i18n';
import { activeSeason } from '../../../theme/seasonalThemes';
import type { Pet } from '../../../types/pet.types';
import { drawStageFrame } from './drawStage';
import { useCanvasLoop, type LoopFrame } from './useCanvasLoop';

const PS = 2.6;
const GROUND = 22;

interface Props {
  guest: Pet;
  host: Pet;
  guestLabel: string;
  hostLabel: string;
  height?: number;
}

/** Zwei Pets auf einer Bühne: dein Pet besucht das Pet eines Freundes. */
export const PetDuoScene = ({ guest, host, guestLabel, hostLabel, height = 150 }: Props) => {
  const { currentTheme } = useTheme();
  const themeConfig = useContext(ThemeContext)?.userConfig;
  const season = themeConfig ? activeSeason(themeConfig) : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{ guest: PetBrain; host: PetBrain; director: DuoDirector } | null>(null);

  const getScene = useCallback((width: number) => {
    if (sceneRef.current == null) {
      const g = new PetBrain(width * 0.08);
      const h = new PetBrain(width * 0.8);
      sceneRef.current = { guest: g, host: h, director: new DuoDirector(g, h) };
    }
    return sceneRef.current;
  }, []);

  const onFrame = useCallback(
    ({ ctx, dt, time, width, height: h }: LoopFrame) => {
      const scene = getScene(width);
      const groundY = h - GROUND;
      const env = (pet: Pet): BrainEnv => ({
        minX: width * 0.08,
        maxX: width * 0.92,
        hour: 14,
        hungry: false,
        sad: false,
        sleepy: false,
        playful: true,
        tired: false,
        roam: true,
        alive: pet.isAlive,
        ps: PS,
      });
      scene.director.update(dt, width);
      scene.guest.update(dt, env(guest));
      scene.host.update(dt, env(host));
      scene.guest.drainEvents();
      scene.host.drainEvents();

      const floor = ctx.createLinearGradient(0, 0, width, 0);
      floor.addColorStop(0, 'rgba(255,255,255,0)');
      floor.addColorStop(0.5, 'rgba(255,255,255,0.14)');
      floor.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = floor;
      ctx.fillRect(0, groundY, width, 1);

      for (const [brain, pet, label] of [
        [scene.host, host, hostLabel],
        [scene.guest, guest, guestLabel],
      ] as const) {
        drawStageFrame(ctx, {
          pet,
          view: brain.view(),
          props: brain.props,
          particles: brain.particles,
          groundY,
          ps: PS,
          time,
          season,
          accent: currentTheme.primary,
        });
        ctx.save();
        ctx.font = '700 11px Satoshi, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        ctx.fillText(label, brain.x, groundY + 15);
        ctx.restore();
      }
    },
    [getScene, guest, host, guestLabel, hostLabel, season, currentTheme.primary]
  );

  useCanvasLoop(canvasRef, onFrame);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height }}
      role="img"
      aria-label={t('{guest} besucht {host}', { guest: guestLabel, host: hostLabel })}
    />
  );
};
