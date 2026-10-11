import { useEffect, useRef, useState } from 'react';
import { PetStage } from '../../components/pet/stage/PetStage';
import { drawStageFrame } from '../../components/pet/stage/drawStage';
import type { PetReaction, PetReactionTone } from '../../hooks/pet/usePetReactions';
import { pickReaction } from '../../hooks/pet/usePetReactions';
import { PetBrain as PetBrainClass } from '../../lib/pet/petBrain';
import type { PetBrain, PetView, Reaction, Trick } from '../../lib/pet/petBrain';
import type { GroupDirector, GroupScene } from '../../lib/pet/petGroup';
import { walkCycle } from '../../lib/pet/petMotion';
import { PetCard } from '../Pets/PetCard';
import type { SeasonId } from '../../theme/seasonalThemes';
import type { Pet } from '../../types/pet.types';

import { DEV_PET_TYPES as TYPES, makeDevPet } from './devPets';

type PoseName = 'stand' | 'walkA' | 'walkB' | 'happy' | 'sleep' | 'lookL';

function poseView(name: PoseName): PetView {
  const base: PetView = {
    x: 0,
    h: 0,
    flip: 1,
    turn: 1,
    roll: 0,
    tilt: 0,
    bob: 0,
    squashX: 1,
    squashY: 1,
    pose: { pawLift: [0, 0], eyes: 'auto', lookX: 0 },
    activity: 'idle',
  };
  if (name === 'walkA' || name === 'walkB') {
    const m = walkCycle(name === 'walkA' ? Math.PI / 2 : (Math.PI * 3) / 2);
    return {
      ...base,
      tilt: m.tilt,
      bob: m.bob * 2,
      pose: { ...base.pose, pawLift: m.pawLift, lookX: 1 },
      activity: 'walk',
    };
  }
  if (name === 'happy') return { ...base, pose: { ...base.pose, eyes: 'happy' } };
  if (name === 'sleep')
    return {
      ...base,
      squashY: 0.86,
      squashX: 1.08,
      pose: { ...base.pose, eyes: 'closed' },
      activity: 'sleep',
    };
  if (name === 'lookL') return { ...base, pose: { ...base.pose, lookX: -1 } };
  return base;
}

function PoseCell({ pet, pose, season }: { pet: Pet; pose: PoseName; season: SeasonId | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = 2;
    canvas.width = 132 * dpr;
    canvas.height = 132 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 132, 132);
    drawStageFrame(ctx, {
      pet,
      view: { ...poseView(pose), x: 66, bob: poseView(pose).bob * 2 },
      props: [],
      particles: [],
      groundY: 124,
      ps: 4,
      time: 0,
      season,
      accent: '#ff7a1f',
    });
  }, [pet, pose, season]);
  return <canvas ref={ref} style={{ width: 132, height: 132 }} />;
}

