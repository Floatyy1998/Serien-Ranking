import { useCallback, useContext, useRef } from 'react';
import { ThemeContext, useTheme } from '../../../contexts/ThemeContext';
import { PetBrain, type BrainEnv } from '../../../lib/pet/petBrain';
import { GroupDirector } from '../../../lib/pet/petGroup';
import { t } from '../../../services/i18n';
import { activeSeason } from '../../../theme/seasonalThemes';
import type { Pet } from '../../../types/pet.types';
import { drawStageFrame } from './drawStage';
import { useCanvasLoop, type LoopFrame } from './useCanvasLoop';

const PS = 3.2;
const GROUND = 34;

interface Props {
  guest: Pet;
  host: Pet;
  height?: number;
}

interface Cast {
  guest: PetBrain;
  host: PetBrain;
  director: GroupDirector;
}

/** Spieltreff: dein Pet läuft beim Pet eines Freundes ein und die beiden spielen zusammen. */
export const PetVisitScene = ({ guest, host, height = 200 }: Props) => {
  const { currentTheme } = useTheme();
  const themeConfig = useContext(ThemeContext)?.userConfig;
  const season = themeConfig ? activeSeason(themeConfig) : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const castRef = useRef<Cast | null>(null);

  const getCast = useCallback((width: number): Cast => {
    if (castRef.current == null) {
      const g = new PetBrain(-30);
      const h = new PetBrain(width * 0.68);
      g.setScripted(true);
      g.walkTo(width * 0.3, 1.2);
      h.face(-1);
      const director = new GroupDirector([g, h], {
        gap: [4, 8],
        first: 2.6,
        spacing: 80,
      });
      castRef.current = { guest: g, host: h, director };
    }
    return castRef.current;
  }, []);

  const onFrame = useCallback(
    ({ ctx, dt, time, width, height: h }: LoopFrame) => {
      const cast = getCast(width);
      const groundY = h - GROUND;
      const bounds = { minX: width * 0.1, maxX: width * 0.9 };
      const env = (pet: Pet): BrainEnv => ({
        ...bounds,
        hour: 14,
        hungry: false,
        sad: false,
        sleepy: false,
        playful: true,
        tired: false,
        roam: true,
        alive: pet.isAlive,
        ps: PS,
        species: pet.type,
      });
      if (cast.guest.x >= bounds.minX) cast.director.update(dt, bounds);
      cast.guest.update(dt, env(guest));
      cast.host.update(dt, env(host));
      cast.guest.drainEvents();
      cast.host.drainEvents();

      for (const [brain, pet] of [
        [cast.host, host],
        [cast.guest, guest],
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
      }
    },
    [getCast, guest, host, season, currentTheme.primary]
  );

  useCanvasLoop(canvasRef, onFrame);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height }}
      role="img"
      aria-label={t('{guest} besucht {host}', { guest: guest.name, host: host.name })}
    />
  );
};
