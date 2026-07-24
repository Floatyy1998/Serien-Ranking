import type React from 'react';
import { useState } from 'react';
import { EvolvingPixelPet } from '../../components/pet/EvolvingPixelPet';
import { ACCESSORIES } from '../../components/pet/data/accessories';
import { PET_BACKGROUNDS } from '../../components/pet/data/petBackgrounds';
import type { Pet, PetAccessory } from '../../types/pet.types';
import '../Pets/PetsPage.css';

// Dev-only Vorschau der Pet-Inhalte vom Juli-2026-Drop (nur im Dev-Server geroutet).

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
];

const ALL_PET_TYPES: Pet['type'][] = [
  'cat',
  'dog',
  'bird',
  'dragon',
  'fox',
  'rabbit',
  'panda',
  'owl',
  'penguin',
  'axolotl',
];

const NEW_ACCESSORY_IDS = [
  'sproutHat',
  'popcornHat',
  'propellerCap',
  'jesterHat',
  'detectiveHat',
  'winterCrown',
  'divingHelmet',
  'crystalHorns',
  'jellyfishCrown',
  'galaxyCrown',
  'eyepatch',
  'blushStickers',
  'mustache',
  'discoShades',
  'snorkelMask',
  'goldenEyelashes',
  'vrHeadset',
  'kitsuneMask',
  'thirdEye',
  'moonVisor',
  'woolScarf',
  'leafCape',
  'seaweedScarf',
  'headphonesNeck',
  'pearlNecklace',
  'filmstripScarf',
  'discoChain',
  'lavaAmulet',
  'auroraScarf',
  'krakenCharm',
];

const NEW_BACKGROUND_IDS = [
  'birchForest',
  'duneGrass',
  'streetCafe',
  'koiPond',
  'driveInCinema',
  'neonArcade',
  'tuscanHills',
  'frozenLake',
  'homeCinema',
  'observatory',
  'jellyfishDepths',
  'redCarpet',
  'bonsaiRoom',
  'filmSet',
  'floatingIslands',
  'dragonPeaks',
  'neonTokyo',
  'premiereNight',
  'worldTree',
  'nebulaOcean',
];

const TYPE_COLORS: Record<string, string> = {
  cat: '#ffb74d',
  dog: '#a1887f',
  bird: '#4fc3f7',
  dragon: '#9575cd',
  fox: '#ff8a65',
  rabbit: '#f8bbd0',
  panda: '#eceff1',
  owl: '#8d6e63',
  penguin: '#455a64',
  axolotl: '#f48fb1',
};

function makePet(type: Pet['type'], level: number, extras: Partial<Pet> = {}): Pet {
  return {
    id: `dev-${type}-${level}`,
    userId: 'dev',
    name: 'Preview',
    type,
    color: TYPE_COLORS[type],
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
  const [accType, setAccType] = useState<Pet['type']>('owl');
  const [accLevel, setAccLevel] = useState(25);
  const [bgType, setBgType] = useState<Pet['type']>('axolotl');
  const [animated, setAnimated] = useState(true);
  const [onlyNew, setOnlyNew] = useState(false);

  const accessoryIds = onlyNew ? NEW_ACCESSORY_IDS : Object.keys(ACCESSORIES);
  const backgroundIds = onlyNew ? NEW_BACKGROUND_IDS : Object.keys(PET_BACKGROUNDS);

  return (
    <div style={{ padding: '16px 16px 80px', color: '#fff' }}>
      <h1 style={{ fontSize: 22, margin: '8px 0' }}>Pet-Preview (Dev)</h1>
      <p style={{ ...capStyle, textAlign: 'left', maxWidth: 640 }}>
        Neue Inhalte: 3 neue Pets, Kawaii-Redesign der 7 alten Pets, 30 Accessoires, 20
        Hintergruende. Diese Seite ist nur im Dev-Server erreichbar.
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
