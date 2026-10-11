import {
  ArrowUpward,
  AutoAwesome,
  Autorenew,
  DirectionsWalk,
  EventSeat,
  Lock,
  MusicNote,
  PlayArrowRounded,
  SportsEsports,
  SportsSoccer,
  ThreeSixty,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ThemeContext, useTheme } from '../../../contexts/ThemeContext';
import { PetBrain, type BrainEnv, type Trick } from '../../../lib/pet/petBrain';
import { GAME_SECONDS, SnackRain, type DropKind } from '../../../lib/pet/snackRain';
import { t } from '../../../services/i18n';
import { PET_CONFIG } from '../../../services/pet/petConstants';
import { petMoodService } from '../../../services/pet/petMoodService';
import { activeSeason } from '../../../theme/seasonalThemes';
import type { Pet } from '../../../types/pet.types';
import { drawStageFrame } from '../stage/drawStage';
import { useCanvasLoop, type LoopFrame } from '../stage/useCanvasLoop';
import { SIGNATURE_LABEL } from './signature';
import { drawDrop } from './drawDrops';
import './petPlayground.css';

const GROUND = 24;

function scaleFor(width: number): number {
  return width < 560 ? 4 : 5;
}

interface TrickDef {
  kind: Trick;
  label: string;
  level: number;
  icon: ReactNode;
}

const TRICKS: TrickDef[] = [
  { kind: 'sit', label: 'Sitz', level: 1, icon: <EventSeat /> },
  { kind: 'jump', label: 'Springen', level: 1, icon: <ArrowUpward /> },
  { kind: 'dance', label: 'Tanzen', level: 3, icon: <MusicNote /> },
  { kind: 'signature', label: '', level: 5, icon: <AutoAwesome /> },
  { kind: 'spin', label: 'Pirouette', level: 8, icon: <Autorenew /> },
  { kind: 'flip', label: 'Salto', level: 15, icon: <ThreeSixty /> },
  { kind: 'moonwalk', label: 'Moonwalk', level: 25, icon: <DirectionsWalk /> },
];

type Mode = 'free' | 'countdown' | 'game' | 'result';

interface FloatText {
  id: number;
  text: string;
  x: number;
  h: number;
  life: number;
  good: boolean;
}

function readBest(petId: string): number {
  try {
    return Number(localStorage.getItem(`petGameBest:${petId}`) || 0);
  } catch {
    return 0;
  }
}

function writeBest(petId: string, score: number): void {
  try {
    localStorage.setItem(`petGameBest:${petId}`, String(score));
  } catch {
    // Rekord bleibt dann nur für diese Sitzung
  }
}

function claimDailyReward(): boolean {
  const day = new Date().toDateString();
  try {
    if (localStorage.getItem('petGameReward') === day) return false;
    localStorage.setItem('petGameReward', day);
    return true;
  } catch {
    return false;
  }
}

interface Props {
  pet: Pet;
  onPlayed?: () => void;
  /** Umschließt die Bühne, z. B. mit dem ausgerüsteten Hintergrund. */
  scene?: (stage: ReactNode) => ReactNode;
}

