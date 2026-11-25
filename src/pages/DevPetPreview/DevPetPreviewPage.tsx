import type React from 'react';
import { useContext, useState } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { EvolvingPixelPet } from '../../components/pet/EvolvingPixelPet';
import { ACCESSORIES } from '../../components/pet/data/accessories';
import { PET_BACKGROUNDS } from '../../components/pet/data/petBackgrounds';
import { EXTRA_SCENES } from '../../components/pet/data/petBackgroundsExtra';
import { petSignatureColor } from '../../components/pet/data/petSignature';
import type { Pet, PetAccessory } from '../../types/pet.types';
import '../Pets/PetsPage.css';

// Dev-only Vorschau aller Pet-Inhalte (nur im Dev-Server geroutet).
// ?pets=frog,bat&lv=1,25,60 · ?acc=cat,owl&ids=a,b&slot=face · ?bgs=new&room=1&w=350&h=300

const SHOW_PET_TYPES: { type: Pet['type']; label: string }[] = [
  { type: 'cat', label: 'Katze' },
  { type: 'dog', label: 'Hund' },
  { type: 'bird', label: 'Vogel' },
  { type: 'dragon', label: 'Drache' },
  { type: 'fox', label: 'Fuchs' },
  { type: 'rabbit', label: 'Hase' },
  { type: 'panda', label: 'Panda' },
  { type: 'owl', label: 'Eule' },
  { type: 'penguin', label: 'Pinguin' },
  { type: 'axolotl', label: 'Axolotl' },
  { type: 'frog', label: 'Frosch' },
  { type: 'hedgehog', label: 'Igel' },
  { type: 'otter', label: 'Otter' },
  { type: 'capybara', label: 'Capybara' },
  { type: 'unicorn', label: 'Einhorn' },
  { type: 'bat', label: 'Fledermaus' },
];

const ALL_PET_TYPES: Pet['type'][] = SHOW_PET_TYPES.map((x) => x.type);

const NEW_ACCESSORY_IDS = [
  'bucketHat',
  'bowHeadband',
  'earmuffs',
  'paperCrown',
  'daisyClip',
  'fez',
  'sombrero',
  'bobbleHat',
  'sailorCap',
  'flatCap',
  'clapperHat',
  'pineappleHat',
  'gamerHeadset',
  'sakuraBranch',
  'knightHelmet',
  'pharaohCrown',
  'ufoHat',
  'stormCloud',
  'sunCrown',
  'saturnRing',
  'freckles',
  'bandaid',
  'catWhiskers',
  'sleepMask',
  'pacifier',
  'swirlGlasses',
  'cinemaGlasses',
  'catEyeGlasses',
  'starFacePaint',
  'bubbleGum',
  'tigerStripes',
  'roseBite',
  'sparkleEyes',
  'cyberMonocle',
  'masqueradeMask',
  'rainbowCheeks',
  'ledVisor',
  'phantomMask',
  'fireBreath',
  'galaxyGlasses',
  'bibNapkin',
  'nameTag',
  'beadNecklace',
  'balloon',
  'stripedSweater',
  'fannyPack',
  'hawaiiShirt',
  'lifeVest',
  'cameraStrap',
  'ticketNecklace',
  'spikedCollar',
  'tuxedo',
  'featherBoa',
  'butterflyWings',
  'duckFloat',
  'angelWings',
  'knightArmor',
  'lanternNecklace',
  'jetpack',
  'starOrbit',
];

const NEW_BACKGROUND_IDS = EXTRA_SCENES.map((x) => x.id);

function makePet(type: Pet['type'], level: number, extras: Partial<Pet> = {}): Pet {
  return {
    id: `dev-${type}-${level}`,
    userId: 'dev',
    name: 'Preview',
    type,
    color: petSignatureColor(type),
    level,
    experience: 0,
    hunger: 10,
    happiness: 95,
    lastFed: new Date(),
    episodesWatched: 0,
    createdAt: new Date(),
    isAlive: true,
    ...extras,
  };
}

function makeAccessory(id: string): PetAccessory {
  const def = ACCESSORIES[id];
  return { id, type: def.slot, name: def.name, icon: def.icon, equipped: true };
}

const cellStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: 8,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const capStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.65)',
  textAlign: 'center',
};

const gridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const headingStyle: React.CSSProperties = {
  margin: '28px 0 12px',
  fontSize: 18,
};

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 14,
};

