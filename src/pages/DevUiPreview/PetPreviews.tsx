import { useEffect, useRef, useState } from 'react';
import { PetStage } from '../../components/pet/stage/PetStage';
import { drawStageFrame } from '../../components/pet/stage/drawStage';
import type { PetReaction, PetReactionTone } from '../../hooks/pet/usePetReactions';
import { pickReaction } from '../../hooks/pet/usePetReactions';
import type { PetBrain, PetView, Reaction } from '../../lib/pet/petBrain';
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

export const PetStagePreview = () => {
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
      <div
        className="mobile-bottom-navigation"
        style={{ height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      />
      <PetStage
        key={`${type}-${level}`}
        pet={pet}
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
