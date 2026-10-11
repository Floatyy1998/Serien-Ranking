import {
  ArrowUpward,
  AutoAwesome,
  Bedtime,
  Bolt,
  ChevronRight,
  EmojiEvents,
  Favorite,
  LocalFireDepartment,
  Movie,
  Replay,
  Restaurant,
  SportsSoccer,
  Star,
  Tv,
  WbSunny,
  WbTwilight,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import type { PetReaction, PetReactionTone } from '../../../hooks/pet/usePetReactions';
import { PetBrain, type BrainEnv, type Reaction } from '../../../lib/pet/petBrain';
import { detectFinale } from '../../../lib/pet/petFinale';
import { t } from '../../../services/i18n';
import { onPetEpisode } from '../../../services/pet/petEvents';
import { PET_CONFIG } from '../../../services/pet/petConstants';
import type { SeasonId } from '../../../theme/seasonalThemes';
import type { Pet } from '../../../types/pet.types';
import { drawStageFrame } from './drawStage';
import './petStage.css';

const GROUND_INSET = 3;
const PS = 2.5;
const POS_KEY = 'petStageX';
const LETTER_KEY = 'petLetterDay';
const RECENT_KEY = 'petRecentEpisodes';

const TONE_ICON: Record<PetReactionTone, ReactNode> = {
  cheer: <AutoAwesome />,
  streak: <LocalFireDepartment />,
  milestone: <EmojiEvents />,
  levelup: <ArrowUpward />,
  love: <Favorite />,
  idle: <Tv />,
  morning: <WbSunny />,
  evening: <WbTwilight />,
  late: <Bedtime />,
  binge: <Bolt />,
  rewatch: <Replay />,
  movie: <Movie />,
  rated: <Star />,
};

const TONE_ACTION: Partial<Record<PetReactionTone, Reaction>> = {
  cheer: 'cheer',
  streak: 'cheer',
  milestone: 'party',
  levelup: 'levelup',
  love: 'love',
  binge: 'binge',
  rewatch: 'cheer',
  movie: 'movie',
  rated: 'rated',
};

const MOOD_LABEL: Record<string, string> = {
  happy: t('Glücklich'),
  excited: t('Aufgedreht'),
  playful: t('Verspielt'),
  sleepy: t('Müde'),
  hungry: t('Hungrig'),
  sad: t('Traurig'),
  festive: t('Festlich'),
  scared: t('Ängstlich'),
  loved: t('Verliebt'),
};

interface Bubble {
  id: number;
  icon: ReactNode;
  message: string;
}

interface PetStageProps {
  pet: Pet;
  mood: Pet['mood'];
  roam: boolean;
  reaction: PetReaction | null;
  season: SeasonId | null;
  unwatchedToday: number;
  onOpenPets: () => void;
  onOpenCalendar: () => void;
  onFeed: () => void;
  onPlay: () => void;
}

function readNumber(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function recentEpisodeCount(): number {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as number[];
    const since = Date.now() - 2 * 3600_000;
    return list.filter((ts) => ts > since).length;
  } catch {
    return 0;
  }
}

function rememberEpisode(): void {
  try {
    const since = Date.now() - 2 * 3600_000;
    const list = (JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as number[]).filter(
      (ts) => ts > since
    );
    list.push(Date.now());
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    // Storage gesperrt: dann eben ohne Müdigkeit
  }
}

function readLetterDay(): string | null {
  try {
    return localStorage.getItem(LETTER_KEY);
  } catch {
    return null;
  }
}

function dayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

export const PetStage = ({
  pet,
  mood,
  roam,
  reaction,
  season,
  unwatchedToday,
  onOpenPets,
  onOpenCalendar,
  onFeed,
  onPlay,
}: PetStageProps) => {
  const { currentTheme } = useTheme();
  const { allSeriesList } = useSeriesList();

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleBoxRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const chipBoxRef = useRef<HTMLDivElement>(null);
  const hungerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const letterRef = useRef<HTMLButtonElement>(null);

  const brainRef = useRef<PetBrain | null>(null);
  const getBrain = useCallback((): PetBrain => {
    if (brainRef.current == null) {
      brainRef.current = new PetBrain(readNumber(POS_KEY) ?? window.innerWidth * 0.75);
    }
    return brainRef.current;
  }, []);
  const geoRef = useRef({
    width: window.innerWidth,
    minX: 40,
    maxX: 300,
    dockTop: 0,
    dockLeft: 10,
    dockRight: 380,
    stageH: 200,
  });
  const petRef = useRef(pet);
  const propsRef = useRef({ mood, roam, onFeed, onPlay, accent: currentTheme.primary, season });
  const playedRef = useRef(false);

  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [chipOpen, setChipOpen] = useState(false);
  const [snackGhost, setSnackGhost] = useState<{ x: number; y: number } | null>(null);
  const [letterVisible, setLetterVisible] = useState(false);
  const [ballVisible, setBallVisible] = useState(false);

  useEffect(() => {
    petRef.current = pet;
  }, [pet]);

  useEffect(() => {
    propsRef.current = { mood, roam, onFeed, onPlay, accent: currentTheme.primary, season };
  }, [mood, roam, onFeed, onPlay, currentTheme.primary, season]);

  const showBubble = useCallback((icon: ReactNode, message: string) => {
    setBubble({ id: Date.now(), icon, message });
  }, []);

  useEffect(() => {
    if (!bubble) return;
    const timer = setTimeout(() => setBubble(null), 4200);
    return () => clearTimeout(timer);
  }, [bubble]);

  // Reaktionen aus der App: Sprechblase + passende Bewegung
  useEffect(() => {
    if (!reaction || !pet.isAlive) return;
    showBubble(TONE_ICON[reaction.tone] ?? <AutoAwesome />, reaction.message);
    const action = TONE_ACTION[reaction.tone];
    if (action) getBrain().react(action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction?.id]);

  // Staffel- und Serienfinale: Party
  useEffect(() => {
    return onPetEpisode((ev) => {
      rememberEpisode();
      if (ev.isRewatch || !petRef.current.isAlive) return;
      const series = allSeriesList.find((s) => s.id === ev.seriesId);
      if (!series) return;
      const finale = detectFinale(series, ev.seasonNumber, ev.episodeNumber);
      if (!finale) return;
      setTimeout(() => {
        getBrain().react('party');
        showBubble(
          <EmojiEvents />,
          finale === 'series' ? t('Serie durch! Was für ein Ritt') : t('Staffel geschafft!')
        );
      }, 900);
    });
  }, [allSeriesList, showBubble, getBrain]);

  // Brief: einmal am Tag, wenn heute neue Folgen laufen
  useEffect(() => {
    if (!pet.isAlive || unwatchedToday <= 0) return;
    if (readLetterDay() === dayKey()) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(LETTER_KEY, dayKey());
      } catch {
        // ohne Storage kommt der Brief eben öfter
      }
      getBrain().react('letter');
    }, 4500);
    return () => clearTimeout(timer);
  }, [pet.isAlive, unwatchedToday, getBrain]);

  // Hauptschleife
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const brain = getBrain();
    const reduce = prefersReducedMotion();
    if (import.meta.env.DEV) (window as unknown as { petBrain?: PetBrain }).petBrain = brain;

    let raf = 0;
    let last = performance.now();
    let frameCount = 0;
    let hour = new Date().getHours();
    let lastSave = 0;
    let letterShown = false;
    let ballShown = false;

    const measure = () => {
      const dock = document.querySelector('.mobile-bottom-navigation');
      const width = window.innerWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      let dockTop = window.innerHeight - 96;
      let dockLeft = 12;
      let dockRight = width - 12;
      if (dock) {
        const r = dock.getBoundingClientRect();
        if (r.width > 0) {
          dockTop = r.top;
          dockLeft = r.left;
          dockRight = r.right;
        }
      }
      // Die Bühne reicht vom oberen Rand bis aufs Dock: so bleibt ein hochgetragenes Pet sichtbar
      const stageH = Math.round(dockTop + GROUND_INSET);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(stageH * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(stageH * dpr);
        canvas.style.height = `${stageH}px`;
        stage.style.height = `${stageH}px`;
      }
      geoRef.current = {
        width,
        minX: dockLeft + 30,
        maxX: dockRight - 30,
        dockTop,
        dockLeft,
        dockRight,
        stageH,
      };
      return dpr;
    };

    let dpr = measure();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      frameCount += 1;
      if (frameCount % 30 === 0) dpr = measure();
      if (frameCount % 600 === 0) hour = new Date().getHours();

      const p = petRef.current;
      const props = propsRef.current;
      const geo = geoRef.current;
      const env: BrainEnv = {
        minX: geo.minX,
        maxX: geo.maxX,
        hour,
        hungry: p.isAlive && p.hunger >= PET_CONFIG.STATUS_WARNING_HUNGER,
        sad: p.happiness < 30,
        sleepy: props.mood === 'sleepy',
        playful: props.mood === 'playful' || props.mood === 'excited',
        tired: recentEpisodeCountCached(frameCount),
        roam: props.roam && !reduce,
        alive: p.isAlive,
        ps: PS,
        species: p.type,
      };
      brain.update(dt, env);

      for (const ev of brain.drainEvents()) {
        if (ev === 'fed') props.onFeed();
        if (ev === 'kicked' && !playedRef.current) {
          playedRef.current = true;
          props.onPlay();
        }
      }

      const view = brain.view();
      const groundY = geo.stageH - GROUND_INSET;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, geo.width, geo.stageH);
      drawStageFrame(ctx, {
        pet: p,
        view,
        props: brain.props,
        particles: brain.particles,
        groundY,
        ps: PS,
        time: now / 1000,
        season: props.season,
        accent: props.accent,
      });

      const top = groundY - view.h;
      if (hitRef.current) {
        hitRef.current.style.transform = `translate3d(${view.x - 36}px, ${top - 80}px, 0)`;
      }
      if (bubbleRef.current) {
        const w = bubbleBoxRef.current?.offsetWidth ?? 0;
        const left = Math.max(10, Math.min(geo.width - w - 10, view.x - w / 2));
        bubbleRef.current.style.transform = `translate3d(${left}px, ${top - 88}px, 0)`;
        bubbleBoxRef.current?.style.setProperty(
          '--tail-x',
          `${Math.max(18, Math.min(w - 18, view.x - left))}px`
        );
      }
      if (chipRef.current) {
        const dockW = geo.dockRight - geo.dockLeft;
        const w = Math.min(dockW, 360);
        const left = Math.max(geo.dockLeft, Math.min(geo.dockRight - w, view.x - w / 2));
        chipRef.current.style.transform = `translate3d(${left}px, ${top - 92}px, 0)`;
        chipRef.current.style.width = `${w}px`;
        chipBoxRef.current?.style.setProperty(
          '--tail-x',
          `${Math.max(24, Math.min(w - 24, view.x - left))}px`
        );
      }
      if (hungerRef.current) {
        const show = env.hungry && view.activity !== 'sleep' && view.activity !== 'carried';
        hungerRef.current.style.opacity = show ? '1' : '0';
        hungerRef.current.style.transform = `translate3d(${view.x - 11}px, ${top - 106 + Math.sin(now / 300) * 3}px, 0)`;
      }

      const letter = brain.props.find((pr) => pr.kind === 'letter' && !pr.carried);
      if (!!letter !== letterShown) {
        letterShown = !!letter;
        setLetterVisible(letterShown);
      }
      if (letter && letterRef.current) {
        letterRef.current.style.transform = `translate3d(${letter.x - 22}px, ${groundY - letter.h - 40}px, 0)`;
      }
      const ball = brain.props.find((pr) => pr.kind === 'ball');
      if (!!ball !== ballShown) {
        ballShown = !!ball;
        setBallVisible(ballShown);
      }
      if (ball && ballRef.current) {
        ballRef.current.style.transform = `translate3d(${ball.x - 22}px, ${groundY - ball.h - 34}px, 0)`;
      }

      if (now - lastSave > 5000) {
        lastSave = now;
        try {
          localStorage.setItem(POS_KEY, String(Math.round(brain.x)));
        } catch {
          // Position ist Komfort, kein Muss
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      dpr = measure();
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [getBrain]);

  // Anfassen, Tragen, Werfen
  const gesture = useRef<{
    id: number;
    startX: number;
    startY: number;
    grabbed: boolean;
    offsetY: number;
    lastX: number;
    lastY: number;
    lastT: number;
    vx: number;
    vy: number;
  } | null>(null);

  const stageCoords = (clientX: number, clientY: number) => {
    const groundScreenY = geoRef.current.dockTop;
    return { x: clientX, h: groundScreenY - clientY };
  };

  const onPetDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const brain = getBrain();
    const { h } = stageCoords(e.clientX, e.clientY);
    gesture.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      grabbed: false,
      offsetY: h - brain.h,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: performance.now(),
      vx: 0,
      vy: 0,
    };
  };

  const onPetMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const brain = getBrain();
    const now = performance.now();
    const dt = Math.max(0.001, (now - g.lastT) / 1000);
    g.vx = g.vx * 0.6 + ((e.clientX - g.lastX) / dt) * 0.4;
    g.vy = g.vy * 0.6 + ((e.clientY - g.lastY) / dt) * 0.4;
    g.lastX = e.clientX;
    g.lastY = e.clientY;
    g.lastT = now;
    const moved = Math.hypot(e.clientX - g.startX, e.clientY - g.startY);
    const { x, h } = stageCoords(e.clientX, e.clientY);
    if (!g.grabbed && moved > 7 && petRef.current.isAlive) {
      g.grabbed = true;
      setChipOpen(false);
      brain.grab(x, Math.max(0, h - g.offsetY));
    }
    if (g.grabbed) brain.drag(x, Math.min(h - g.offsetY, geoRef.current.dockTop - 90), dt);
  };

  const onPetUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.id !== e.pointerId) return;
    const brain = getBrain();
    if (g.grabbed) {
      brain.release(g.vx, -g.vy);
      return;
    }
    if (!petRef.current.isAlive) {
      onOpenPets();
      return;
    }
    brain.tap();
    setChipOpen((open) => !open);
  };

  useEffect(() => {
    if (!chipOpen) return;
    const timer = setTimeout(() => setChipOpen(false), 6000);
    return () => clearTimeout(timer);
  }, [chipOpen]);

  // Snack zum Pet ziehen
  const snackDrag = useRef<{ id: number; moved: boolean } | null>(null);

  const onSnackDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    snackDrag.current = { id: e.pointerId, moved: false };
    setSnackGhost({ x: e.clientX, y: e.clientY });
  };

  const onSnackMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!snackDrag.current || snackDrag.current.id !== e.pointerId) return;
    snackDrag.current.moved = true;
    setSnackGhost({ x: e.clientX, y: e.clientY });
  };

  const onSnackUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = snackDrag.current;
    snackDrag.current = null;
    setSnackGhost(null);
    if (!drag || drag.id !== e.pointerId) return;
    const brain = getBrain();
    const geo = geoRef.current;
    setChipOpen(false);
    if (!drag.moved) {
      const side = brain.x > (geo.minX + geo.maxX) / 2 ? -1 : 1;
      brain.dropSnack(brain.x + side * 46, 70);
      return;
    }
    const { x, h } = stageCoords(e.clientX, e.clientY);
    brain.dropSnack(Math.max(geo.minX, Math.min(geo.maxX, x)), Math.max(0, h));
  };

  const onPlayClick = () => {
    setChipOpen(false);
    playedRef.current = false;
    getBrain().react('play');
  };

  const satiety = Math.round(Math.max(0, Math.min(100, 100 - pet.hunger)));
  const moodLabel = MOOD_LABEL[mood ?? 'happy'] ?? MOOD_LABEL.happy;
  const moodColor =
    mood === 'hungry' || mood === 'sad' || mood === 'scared'
      ? currentTheme.status.warning
      : mood === 'sleepy'
        ? currentTheme.text.muted
        : currentTheme.status.success;
  const glass: CSSProperties = {
    background: `color-mix(in srgb, ${currentTheme.background.surface} 94%, transparent)`,
    borderColor: `color-mix(in srgb, ${currentTheme.primary} 35%, transparent)`,
    color: currentTheme.text.secondary,
  };

  return (
    <div ref={stageRef} className="pet-stage">
      <canvas
        ref={canvasRef}
        className="pet-stage__canvas"
        style={{ filter: pet.isAlive ? undefined : 'grayscale(1) opacity(0.8)' }}
      />

      <div
        ref={hitRef}
        className="pet-stage__hit"
        role="button"
        tabIndex={0}
        aria-label={t('{name} anstupsen', { name: pet.name })}
        onPointerDown={onPetDown}
        onPointerMove={onPetMove}
        onPointerUp={onPetUp}
        onPointerCancel={onPetUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            getBrain().tap();
            setChipOpen((open) => !open);
          }
        }}
      />

      <div
        ref={hungerRef}
        className="pet-stage__hunger"
        style={{ color: currentTheme.status.warning }}
      >
        <Restaurant />
      </div>

      {ballVisible && (
        <button
          ref={ballRef}
          type="button"
          className="pet-stage__ball"
          aria-label={t('Ball kicken')}
          onClick={() => getBrain().kickBall()}
        />
      )}

      {letterVisible && (
        <button
          ref={letterRef}
          type="button"
          className="pet-stage__letter"
          aria-label={t('Brief öffnen: neue Folgen heute')}
          onClick={() => {
            getBrain().dismissLetter();
            onOpenCalendar();
          }}
        />
      )}

      <div ref={bubbleRef} className="pet-stage__anchor">
        <AnimatePresence>
          {bubble && !chipOpen && (
            <motion.div
              ref={bubbleBoxRef}
              key={bubble.id}
              className="pet-stage__bubble"
              style={glass}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.92 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="pet-stage__bubble-icon" style={{ color: currentTheme.primary }}>
                {bubble.icon}
              </span>
              <span>{bubble.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {chipOpen && <div className="pet-stage__backdrop" onPointerDown={() => setChipOpen(false)} />}

      <div ref={chipRef} className="pet-stage__anchor">
        <AnimatePresence>
          {chipOpen && (
            <motion.div
              ref={chipBoxRef}
              className="pet-card"
              style={glass}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="pet-card__head">
                <div className="pet-card__title">
                  <span className="pet-card__name" style={{ color: currentTheme.text.primary }}>
                    {pet.name}
                  </span>
                  <span className="pet-card__mood">
                    <span className="pet-card__mood-dot" style={{ background: moodColor }} />
                    {moodLabel}
                  </span>
                </div>
                <span
                  className="pet-card__level"
                  style={{
                    color: currentTheme.primary,
                    borderColor: `color-mix(in srgb, ${currentTheme.primary} 40%, transparent)`,
                  }}
                >
                  Lv. {pet.level}
                </span>
              </div>

              <div className="pet-card__meter">
                <div className="pet-card__bar">
                  <span
                    style={{
                      width: `${satiety}%`,
                      background:
                        satiety < 30
                          ? currentTheme.status.error
                          : `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    }}
                  />
                </div>
                <span className="pet-card__meter-label">{t('Satt {n}%', { n: satiety })}</span>
              </div>

              <div className="pet-card__actions">
                {pet.isAlive && (
                  <button
                    type="button"
                    className="pet-card__tile"
                    onPointerDown={onSnackDown}
                    onPointerMove={onSnackMove}
                    onPointerUp={onSnackUp}
                    onPointerCancel={onSnackUp}
                    aria-label={t('Snack geben')}
                  >
                    <span className="pet-card__tile-icon" style={{ color: currentTheme.primary }}>
                      <Restaurant />
                    </span>
                    <span>{t('Snack')}</span>
                  </button>
                )}
                {pet.isAlive && (
                  <button type="button" className="pet-card__tile" onClick={onPlayClick}>
                    <span className="pet-card__tile-icon" style={{ color: currentTheme.primary }}>
                      <SportsSoccer />
                    </span>
                    <span>{t('Ball')}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="pet-card__tile pet-card__tile--primary"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    color: currentTheme.background.default,
                  }}
                  onClick={() => {
                    setChipOpen(false);
                    onOpenPets();
                  }}
                >
                  <span className="pet-card__tile-icon pet-card__tile-icon--solid">
                    <ChevronRight />
                  </span>
                  <span>{pet.isAlive ? t('Profil') : t('Wiederbeleben')}</span>
                </button>
              </div>
              {pet.isAlive && <p className="pet-card__hint">{t('Snack aufs Pet ziehen')}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {snackGhost && (
        <div
          className="pet-stage__ghost"
          style={{ transform: `translate3d(${snackGhost.x - 16}px, ${snackGhost.y - 16}px, 0)` }}
        >
          <Restaurant />
        </div>
      )}
    </div>
  );
};

let tiredCache = { frame: -1000, value: false };

function recentEpisodeCountCached(frame: number): boolean {
  if (frame - tiredCache.frame > 600 || frame < tiredCache.frame) {
    tiredCache = { frame, value: recentEpisodeCount() >= 5 };
  }
  return tiredCache.value;
}