export const DevPetPreviewPage: React.FC = () => {
  const themeCtx = useContext(ThemeContext);
  const query = new URLSearchParams(window.location.search);
  const accOnly = query.has('acc');
  const [accType, setAccType] = useState<Pet['type']>((query.get('acc') as Pet['type']) || 'owl');
  const [accLevel, setAccLevel] = useState(Number(query.get('lv')) || 25);
  const [bgType, setBgType] = useState<Pet['type']>('axolotl');
  const [animated, setAnimated] = useState(!accOnly);
  const [onlyNew, setOnlyNew] = useState(false);

  const slotFilter = query.get('slot');
  const from = Number(query.get('from')) || 0;
  const pickedIds = query.get('ids')?.split(',');
  const accessoryIds = (pickedIds ?? (onlyNew ? NEW_ACCESSORY_IDS : Object.keys(ACCESSORIES)))
    .filter((id) => !slotFilter || ACCESSORIES[id].slot === slotFilter)
    .slice(from, from + (Number(query.get('n')) || 999));

  const noSeason = themeCtx && {
    ...themeCtx,
    userConfig: {
      ...themeCtx.userConfig,
      seasons: { spooky: false, christmas: false, newyear: false, valentine: false } as const,
    },
  };

  const petsParam = query.get('pets');
  if (petsParam) {
    const levels = (query.get('lv') || '1,10,25,60').split(',').map(Number);
    const colorKey = query.get('color');
    return (
      <ThemeContext.Provider value={noSeason || themeCtx}>
        <div
          style={{
            padding: 12,
            color: '#fff',
            background: query.get('bg') || '#1b1420',
            ...gridStyle,
          }}
        >
          {petsParam.split(',').flatMap((type) =>
            levels.map((level) => (
              <div key={`${type}-${level}`} style={cellStyle}>
                <EvolvingPixelPet
                  pet={makePet(
                    type as Pet['type'],
                    level,
                    colorKey ? { color: colorKey } : undefined
                  )}
                  size={Number(query.get('size')) || 256}
                  animated={false}
                />
                <span style={capStyle}>
                  {type} Lv{level}
                </span>
              </div>
            ))
          )}
        </div>
      </ThemeContext.Provider>
    );
  }

  const bgParam = query.get('bgs');
  if (bgParam) {
    const ids = bgParam === 'new' ? NEW_BACKGROUND_IDS : bgParam.split(',');
    const cell = Number(query.get('size')) || 300;
    // room=1: Pet steht wie auf der Pet-Seite unten (Füße 24px über dem Rand), Zelle w×h
    const room = query.has('room');
    const roomW = Number(query.get('w')) || 350;
    const roomH = Number(query.get('h')) || 300;
    const petSize = room ? 120 : Math.round(cell * 0.6);
    return (
      <ThemeContext.Provider value={noSeason || themeCtx}>
        <div style={{ padding: 12, color: '#fff', background: '#1b1420', ...gridStyle }}>
          {ids
            .slice(from, from + (Number(query.get('n')) || 999))
            .filter((id) => PET_BACKGROUNDS[id])
            .map((id) => (
              <div
                key={id}
                style={{ ...cellStyle, padding: 0, overflow: 'hidden', width: room ? roomW : cell }}
              >
                <div
                  className="pet-card-display"
                  style={{
                    background: PET_BACKGROUNDS[id].background,
                    width: room ? roomW : cell,
                    height: room ? roomH : cell,
                    minWidth: 0,
                    minHeight: 0,
                    boxSizing: 'border-box',
                    borderRadius: 0,
                    ...(room ? { padding: 0, alignItems: 'flex-end' } : {}),
                  }}
                >
                  <div
                    className="pet-card-pet-wrapper"
                    style={room ? { marginBottom: 24 - petSize * (1 - 26.3 / 32) } : undefined}
                  >
                    <EvolvingPixelPet
                      pet={makePet((query.get('pet') as Pet['type']) || 'otter', 25)}
                      size={petSize}
                      animated={false}
                    />
                  </div>
                </div>
                <span style={{ ...capStyle, padding: '4px 0 8px' }}>
                  {PET_BACKGROUNDS[id].name} — {id} ({PET_BACKGROUNDS[id].rarity})
                </span>
              </div>
            ))}
        </div>
      </ThemeContext.Provider>
    );
  }

  if (accOnly) {
    return (
      <ThemeContext.Provider value={noSeason || themeCtx}>
        <div style={{ padding: 12, color: '#fff', background: '#1b1420', ...gridStyle }}>
          {(query.get('acc') || accType).split(',').flatMap((type) =>
            accessoryIds.map((id) => (
              <div key={`${type}-${id}`} style={cellStyle}>
                <EvolvingPixelPet
                  pet={makePet(type as Pet['type'], accLevel, {
                    accessories: id.split('+').map(makeAccessory),
                  })}
                  size={Number(query.get('size')) || 220}
                  animated={false}
                />
                <span style={capStyle}>
                  {type} {id}
                </span>
              </div>
            ))
          )}
        </div>
      </ThemeContext.Provider>
    );
  }
  const backgroundIds = onlyNew ? NEW_BACKGROUND_IDS : Object.keys(PET_BACKGROUNDS);

  return (
    <div style={{ padding: '16px 16px 80px', color: '#fff' }}>
      <h1 style={{ fontSize: 22, margin: '8px 0' }}>Pet-Preview (Dev)</h1>
      <p style={{ ...capStyle, textAlign: 'left', maxWidth: 640 }}>
        Neue Inhalte im Winter 2026: 6 neue Pets, 60 Accessoires, 40 Hintergründe. Diese Seite ist
        nur im Dev-Server erreichbar.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ ...capStyle, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={animated}
            onChange={(e) => setAnimated(e.target.checked)}
          />
          Animationen
        </label>
        <label style={{ ...capStyle, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          Nur neue Inhalte
        </label>
      </div>

      <h2 style={headingStyle}>Alle Pets im neuen Look (Lv 1 / 25 / 60)</h2>
      {SHOW_PET_TYPES.map(({ type, label }) => (
        <div key={type} style={{ ...gridStyle, marginBottom: 10 }}>
          {[1, 25, 60].map((level) => (
            <div key={level} style={cellStyle}>
              <EvolvingPixelPet pet={makePet(type, level)} size={140} animated={animated} />
              <span style={capStyle}>
                {label} Lv{level}
              </span>
            </div>
          ))}
        </div>
      ))}

      <h2 style={headingStyle}>Accessoires ({accessoryIds.length})</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <select
          value={accType}
          onChange={(e) => setAccType(e.target.value as Pet['type'])}
          style={selectStyle}
        >
          {ALL_PET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={accLevel}
          onChange={(e) => setAccLevel(Number(e.target.value))}
          style={selectStyle}
        >
          {[1, 25, 60].map((l) => (
            <option key={l} value={l}>
              Lv{l}
            </option>
          ))}
        </select>
      </div>
      <div style={gridStyle}>
        {accessoryIds.map((id) => (
          <div key={id} style={cellStyle}>
            <EvolvingPixelPet
              pet={makePet(accType, accLevel, { accessories: [makeAccessory(id)] })}
              size={120}
              animated={animated}
            />
            <span style={capStyle}>
              {ACCESSORIES[id].name}
              <br />
              {id} ({ACCESSORIES[id].rarity})
            </span>
          </div>
        ))}
      </div>

      <h2 style={headingStyle}>Hintergruende ({backgroundIds.length})</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <select
          value={bgType}
          onChange={(e) => setBgType(e.target.value as Pet['type'])}
          style={selectStyle}
        >
          {ALL_PET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div style={gridStyle}>
        {backgroundIds.map((id) => {
          const def = PET_BACKGROUNDS[id];
          return (
            <div key={id} style={{ ...cellStyle, padding: 0, overflow: 'hidden', width: 200 }}>
              <div
                className={`pet-card-display${def.animationClass ? ` ${def.animationClass}` : ''}`}
                style={{ background: def.background, width: 200, height: 200 }}
              >
                {def.glowColor && (
                  <div
                    className="pet-card-glow"
                    style={{
                      background: `radial-gradient(circle, ${def.glowColor}, transparent 70%)`,
                    }}
                  />
                )}
                <div className="pet-card-pet-wrapper">
                  <EvolvingPixelPet
                    pet={makePet(bgType, 25, { equippedBackground: id })}
                    size={120}
                    animated={animated}
                  />
                </div>
              </div>
              <span style={{ ...capStyle, padding: '4px 0 8px' }}>
                {def.name} — {id} ({def.rarity})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
