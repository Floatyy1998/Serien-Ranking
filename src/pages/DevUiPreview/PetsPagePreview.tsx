import { useEffect, useMemo, useRef, useState } from 'react';
import { ACCESSORIES } from '../../components/pet/data/accessories';
import { PET_BACKGROUNDS } from '../../components/pet/data/petBackgrounds';
import { toggleWorn } from '../../components/pet/outfit';
import { petPortrait } from '../../components/pet/pixelThumbs';
import { drawPetFigure } from '../../components/pet/renderPet';
import { setVolume } from '../../components/pet/sprites/shapes';
import { bodyGeom } from '../../components/pet/stage/drawStage';
import { DEFAULT_LIGHT, drawLitFigure, drawSoftShadow } from '../../components/pet/stage/litFigure';
import { dockAfterSwitch } from '../../services/pet/petCore';
import type { Pet, PetAccessory } from '../../types/pet.types';
import { PetsPageView, type PetsPageData } from '../Pets/PetsPage';
import { makeDevPet } from './devPets';

const noop = () => {};

function inventory(count: number, worn: string[]): PetAccessory[] {
  return Object.entries(ACCESSORIES)
    .filter((_, i) => i % Math.max(1, Math.floor(133 / count)) === 0)
    .concat(worn.map((id) => [id, ACCESSORIES[id]] as const))
    .filter(([id], i, arr) => arr.findIndex(([x]) => x === id) === i)
    .map(([id, def], i) => ({
      id,
      type: def.slot,
      name: def.name,
      icon: def.icon,
      equipped: worn.includes(id),
      ...(i % 11 === 3 ? { isNew: true } : {}),
    }));
}

/** Komplette Pet-Seite mit Testdaten; Anlegen, Hintergrund und Farbe wirken lokal. */
export const PetsPagePreview = ({
  level = 18,
  worn = ['crown', 'heartGlasses'],
}: {
  level?: number;
  worn?: string[];
}) => {
  const [pets, setPets] = useState<Pet[]>(() => {
    const accessories = inventory(46, worn);
    const backgrounds = Object.keys(PET_BACKGROUNDS).filter((_, i) => i % 3 === 0);
    return [
      makeDevPet('cat', level, {
        name: 'Mochi',
        accessories,
        unlockedBackgrounds: backgrounds,
        equippedBackground: backgrounds[2],
        favoriteGenre: 'Sci-Fi & Fantasy',
        experience: 420,
      }),
      makeDevPet('panda', 9, { name: 'Bao', accessories, unlockedBackgrounds: backgrounds }),
      makeDevPet('penguin', 4, { name: 'Pingu', accessories, unlockedBackgrounds: backgrounds }),
    ];
  });
  const [selected, setSelected] = useState(0);
  const [dockIds, setDockIds] = useState<string[]>(['dev-panda-9']);
  const pet = pets[selected];

  const update = (patch: Partial<Pet>) =>
    setPets((prev) => prev.map((p, i) => (i === selected ? { ...p, ...patch } : p)));

  const data = useMemo<PetsPageData>(
    () => ({
      pets,
      pet,
      selectedPetIndex: selected,
      canAddNewPet: false,
      isLoading: false,
      showCreateModal: false,
      petName: '',
      selectedType: 'cat',
      activeColorBorder: pet.color,
      showReleaseConfirm: false,
      showReviveConfirm: false,
      dockIds,
      currentMood: 'happy',
      hungerPercentage: 72,
      happinessPercentage: 88,
      experienceNeeded: pet.level * 100,
      experiencePercentage: (pet.experience / (pet.level * 100)) * 100,
      isHealthy: true,
      xpBonusHint: '',
      setPetName: noop,
      setSelectedType: noop,
      createPet: async () => {},
      feedPet: async () => {},
      playWithPet: async () => {},
      cheerUpPet: async () => {},
      revivePet: async () => {},
      releasePet: async () => {},
      changeColor: async (color: string) => update({ color }),
      toggleAccessory: (id: string) => {
        const change = toggleWorn(pet, id);
        if (change.blocked) return false;
        update({ accessories: change.accessories });
        return true;
      },
      equipBackground: async (id: string | null) => update({ equippedBackground: id ?? undefined }),
      selectPet: async (idx: number) => {
        setDockIds((prev) => dockAfterSwitch(prev, pet.id, pets[idx].id));
        setSelected(idx);
      },
      toggleDock: (id: string) =>
        setDockIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      openCreateModal: noop,
      closeCreateModal: noop,
      openReleaseConfirm: noop,
      closeReleaseConfirm: noop,
      openReviveConfirm: noop,
      closeReviveConfirm: noop,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pets, pet, selected, dockIds]
  );

  return <PetsPageView data={data} />;
};

/** Jeder Kopfschmuck zusammen mit Brille und Schal, um Überlagerungen zu finden. */
export const OutfitClashPreview = ({ type = 'cat' as Pet['type'], face = 'sunglasses' }) => {
  const heads = Object.entries(ACCESSORIES).filter(([, d]) => d.slot === 'head');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, padding: 12 }}>
      {heads.map(([id, def]) => {
        const pet = makeDevPet(type, 18, {
          accessories: [id, face, 'woolScarf'].map((a) => ({
            id: a,
            type: ACCESSORIES[a].slot,
            name: ACCESSORIES[a].name,
            icon: '',
            equipped: true,
          })),
        });
        return (
          <div key={id} style={{ textAlign: 'center', fontSize: 9, color: '#ccc' }}>
            <img
              src={petPortrait(pet)}
              alt=""
              style={{ width: '100%', aspectRatio: '1', objectFit: 'contain' }}
            />
            {def.name}
          </div>
        );
      })}
    </div>
  );
};