export const PetPoseGalleryPreview = ({
  season = null,
  levels = [1, 20, 50],
  types = TYPES,
}: {
  season?: SeasonId | null;
  levels?: number[];
  types?: Pet['type'][];
}) => {
  const poses: PoseName[] = ['stand', 'walkA', 'walkB', 'happy', 'sleep', 'lookL'];
  return (
    <div style={{ padding: 12, display: 'grid', gap: 6 }}>
      {types.flatMap((type) =>
        levels.map((level) => (
          <div key={`${type}-${level}`} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <span style={{ width: 70, fontSize: 11, opacity: 0.7 }}>
              {type} {level}
            </span>
            {poses.map((p) => (
              <PoseCell key={p} pet={makeDevPet(type, level)} pose={p} season={season} />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

const TONES: PetReactionTone[] = ['cheer', 'binge', 'levelup', 'love', 'movie', 'rated'];
const ACTIONS: Reaction[] = ['party', 'play', 'letter', 'feed'];

const COMPANIONS: Pet[] = [
  makeDevPet('dog', 9, { name: 'Bello' }),
  makeDevPet('dragon', 22, { name: 'Funke' }),
];
const GROUP_SCENES: GroupScene[] = ['greet', 'chase', 'dance', 'race', 'parade', 'wave'];

export const PetStagePreview = ({ initialCompanions = 0 }: { initialCompanions?: number }) => {
  const [companions, setCompanions] = useState(initialCompanions);
  const [type, setType] = useState<Pet['type']>('cat');
  const [level, setLevel] = useState(12);
  const [hungry, setHungry] = useState(false);
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const [season, setSeason] = useState<SeasonId | null>(null);
  const pet = makeDevPet(type, level, { hunger: hungry ? 85 : 10 });
  const brain = () => (window as unknown as { petBrain?: PetBrain }).petBrain;

  return (
    <div
      style={{ minHeight: '100vh', padding: 16, display: 'grid', gap: 10, alignContent: 'start' }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {TYPES.map((tp) => (
          <button key={tp} type="button" onClick={() => setType(tp)} style={btn(tp === type)}>
            {tp}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[1, 12, 25, 55].map((lv) => (
          <button key={lv} type="button" onClick={() => setLevel(lv)} style={btn(lv === level)}>
            Lv {lv}
          </button>
        ))}
        <button type="button" onClick={() => setHungry((h) => !h)} style={btn(hungry)}>
          hungrig
        </button>
        {(['spooky', 'christmas', 'newyear', 'valentine'] as SeasonId[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeason(season === s ? null : s)}
            style={btn(season === s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            style={btn(false)}
            onClick={() => setReaction({ ...pickReaction(tone, { n: 12 }), id: Date.now() })}
          >
            {tone}
          </button>
        ))}
        {ACTIONS.map((a) => (
          <button key={a} type="button" style={btn(false)} onClick={() => brain()?.react(a)}>
            {a}
          </button>
        ))}
        <button type="button" style={btn(false)} onClick={() => brain()?.dropSnack(200, 80)}>
          snack
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[0, 1, 2].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCompanions(n)}
            style={btn(n === companions)}
          >
            +{n}
          </button>
        ))}
        {GROUP_SCENES.map((scene) => (
          <button
            key={scene}
            type="button"
            style={btn(false)}
            onClick={() =>
              (window as unknown as { petGroup?: GroupDirector }).petGroup?.play(scene, {
                minX: 42,
                maxX: window.innerWidth - 42,
              })
            }
          >
            {scene}
          </button>
        ))}
      </div>
      <div
        className="mobile-bottom-navigation"
        style={{ height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      />
      <PetStage
        key={`${type}-${level}`}
        pet={pet}
        companions={COMPANIONS.slice(0, companions)}
        mood={hungry ? 'hungry' : 'happy'}
        roam
        reaction={reaction}
        season={season}
        unwatchedToday={0}
        onOpenPets={() => {}}
        onOpenCalendar={() => {}}
        onFeed={() => setHungry(false)}
        onPlay={() => {}}
      />
    </div>
  );
};

function btn(active: boolean): React.CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: active ? 'var(--theme-primary)' : 'transparent',
    color: active ? '#000' : 'inherit',
    fontSize: 12,
    fontWeight: 600,
    minHeight: 0,
    minWidth: 0,
  };
}

export const PetPlaygroundPreview = ({ background = 'saturnView' }: { background?: string }) => {
  const [type, setType] = useState<Pet['type']>('cat');
  const [level, setLevel] = useState(12);
  const pet = makeDevPet(type, level, { equippedBackground: background });
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 16px' }}>
        {TYPES.map((tp) => (
          <button key={tp} type="button" onClick={() => setType(tp)} style={btn(tp === type)}>
            {tp}
          </button>
        ))}
        {[1, 12, 30].map((lv) => (
          <button key={lv} type="button" onClick={() => setLevel(lv)} style={btn(lv === level)}>
            Lv {lv}
          </button>
        ))}
      </div>
      <PetCard
        pet={pet}
        currentMood="loved"
        hungerPercentage={90}
        happinessPercentage={95}
        experiencePercentage={40}
        experienceNeeded={300}
        isHealthy
        xpBonusHint=""
      />
    </div>
  );
};

const STRIP_FRAMES = 14;

function SignatureStrip({ pet, trick = 'signature' }: { pet: Pet; trick?: Trick }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const cellW = 92;
    const cellH = 150;
    const dpr = 2;
    canvas.width = cellW * STRIP_FRAMES * dpr;
    canvas.height = cellH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cellW * STRIP_FRAMES, cellH);
    const env = {
      minX: 0,
      maxX: 4000,
      hour: 14,
      hungry: false,
      sad: false,
      sleepy: false,
      playful: false,
      tired: false,
      roam: false,
      alive: true,
      ps: 2.5,
      species: pet.type,
    };
    const brain = new PetBrainClass(200, () => 0.5);
    brain.update(1 / 60, env);
    brain.trick(trick);
    const total = 3.4;
    const x0 = brain.x;
    const step = total / (STRIP_FRAMES - 1);
    for (let i = 0; i < STRIP_FRAMES; i++) {
      if (i > 0) for (let k = 0; k < Math.round(step * 60); k++) brain.update(1 / 60, env);
      const view = brain.view();
      ctx.save();
      ctx.beginPath();
      ctx.rect(i * cellW, 0, cellW, cellH);
      ctx.clip();
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(i * cellW, 0, cellW, cellH);
      drawStageFrame(ctx, {
        pet,
        view: { ...view, x: i * cellW + cellW / 2 + (view.x - x0) * 0.25 },
        props: [],
        particles: [],
        groundY: cellH - 16,
        ps: 2.5,
        time: 0,
        season: null,
        accent: '#ff7a1f',
      });
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px sans-serif';
      ctx.fillText(
        `${(i * (total / (STRIP_FRAMES - 1))).toFixed(1)}s ${view.activity}`,
        i * cellW + 4,
        12
      );
      ctx.restore();
    }
  }, [pet, trick]);
  return <canvas ref={ref} style={{ width: 92 * STRIP_FRAMES, height: 150, display: 'block' }} />;
}

export const SignatureStripPreview = () => (
  <div style={{ padding: 12, display: 'grid', gap: 8, overflowX: 'auto' }}>
    <SignatureStrip pet={makeDevPet('dog', 12)} trick="sit" />
    <SignatureStrip pet={makeDevPet('cat', 12)} trick="sit" />
    {TYPES.map((tp) => (
      <SignatureStrip key={tp} pet={makeDevPet(tp, 12)} />
    ))}
  </div>
);
