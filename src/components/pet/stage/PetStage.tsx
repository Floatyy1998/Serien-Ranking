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
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import type { PetReaction, PetReactionTone } from '../../../hooks/pet/usePetReactions';
import { PetBrain, type BrainEnv, type Reaction } from '../../../lib/pet/petBrain';
import { detectFinale } from '../../../lib/pet/petFinale';
import { GroupDirector } from '../../../lib/pet/petGroup';
import { t } from '../../../services/i18n';
import { onPetEpisode } from '../../../services/pet/petEvents';
import { PET_CONFIG } from '../../../services/pet/petConstants';
import { petMoodService } from '../../../services/pet/petMoodService';
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

/** Diese Reaktionen feiern die Begleiter auf dem Dock mit. */
const SHARED_REACTIONS = new Set<Reaction>(['cheer', 'party', 'levelup', 'love', 'rated']);

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
  /** Weitere Pets, die mit auf dem Dock laufen (höchstens zwei). */
  companions?: Pet[];
  mood: Pet['mood'];
  roam: boolean;
  reaction: PetReaction | null;
  season: SeasonId | null;
  unwatchedToday: number;
  onOpenPets: () => void;
  onOpenCalendar: () => void;
  onFeed: (petId: string) => void;
  onPlay: (petId: string) => void;
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
  companions = [],
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
  const hitRefs = useRef(new Map<string, HTMLDivElement>());
  const hungerRefs = useRef(new Map<string, HTMLDivElement>());
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleBoxRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const chipBoxRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const letterRef = useRef<HTMLButtonElement>(null);

  const brainsRef = useRef(new Map<string, PetBrain>());
  const brainFor = useCallback((id: string, startX?: number): PetBrain => {
    let brain = brainsRef.current.get(id);
    if (!brain) {
      brain = new PetBrain(startX ?? readNumber(POS_KEY) ?? window.innerWidth * 0.75);
      brainsRef.current.set(id, brain);
    }
    return brain;
  }, []);
  const leadId = pet.id;
  const getBrain = useCallback((): PetBrain => brainFor(leadId), [brainFor, leadId]);
  const groupRef = useRef<GroupDirector | null>(null);
  const getGroup = useCallback((): GroupDirector => {
    if (groupRef.current == null) {
      groupRef.current = new GroupDirector([], { gap: [24, 38], first: 16 });
    }
    return groupRef.current;
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
  const castRef = useRef<Pet[]>([pet]);
  const propsRef = useRef({ mood, roam, onFeed, onPlay, accent: currentTheme.primary, season });
  const playedRef = useRef(new Set<string>());
  const selectedRef = useRef(pet.id);
  const ballBrainRef = useRef<PetBrain | null>(null);

  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [chipOpen, setChipOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(pet.id);
  const [snackGhost, setSnackGhost] = useState<{ x: number; y: number } | null>(null);
  const [letterVisible, setLetterVisible] = useState(false);
  const [ballVisible, setBallVisible] = useState(false);

  const cast = pet.isAlive
    ? [pet, ...companions.filter((c) => c.isAlive && c.id !== pet.id)]
    : [pet];
  const castKey = cast.map((c) => c.id).join(',');

  useEffect(() => {
    petRef.current = pet;
  }, [pet]);

  // Wer läuft mit? Neue Begleiter starten neben dem aktiven Pet, der Regisseur kennt alle
  useEffect(() => {
    castRef.current = cast;
    const lead = brainFor(pet.id);
    cast.forEach((c, i) => {
      if (i > 0) brainFor(c.id, lead.x + (i % 2 === 1 ? -64 : 64) * Math.ceil(i / 2));
    });
    for (const id of [...brainsRef.current.keys()]) {
      if (!cast.some((c) => c.id === id)) brainsRef.current.delete(id);
    }
    getGroup().setBrains(cast.map((c) => brainFor(c.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey, brainFor, getGroup]);

  useEffect(() => {
    castRef.current = castRef.current.map((c) => cast.find((n) => n.id === c.id) ?? c);
  });

  useEffect(() => {
    propsRef.current = { mood, roam, onFeed, onPlay, accent: currentTheme.primary, season };
  }, [mood, roam, onFeed, onPlay, currentTheme.primary, season]);

  const showBubble = useCallback((icon: ReactNode, message: string) => {
    setBubble({ id: Date.now(), icon, message });
  }, []);

  const reactAll = useCallback(
    (action: Reaction) => {
      getBrain().react(action);
      if (!SHARED_REACTIONS.has(action)) return;
      castRef.current.slice(1).forEach((c, i) => {
        setTimeout(() => brainsRef.current.get(c.id)?.react(action), 260 * (i + 1));
      });
    },
    [getBrain]
  );

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
    if (action) reactAll(action);
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
        reactAll('party');
        showBubble(
          <EmojiEvents />,
          finale === 'series' ? t('Serie durch! Was für ein Ritt') : t('Staffel geschafft!')
        );
      }, 900);
    });
  }, [allSeriesList, showBubble, reactAll]);

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
    const reduce = prefersReducedMotion();
    if (import.meta.env.DEV) {
      const w = window as unknown as { petBrain?: PetBrain; petGroup?: GroupDirector };
      w.petBrain = getBrain();
      w.petGroup = getGroup();
    }

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

      const lead = petRef.current;
      const brain = brainFor(lead.id);
      const actors = castRef.current;
      const props = propsRef.current;
      const geo = geoRef.current;
      const tired = recentEpisodeCountCached(frameCount);
      const groundY = geo.stageH - GROUND_INSET;

      if (actors.length > 1 && props.roam && !reduce) {
        getGroup().update(dt, { minX: geo.minX, maxX: geo.maxX });
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, geo.width, geo.stageH);

      const drawn = actors.map((p) => ({ p, b: brainFor(p.id) }));
      // Getragene Pets liegen über den anderen
      drawn.sort((a, c) => Number(a.b.activity === 'carried') - Number(c.b.activity === 'carried'));
      for (const { p, b } of drawn) {
        const mood = p.id === lead.id ? props.mood : petMoodService.calculateCurrentMood(p);
        const env: BrainEnv = {
          minX: geo.minX,
          maxX: geo.maxX,
          hour,
          hungry: p.isAlive && p.hunger >= PET_CONFIG.STATUS_WARNING_HUNGER,
          sad: p.happiness < 30,
          sleepy: mood === 'sleepy',
          playful: mood === 'playful' || mood === 'excited',
          tired,
          roam: props.roam && !reduce,
          alive: p.isAlive,
          ps: PS,
          species: p.type,
        };
        b.update(dt, env);

        for (const ev of b.drainEvents()) {
          if (ev === 'fed') props.onFeed(p.id);
          if (ev === 'kicked' && !playedRef.current.has(p.id)) {
            playedRef.current.add(p.id);
            props.onPlay(p.id);
          }
        }

        const view = b.view();
        drawStageFrame(ctx, {
          pet: p,
          view,
          props: b.props,
          particles: b.particles,
          groundY,
          ps: PS,
          time: now / 1000,
          season: props.season,
          accent: props.accent,
        });

        const petTop = groundY - view.h;
        const hit = hitRefs.current.get(p.id);
        if (hit) hit.style.transform = `translate3d(${view.x - 36}px, ${petTop - 80}px, 0)`;
        const hunger = hungerRefs.current.get(p.id);
        if (hunger) {
          const show = env.hungry && view.activity !== 'sleep' && view.activity !== 'carried';
          hunger.style.opacity = show ? '1' : '0';
          hunger.style.transform = `translate3d(${view.x - 11}px, ${petTop - 106 + Math.sin(now / 300) * 3}px, 0)`;
        }
      }

      const view = brain.view();
      const top = groundY - view.h;
      const selected = brainsRef.current.get(selectedRef.current) ?? brain;
      const selView = selected.view();
      const selTop = groundY - selView.h;
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
        const left = Math.max(geo.dockLeft, Math.min(geo.dockRight - w, selView.x - w / 2));
        chipRef.current.style.transform = `translate3d(${left}px, ${selTop - 92}px, 0)`;
        chipRef.current.style.width = `${w}px`;
        chipBoxRef.current?.style.setProperty(
          '--tail-x',
          `${Math.max(24, Math.min(w - 24, selView.x - left))}px`
        );
      }

      const letter = brain.props.find((pr) => pr.kind === 'letter' && !pr.carried);
      if (!!letter !== letterShown) {
        letterShown = !!letter;
        setLetterVisible(letterShown);
      }
      if (letter && letterRef.current) {
        letterRef.current.style.transform = `translate3d(${letter.x - 22}px, ${groundY - letter.h - 40}px, 0)`;
      }
      const ballOwner = drawn.find(({ b }) => b.props.some((pr) => pr.kind === 'ball'))?.b;
      ballBrainRef.current = ballOwner ?? null;
      const ball = ballOwner?.props.find((pr) => pr.kind === 'ball');
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
  }, [getBrain, brainFor, getGroup]);

  // Anfassen, Tragen, Werfen
  const gesture = useRef<{
    petId: string;
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

  const actorOf = (petId: string) => castRef.current.find((c) => c.id === petId) ?? petRef.current;

  const onPetDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const petId = e.currentTarget.dataset.petId ?? petRef.current.id;
    e.currentTarget.setPointerCapture(e.pointerId);
    const brain = brainFor(petId);
    const { h } = stageCoords(e.clientX, e.clientY);
    gesture.current = {
      petId,
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      grabbed: false,
      offsetY: h - brain.h,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: e.timeStamp,
      vx: 0,
      vy: 0,
    };
  };

  const onPetMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const brain = brainFor(g.petId);
    const now = e.timeStamp;
    const dt = Math.max(0.001, (now - g.lastT) / 1000);
    g.vx = g.vx * 0.6 + ((e.clientX - g.lastX) / dt) * 0.4;
    g.vy = g.vy * 0.6 + ((e.clientY - g.lastY) / dt) * 0.4;
    g.lastX = e.clientX;
    g.lastY = e.clientY;
    g.lastT = now;
    const moved = Math.hypot(e.clientX - g.startX, e.clientY - g.startY);
    const { x, h } = stageCoords(e.clientX, e.clientY);
    if (!g.grabbed && moved > 7 && actorOf(g.petId).isAlive) {
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
    const brain = brainFor(g.petId);
    if (g.grabbed) {
      brain.release(g.vx, -g.vy);
      return;
    }
    if (!actorOf(g.petId).isAlive) {
      onOpenPets();
      return;
    }
    brain.tap();
    openCardFor(g.petId);
  };

  const onPetKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const petId = e.currentTarget.dataset.petId ?? petRef.current.id;
    brainFor(petId).tap();
    openCardFor(petId);
  };

  const openCardFor = (petId: string) => {
    selectedRef.current = petId;
    setChipOpen((open) => !(open && selectedId === petId));
    setSelectedId(petId);
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
    const brain = brainFor(cardPet.id);
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
    playedRef.current.delete(cardPet.id);
    brainFor(cardPet.id).react('play');
  };

  const cardPet = cast.find((c) => c.id === selectedId) ?? pet;
  const cardMood = cardPet.id === pet.id ? mood : petMoodService.calculateCurrentMood(cardPet);
  const satiety = Math.round(Math.max(0, Math.min(100, 100 - cardPet.hunger)));
  const moodLabel = MOOD_LABEL[cardMood ?? 'happy'] ?? MOOD_LABEL.happy;
  const moodColor =
    cardMood === 'hungry' || cardMood === 'sad' || cardMood === 'scared'
      ? currentTheme.status.warning
      : cardMood === 'sleepy'
        ? currentTheme.text.muted
        : currentTheme.status.success;
  const glass: CSSProperties = {
    background: `color-mix(in srgb, ${currentTheme.background.surface} 94%, transparent)`,
    borderColor: `color-mix(in srgb, ${currentTheme.primary} 35%, transparent)`,
    color: currentTheme.text.secondary,
  };

  return (
    <div ref={stageRef} className="pet-stage">
      <canvas ref={canvasRef} className="pet-stage__canvas" />

      {cast.map((c) => (
        <div key={c.id}>
          <div
            ref={(el) => {
              if (el) hitRefs.current.set(c.id, el);
              else hitRefs.current.delete(c.id);
            }}
            className="pet-stage__hit"
            role="button"
            tabIndex={0}
            aria-label={t('{name} anstupsen', { name: c.name })}
            data-pet-id={c.id}
            onPointerDown={onPetDown}
            onPointerMove={onPetMove}
            onPointerUp={onPetUp}
            onPointerCancel={onPetUp}
            onKeyDown={onPetKey}
          />
          <div
            ref={(el) => {
              if (el) hungerRefs.current.set(c.id, el);
              else hungerRefs.current.delete(c.id);
            }}
            className="pet-stage__hunger"
            style={{ color: currentTheme.status.warning }}
          >
            <Restaurant />
          </div>
        </div>
      ))}

      {ballVisible && (
        <button
          ref={ballRef}
          type="button"
          className="pet-stage__ball"
          aria-label={t('Ball kicken')}
          onClick={() => (ballBrainRef.current ?? getBrain()).kickBall()}
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
                    {cardPet.name}
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
                  Lv. {cardPet.level}
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
                {cardPet.isAlive && (
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
                {cardPet.isAlive && (
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
                  <span>{cardPet.isAlive ? t('Profil') : t('Wiederbeleben')}</span>
                </button>
              </div>
              {cardPet.isAlive && <p className="pet-card__hint">{t('Snack aufs Pet ziehen')}</p>}
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