type LitMode = 'flat' | 'volume' | 'full';

function LitCell({ pet, mode, background }: { pet: Pet; mode: LitMode; background: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = 2;
    const size = 180;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ps = 4.6;
    const box = bodyGeom(pet);
    const groundY = size - 18;
    if (mode !== 'flat') drawSoftShadow(ctx, size / 2, groundY, 0, ps, box.halfW);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.26)';
      ctx.beginPath();
      ctx.ellipse(size / 2, groundY - ps * 0.3, 7 * ps, 1.6 * ps, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(size / 2, groundY);
    ctx.translate(-16 * ps, -box.feet * ps);
    const draw = (target: CanvasRenderingContext2D, scale: number) =>
      drawPetFigure(target, pet, {
        ps: scale,
        offset: 0,
        animated: false,
        frame: 0,
        animationSpeed: 0,
      });
    setVolume(mode !== 'flat');
    if (mode === 'full') drawLitFigure(ctx, draw, ps, box, DEFAULT_LIGHT, dpr);
    else draw(ctx, ps);
    setVolume(true);
    ctx.restore();
  }, [pet, mode]);
  return <canvas ref={ref} style={{ width: 180, height: 180, borderRadius: 16, background }} />;
}

/** Pets flach, mit Volumen und mit Volumen plus Randlicht nebeneinander. */
export const LitComparePreview = () => {
  const bgs = [
    'linear-gradient(#6db6e6, #cdeaf8)',
    'radial-gradient(circle at 50% 30%, #3a2a55, #160f24)',
  ];
  const types: Pet['type'][] = [
    'cat',
    'dog',
    'fox',
    'panda',
    'penguin',
    'axolotl',
    'dragon',
    'owl',
    'rabbit',
    'bird',
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 12 }}>
      {types.map((type, i) => {
        const pet = makeDevPet(type, 18, {
          accessories: [
            { id: i % 2 ? 'topHat' : 'crown', type: 'head', name: '', icon: '', equipped: true },
          ],
        });
        const bg = bgs[i % 2];
        return (
          <div key={type} style={{ display: 'flex', gap: 4 }}>
            <LitCell pet={pet} mode="flat" background={bg} />
            <LitCell pet={pet} mode="volume" background={bg} />
            <LitCell pet={pet} mode="full" background={bg} />
          </div>
        );
      })}
    </div>
  );
};