/** Bühne auf der Pet-Seite: Tricks auf Kommando, Ball und das Mini-Spiel „Snack-Regen". */
export const PetPlayground = ({ pet, onPlayed, scene }: Props) => {
  const { currentTheme } = useTheme();
  const themeConfig = useContext(ThemeContext)?.userConfig;
  const season = themeConfig ? activeSeason(themeConfig) : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brainRef = useRef<PetBrain | null>(null);
  const gameRef = useRef<SnackRain | null>(null);
  const pointerXRef = useRef<number | null>(null);
  const floatsRef = useRef<FloatText[]>([]);
  const sizeRef = useRef({ width: 300, height: 250 });

  const [mode, setMode] = useState<Mode>('free');
  const [countdown, setCountdown] = useState(3);
  const [hud, setHud] = useState({ score: 0, time: GAME_SECONDS, combo: 0 });
  const [result, setResult] = useState<{
    score: number;
    best: number;
    record: boolean;
    reward: boolean;
  } | null>(null);
  const modeRef = useRef<Mode>('free');
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const getBrain = useCallback((): PetBrain => {
    if (brainRef.current == null) brainRef.current = new PetBrain(150);
    return brainRef.current;
  }, []);

  const mood = petMoodService.calculateCurrentMood(pet);

  const finishGame = useCallback(
    (score: number) => {
      if (modeRef.current !== 'game') return;
      modeRef.current = 'result';
      const brain = getBrain();
      brain.setScripted(false);
      const best = readBest(pet.id);
      const record = score > best;
      if (record) writeBest(pet.id, score);
      const reward = score > 0 && claimDailyReward();
      if (reward) onPlayed?.();
      brain.react(record ? 'party' : 'cheer');
      gameRef.current = null;
      setResult({ score, best: Math.max(best, score), record, reward });
      setMode('result');
    },
    [getBrain, pet.id, onPlayed]
  );

  const onFrame = useCallback(
    ({ ctx, dt, time, width, height }: LoopFrame) => {
      sizeRef.current = { width, height };
      const brain = getBrain();
      const groundY = height - GROUND;
      const ps = scaleFor(width);
      const env: BrainEnv = {
        minX: 30,
        maxX: width - 30,
        hour: new Date().getHours(),
        hungry: pet.isAlive && pet.hunger >= PET_CONFIG.STATUS_WARNING_HUNGER,
        sad: pet.happiness < 30,
        sleepy: mood === 'sleepy',
        playful: true,
        tired: false,
        roam: true,
        alive: pet.isAlive,
        ps,
        species: pet.type,
      };

      const game = gameRef.current;
      if (modeRef.current === 'game' && game) {
        const target = pointerXRef.current;
        if (target !== null && Math.abs(target - brain.x) > 4) brain.walkTo(target, 6);
        const hits = game.update(dt, brain.x, 13 * ps, 24 * ps);
        for (const hit of hits) {
          if (hit.points > 0) brain.sparkle(4);
          else brain.flinch();
          floatsRef.current.push({
            id: Math.random(),
            text: hit.points > 0 ? `+${hit.points}` : String(hit.points),
            x: hit.x,
            h: hit.h + 10,
            life: 0.9,
            good: hit.points > 0,
          });
        }
        if (Math.floor(time * 10) !== Math.floor((time - dt) * 10)) {
          setHud({ score: game.score, time: Math.ceil(game.timeLeft), combo: game.combo });
        }
        if (game.over) finishGame(game.score);
      }

      brain.update(dt, env);
      brain.drainEvents();

      drawStageFrame(ctx, {
        pet,
        view: brain.view(),
        props: brain.props,
        particles: brain.particles,
        groundY,
        ps,
        time,
        season,
        accent: currentTheme.primary,
      });

      if (game && modeRef.current === 'game') {
        for (const d of game.drops) drawDrop(ctx, d.kind as DropKind, d.x, groundY - d.h, d.spin);
      }

      floatsRef.current = floatsRef.current.filter((f) => (f.life -= dt) > 0);
      for (const f of floatsRef.current) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, f.life * 1.6);
        ctx.font = '800 15px Satoshi, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = f.good ? '#fff3b0' : '#ff8a8a';
        ctx.fillText(f.text, f.x, groundY - f.h - (0.9 - f.life) * 40);
        ctx.restore();
      }
    },
    [getBrain, pet, mood, season, currentTheme.primary, finishGame]
  );

  useCanvasLoop(canvasRef, onFrame);

  const startGame = () => {
    const brain = getBrain();
    brain.setScripted(true);
    brain.sitFor(3.2);
    setResult(null);
    setCountdown(3);
    setMode('countdown');
  };

  useEffect(() => {
    if (mode !== 'countdown') return;
    if (countdown === 0) {
      const { width, height } = sizeRef.current;
      gameRef.current = new SnackRain(width, height - GROUND + 20);
      pointerXRef.current = null;
      setHud({ score: 0, time: GAME_SECONDS, combo: 0 });
      setMode('game');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 750);
    return () => clearTimeout(timer);
  }, [mode, countdown]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (modeRef.current === 'game') {
      pointerXRef.current = x;
      return;
    }
    if (e.type !== 'pointerdown' || modeRef.current !== 'free') return;
    const brain = getBrain();
    if (Math.abs(x - brain.x) < 14 * scaleFor(rect.width)) brain.tap();
    else brain.walkTo(x, 1.4);
  };

  const signatureLabel = t(SIGNATURE_LABEL[pet.type] ?? 'Spezial');
  const unlocked = TRICKS.filter((trick) => pet.level >= trick.level).length;
  const best = readBest(pet.id);
  const busy = mode !== 'free';

  const stage = (
    <div className="pet-play__stage">
      <div className="pet-play__floor" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="pet-play__canvas"
        style={{
          touchAction: mode === 'game' ? 'none' : 'pan-y',
        }}
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        role="img"
        aria-label={t('{name} auf der Bühne', { name: pet.name })}
      />

      {mode === 'game' && (
        <div className="pet-play__hud">
          <span className="pet-play__score">{hud.score}</span>
          {hud.combo >= 3 && (
            <span className="pet-play__combo" style={{ color: currentTheme.accent }}>
              {t('{n}er-Serie', { n: hud.combo })}
            </span>
          )}
          <span className="pet-play__time">
            <span
              className="pet-play__time-bar"
              style={{
                width: `${(hud.time / GAME_SECONDS) * 100}%`,
                background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              }}
            />
          </span>
        </div>
      )}

      <AnimatePresence>
        {mode === 'countdown' && (
          <motion.div
            key={countdown}
            className="pet-play__countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {countdown > 0 ? countdown : t('Los!')}
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'countdown' && countdown === 3 && (
        <p className="pet-play__how">
          {t('Wisch hin und her, damit {name} die Snacks fängt. Finger weg vom Brokkoli!', {
            name: pet.name,
          })}
        </p>
      )}

      <AnimatePresence>
        {mode === 'result' && result && (
          <motion.div
            className="pet-play__result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: currentTheme.background.surface,
              borderColor: currentTheme.border.default,
            }}
          >
            <span className="pet-play__result-label" style={{ color: currentTheme.text.muted }}>
              {result.record ? t('Neuer Rekord!') : t('Snack-Regen')}
            </span>
            <span className="pet-play__result-score" style={{ color: currentTheme.text.primary }}>
              {result.score}
            </span>
            <span className="pet-play__result-best" style={{ color: currentTheme.text.muted }}>
              {t('Rekord: {n}', { n: result.best })}
            </span>
            {result.reward && (
              <span className="pet-play__reward" style={{ color: currentTheme.status.success }}>
                {t('{name} ist jetzt glücklicher', { name: pet.name })}
              </span>
            )}
            <div className="pet-play__result-actions">
              <button
                type="button"
                className="pet-play__btn"
                style={{ borderColor: currentTheme.border.default }}
                onClick={startGame}
              >
                {t('Nochmal')}
              </button>
              <button
                type="button"
                className="pet-play__btn pet-play__btn--primary"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  color: currentTheme.background.default,
                }}
                onClick={() => setMode('free')}
              >
                {t('Fertig')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className={`pet-play${busy ? ' is-busy' : ''}`}>
      {scene ? scene(stage) : stage}

      {pet.isAlive && (
        <div className={`pet-play__panel${busy ? ' is-busy' : ''}`} aria-disabled={busy}>
          <div className="pet-play__head">
            <span className="pet-play__title" style={{ color: currentTheme.text.primary }}>
              {t('Tricks')}
            </span>
            <span className="pet-play__meta" style={{ color: currentTheme.text.muted }}>
              {t('{n} von {total} freigeschaltet', { n: unlocked, total: TRICKS.length })}
            </span>
          </div>

          <div className="pet-play__grid">
            {TRICKS.map((trick) => {
              const locked = pet.level < trick.level;
              const label = trick.kind === 'signature' ? signatureLabel : t(trick.label);
              return (
                <button
                  key={trick.kind}
                  type="button"
                  className={`pet-play__tile${locked ? ' is-locked' : ''}`}
                  disabled={locked || busy}
                  onClick={() => getBrain().trick(trick.kind)}
                  style={{
                    background: currentTheme.background.surface,
                    borderColor: currentTheme.border.default,
                  }}
                >
                  <span
                    className="pet-play__tile-icon"
                    style={
                      locked
                        ? { color: currentTheme.text.muted }
                        : {
                            color: currentTheme.primary,
                            background: `${currentTheme.primary}1f`,
                          }
                    }
                  >
                    {locked ? <Lock /> : trick.icon}
                  </span>
                  <span
                    className="pet-play__tile-label"
                    style={{ color: locked ? currentTheme.text.muted : currentTheme.text.primary }}
                  >
                    {label}
                  </span>
                  {locked && (
                    <span
                      className="pet-play__tile-level"
                      style={{ color: currentTheme.text.muted }}
                    >
                      {t('ab Lv {level}', { level: trick.level })}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              className="pet-play__tile"
              disabled={busy}
              onClick={() => getBrain().react('play')}
              style={{
                background: currentTheme.background.surface,
                borderColor: currentTheme.border.default,
              }}
            >
              <span
                className="pet-play__tile-icon"
                style={{ color: currentTheme.accent, background: `${currentTheme.accent}1f` }}
              >
                <SportsSoccer />
              </span>
              <span className="pet-play__tile-label" style={{ color: currentTheme.text.primary }}>
                {t('Ball')}
              </span>
            </button>
          </div>

          <button
            type="button"
            className="pet-play__game"
            disabled={busy}
            onClick={startGame}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}26, ${currentTheme.accent}14), ${currentTheme.background.surface}`,
              borderColor: `${currentTheme.primary}55`,
            }}
          >
            <span
              className="pet-play__game-icon"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                color: currentTheme.background.default,
              }}
            >
              <SportsEsports />
            </span>
            <span className="pet-play__game-text">
              <span className="pet-play__game-title" style={{ color: currentTheme.text.primary }}>
                {t('Snack-Regen')}
              </span>
              <span className="pet-play__game-sub" style={{ color: currentTheme.text.muted }}>
                {best > 0 ? t('Rekord: {n}', { n: best }) : t('Snacks fangen, Brokkoli ausweichen')}
              </span>
            </span>
            <PlayArrowRounded
              className="pet-play__game-play"
              style={{ color: currentTheme.primary }}
            />
          </button>
        </div>
      )}
    </div>
  );
};
