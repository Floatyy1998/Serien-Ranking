/** Garderobe: Accessoires nach Platz, Hintergründe als Szenen, Farben am eigenen Pet. */

import { AutoAwesome, Check, Close, Lock } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useMemo, useState } from 'react';
import { ACCESSORIES, getAccessoryRarity } from '../../components/pet/data/accessories';
import { PET_BACKGROUNDS } from '../../components/pet/data/petBackgrounds';
import {
  OUTFIT_SLOTS,
  nextOutfitUnlock,
  outfitCapacity,
  slotOf,
  wornAccessories,
} from '../../components/pet/outfit';
import { accessoryThumb, petPortrait } from '../../components/pet/pixelThumbs';
import { SEASON_HAT_ID } from '../../components/pet/seasonCostume';
import { useTheme } from '../../contexts/ThemeContext';
import { useActiveSeason } from '../../hooks/pet/useActiveSeason';
import { hapticTap, hapticWarning } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';
import type { SeasonId } from '../../theme/seasonalThemes';
import { PET_COLORS, RARITY_COLORS, RARITY_LABELS } from '../../types/pet.types';
import type { AccessoryRarity, AccessorySlot, Pet, PetAccessory } from '../../types/pet.types';
import './PetsPage.css';

interface PetCustomizationProps {
  pet: Pet;
  activeColorBorder: string | null;
  onChangeColor: (color: string) => void;
  /** false, wenn kein Platz mehr frei ist. */
  onToggleAccessory: (accessoryId: string) => boolean;
  onEquipBackground: (backgroundId: string | null) => void;
}

type Tab = 'accessories' | 'backgrounds' | 'colors';

const RARITY_ORDER: AccessoryRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

const SLOT_LABEL: Record<AccessorySlot, string> = {
  head: 'Kopf',
  face: 'Gesicht',
  neck: 'Körper',
};

/** Blasse Platzhalter-Form für einen leeren Platz. */
const SLOT_GHOST: Record<AccessorySlot, string> = {
  head: 'beanie',
  face: 'roundGlasses',
  neck: 'bow',
};

const SEASON_LABEL: Record<SeasonId, string> = {
  spooky: 'Halloween',
  christmas: 'Weihnachten',
  newyear: 'Neujahr',
  valentine: 'Valentinstag',
};

const COLOR_LABEL: Record<string, string> = {
  rot: 'Rot',
  blau: 'Blau',
  gruen: 'Grün',
  lila: 'Lila',
  gelb: 'Gelb',
  rosa: 'Rosa',
  orange: 'Orange',
  tuerkis: 'Türkis',
};

const FULL_OUTFIT = '#f5b942';

const panelMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: 'easeOut' as const },
};

function sortByRarity<T>(
  items: T[],
  rarityOf: (item: T) => AccessoryRarity,
  nameOf: (item: T) => string
): T[] {
  return [...items].sort(
    (a, b) =>
      RARITY_ORDER.indexOf(rarityOf(a)) - RARITY_ORDER.indexOf(rarityOf(b)) ||
      nameOf(a).localeCompare(nameOf(b))
  );
}

/** Lange Einzelwörter wie „Heiligenschein" bekommen eine kleinere Schrift statt eines Bruchs. */
const longWord = (name: string) => Math.max(...name.split(/[\s-]/).map((w) => w.length)) > 11;

function Pixel({ src, className }: { src: string; className: string }) {
  if (!src) return null;
  return <img src={src} alt="" className={className} draggable={false} />;
}

export const PetCustomization = memo(function PetCustomization({
  pet,
  activeColorBorder,
  onChangeColor,
  onToggleAccessory,
  onEquipBackground,
}: PetCustomizationProps) {
  const { currentTheme } = useTheme();
  const season = useActiveSeason();
  const [activeTab, setActiveTab] = useState<Tab>('accessories');

  const owned = useMemo(
    () => (pet.accessories || []).filter((a) => a && ACCESSORIES[a.id]),
    [pet.accessories]
  );
  const worn = wornAccessories(pet);
  const capacity = outfitCapacity(pet.level);
  const backgrounds = (pet.unlockedBackgrounds || []).filter((id) => PET_BACKGROUNDS[id]);

  const tabs: { id: Tab; label: string; meta: string }[] = [
    {
      id: 'accessories',
      label: t('Accessoires'),
      meta: t('{n} von {total} getragen', { n: worn.length, total: capacity }),
    },
    {
      id: 'backgrounds',
      label: t('Hintergründe'),
      meta: t('{n} gesammelt', { n: backgrounds.length }),
    },
    {
      id: 'colors',
      label: t('Farben'),
      meta: t(COLOR_LABEL[activeColorBorder || pet.color] ?? 'Blau'),
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="pet-customization"
      aria-label={t('Garderobe')}
    >
      <div
        className="pet-tabs"
        role="tablist"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`pet-tab${isActive ? ' pet-tab--active' : ''}`}
              style={{
                color: isActive ? currentTheme.text.primary : currentTheme.text.secondary,
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="pet-tab-indicator"
                  className="pet-tab-indicator"
                  style={{
                    background: currentTheme.background.default,
                    boxShadow: `0 2px 10px ${currentTheme.primary}25, 0 1px 3px rgba(0,0,0,0.15)`,
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="pet-tab-content">
                <span className="pet-tab-label">{tab.label}</span>
                <span
                  className="pet-tab-count"
                  style={{ color: isActive ? currentTheme.primary : currentTheme.text.muted }}
                >
                  {tab.meta}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="pet-tab-panels">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeTab} {...panelMotion} className="pet-tab-panel">
            {activeTab === 'accessories' && (
              <OutfitPanel
                pet={pet}
                owned={owned}
                worn={worn}
                season={season}
                onToggle={onToggleAccessory}
              />
            )}
            {activeTab === 'backgrounds' && (
              <ScenePanel
                pet={pet}
                season={season}
                backgrounds={backgrounds}
                onEquip={onEquipBackground}
              />
            )}
            {activeTab === 'colors' && (
              <ColorPanel
                pet={pet}
                season={season}
                active={activeColorBorder || pet.color}
                onChange={onChangeColor}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
});

function OutfitPanel({
  pet,
  owned,
  worn,
  season,
  onToggle,
}: {
  pet: Pet;
  owned: PetAccessory[];
  worn: PetAccessory[];
  season: SeasonId | null;
  onToggle: (accessoryId: string) => boolean;
}) {
  const { currentTheme } = useTheme();
  const [slot, setSlot] = useState<AccessorySlot>(() => {
    const first = worn[0] ? slotOf(worn[0].id) : null;
    return first ?? 'head';
  });
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(null), 4200);
    return () => clearTimeout(timer);
  }, [hint]);

  const capacity = outfitCapacity(pet.level);
  const next = nextOutfitUnlock(pet.level);
  const full = worn.length >= capacity;
  const complete = worn.length === OUTFIT_SLOTS.length;
  const wornIn = (s: AccessorySlot) => worn.find((a) => slotOf(a.id) === s);
  const costume = season && !wornIn('head') ? SEASON_HAT_ID[season] : null;
  const scene = pet.equippedBackground ? PET_BACKGROUNDS[pet.equippedBackground] : undefined;

  const inSlot = sortByRarity(
    owned.filter((a) => slotOf(a.id) === slot),
    (a) => getAccessoryRarity(a.id),
    (a) => ACCESSORIES[a.id]?.name ?? ''
  );
  const totalInSlot = Object.values(ACCESSORIES).filter((d) => d.slot === slot).length;

  const toggle = (id: string) => {
    if (onToggle(id)) {
      hapticTap();
      setHint(null);
      return;
    }
    hapticWarning();
    setHint(
      next
        ? t(
            '{name} trägt schon {n} Teile. Ab Lv {level} passt eins mehr, bis dahin erst etwas ablegen.',
            { name: pet.name, n: worn.length, level: next }
          )
        : t('Erst etwas ablegen.')
    );
  };

  const capacityText = complete
    ? t('Volles Outfit')
    : capacity === 1 && next
      ? t('Lv {level}: ein Teil gleichzeitig, ab Lv {next} zwei', { level: pet.level, next })
      : next
        ? t('Lv {level}: zwei Teile gleichzeitig, volles Outfit ab Lv {next}', {
            level: pet.level,
            next,
          })
        : t('Volles Outfit freigeschaltet: auf jedem Platz ein Teil');

  return (
    <>
      <div className="pet-outfit">
        <div
          className={`pet-outfit__preview${complete ? ' is-complete' : ''}`}
          style={{
            background: scene?.background ?? currentTheme.background.default,
            borderColor: complete ? FULL_OUTFIT : currentTheme.border.default,
            boxShadow: complete ? `0 0 18px ${FULL_OUTFIT}55` : 'none',
          }}
        >
          <Pixel src={petPortrait(pet, pet.color, season)} className="pet-outfit__pet" />
        </div>

        <div className="pet-slots" role="tablist" aria-label={t('Plätze')}>
          {OUTFIT_SLOTS.map((s) => {
            const item = wornIn(s);
            const def = item ? ACCESSORIES[item.id] : null;
            const seasonal = s === 'head' && costume ? costume : null;
            const locked = !item && !seasonal && full && capacity < OUTFIT_SLOTS.length;
            const active = s === slot;
            const color = def ? RARITY_COLORS[def.rarity] : currentTheme.border.default;
            return (
              <div key={s} className="pet-slot">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`pet-slot__pick${active ? ' is-active' : ''}`}
                  onClick={() => setSlot(s)}
                  style={{
                    background: active
                      ? `linear-gradient(160deg, ${currentTheme.primary}26, ${currentTheme.background.surface})`
                      : currentTheme.background.surface,
                    borderColor: active ? `${currentTheme.primary}b3` : currentTheme.border.default,
                  }}
                >
                  <span className="pet-slot__label" style={{ color: currentTheme.text.muted }}>
                    {t(SLOT_LABEL[s])}
                  </span>
                  <span
                    className="pet-slot__art"
                    style={{
                      background: item
                        ? `radial-gradient(circle at 50% 60%, ${color}38, transparent 70%)`
                        : undefined,
                    }}
                  >
                    {item ? (
                      <Pixel
                        src={accessoryThumb(item.id, pet.type, pet.level, item.color)}
                        className="pet-slot__img"
                      />
                    ) : seasonal ? (
                      <Pixel
                        src={accessoryThumb(seasonal, pet.type, pet.level)}
                        className="pet-slot__img"
                      />
                    ) : locked ? (
                      <Lock className="pet-slot__lock" style={{ color: currentTheme.text.muted }} />
                    ) : (
                      <Pixel
                        src={accessoryThumb(SLOT_GHOST[s], pet.type, pet.level)}
                        className="pet-slot__img pet-slot__img--ghost"
                      />
                    )}
                  </span>
                  <span
                    className="pet-slot__name"
                    style={{
                      color: item
                        ? currentTheme.text.primary
                        : seasonal
                          ? currentTheme.accent
                          : currentTheme.text.muted,
                    }}
                  >
                    {def
                      ? def.name
                      : seasonal && season
                        ? t(SEASON_LABEL[season])
                        : locked && next
                          ? t('ab Lv {level}', { level: next })
                          : t('Frei')}
                  </span>
                </button>
                {item && (
                  <button
                    type="button"
                    className="pet-slot__off"
                    aria-label={t('{name} ablegen', { name: def?.name ?? '' })}
                    onClick={() => toggle(item.id)}
                    style={{
                      background: currentTheme.background.default,
                      borderColor: currentTheme.border.default,
                      color: currentTheme.text.secondary,
                    }}
                  >
                    <Close />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`pet-capacity${complete ? ' is-complete' : ''}`}>
        {complete ? (
          <AutoAwesome className="pet-capacity__star" style={{ color: FULL_OUTFIT }} />
        ) : (
          <span className="pet-capacity__pips" aria-hidden="true">
            {OUTFIT_SLOTS.map((s, i) => (
              <span
                key={s}
                className={`pet-capacity__pip${i >= capacity ? ' is-locked' : ''}`}
                style={
                  i < worn.length
                    ? {
                        background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                        borderColor: 'transparent',
                      }
                    : {
                        borderColor:
                          i < capacity ? currentTheme.primary : currentTheme.border.default,
                      }
                }
              />
            ))}
          </span>
        )}
        <span className="pet-capacity__text">
          <span style={{ color: complete ? FULL_OUTFIT : currentTheme.text.secondary }}>
            {capacityText}
          </span>
          {costume && season && (
            <span className="pet-capacity__season" style={{ color: currentTheme.text.muted }}>
              {t('{season}-Hut, bis du selbst etwas aufsetzt', {
                season: t(SEASON_LABEL[season]),
              })}
            </span>
          )}
        </span>
      </div>

      <AnimatePresence>
        {hint && (
          <motion.p
            key="hint"
            className="pet-outfit-hint"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            role="status"
            style={{
              background: `${currentTheme.status?.warning || '#eab308'}1f`,
              borderColor: `${currentTheme.status?.warning || '#eab308'}55`,
              color: currentTheme.text.primary,
            }}
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="pet-shelf__head">
        <span className="pet-shelf__title" style={{ color: currentTheme.text.primary }}>
          {t(SLOT_LABEL[slot])}
        </span>
        <span className="pet-shelf__meta" style={{ color: currentTheme.text.muted }}>
          {t('{n} von {total} gefunden', { n: inSlot.length, total: totalInSlot })}
        </span>
      </div>

      {inSlot.length === 0 ? (
        <p className="pet-empty-state" style={{ color: currentTheme.text.secondary }}>
          {t('Für diesen Platz hast du noch nichts. Beim Schauen fallen neue Accessoires ab.')}
        </p>
      ) : (
        <div className="pet-items">
          {inSlot.map((a) => {
            const def = ACCESSORIES[a.id];
            const rarity = def.rarity;
            const on = worn.some((w) => w.id === a.id);
            const color = RARITY_COLORS[rarity];
            return (
              <button
                key={a.id}
                type="button"
                className={`pet-item${on ? ' is-on' : ''}`}
                aria-pressed={on}
                aria-label={`${def.name}, ${t(RARITY_LABELS[rarity])}`}
                title={`${def.name} · ${t(RARITY_LABELS[rarity])}`}
                onClick={() => toggle(a.id)}
                style={{
                  background: on
                    ? `linear-gradient(160deg, ${color}33, ${currentTheme.background.surface})`
                    : currentTheme.background.surface,
                  borderColor: on ? color : currentTheme.border.default,
                  boxShadow: on ? `0 6px 18px ${color}40` : 'none',
                }}
              >
                <span
                  className="pet-item__art"
                  style={{
                    background: `radial-gradient(circle at 50% 55%, ${color}30, transparent 68%)`,
                  }}
                >
                  <Pixel
                    src={accessoryThumb(a.id, pet.type, pet.level, a.color)}
                    className="pet-item__img"
                  />
                </span>
                <span
                  className={`pet-item__name${longWord(def.name) ? ' is-long' : ''}`}
                  style={{ color: currentTheme.text.primary }}
                >
                  {def.name}
                </span>
                <span className="pet-item__rarity" style={{ background: color }} />
                {on && (
                  <span className="pet-item__check" style={{ background: color }}>
                    <Check />
                  </span>
                )}
                {a.isNew && !on && (
                  <span
                    className="pet-item__new"
                    style={{
                      background: currentTheme.primary,
                      color: currentTheme.background.default,
                    }}
                  >
                    {t('NEU')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function ScenePanel({
  pet,
  season,
  backgrounds,
  onEquip,
}: {
  pet: Pet;
  season: SeasonId | null;
  backgrounds: string[];
  onEquip: (backgroundId: string | null) => void;
}) {
  const { currentTheme } = useTheme();
  const portrait = petPortrait(pet, pet.color, season);
  const sorted = sortByRarity(
    backgrounds,
    (id) => PET_BACKGROUNDS[id].rarity,
    (id) => PET_BACKGROUNDS[id].name
  );
  const none = !pet.equippedBackground || !PET_BACKGROUNDS[pet.equippedBackground];

  const equip = (id: string | null) => {
    hapticTap();
    onEquip(id);
  };

  return (
    <>
      <div className="pet-shelf__head">
        <span className="pet-shelf__title" style={{ color: currentTheme.text.primary }}>
          {t('Szenen')}
        </span>
        <span className="pet-shelf__meta" style={{ color: currentTheme.text.muted }}>
          {t('{n} von {total} gesammelt', {
            n: backgrounds.length,
            total: Object.keys(PET_BACKGROUNDS).length,
          })}
        </span>
      </div>

      <div className="pet-scenes">
        <SceneTile
          name={t('Ohne')}
          label={t('Ohne Hintergrund')}
          background={`radial-gradient(circle at 50% 35%, ${currentTheme.primary}26, transparent 65%), ${currentTheme.background.default}`}
          portrait={portrait}
          on={none}
          onClick={() => equip(null)}
        />
        {sorted.map((id) => {
          const def = PET_BACKGROUNDS[id];
          const on = pet.equippedBackground === id;
          return (
            <SceneTile
              key={id}
              name={def.name}
              label={`${def.name}, ${t(RARITY_LABELS[def.rarity])}`}
              background={def.background}
              overlay={def.overlay}
              animationClass={def.animationClass}
              accent={RARITY_COLORS[def.rarity]}
              portrait={portrait}
              on={on}
              onClick={() => equip(on ? null : id)}
            />
          );
        })}
      </div>

      {backgrounds.length === 0 && (
        <p className="pet-empty-state" style={{ color: currentTheme.text.secondary }}>
          {t('Öffne Mystery Boxen oder dreh das Glücksrad, um Hintergründe zu finden!')}
        </p>
      )}
    </>
  );
}

function SceneTile({
  name,
  label,
  background,
  overlay,
  animationClass,
  accent,
  portrait,
  on,
  onClick,
}: {
  name: string;
  label: string;
  background: string;
  overlay?: string;
  animationClass?: string;
  accent?: string;
  portrait: string;
  on: boolean;
  onClick: () => void;
}) {
  const { currentTheme } = useTheme();
  const ring = accent ?? currentTheme.primary;
  return (
    <button
      type="button"
      className={`pet-scene${on ? ' is-on' : ''}`}
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        background: currentTheme.background.surface,
        borderColor: on ? ring : currentTheme.border.default,
        boxShadow: on ? `0 6px 18px ${ring}45` : 'none',
      }}
    >
      <span
        className={`pet-scene__view${animationClass ? ` ${animationClass}` : ''}`}
        style={{ background }}
      >
        {overlay && <span className="pet-scene__overlay" style={{ background: overlay }} />}
        <Pixel src={portrait} className="pet-scene__pet" />
        {on && (
          <span className="pet-scene__check" style={{ background: ring }}>
            <Check />
          </span>
        )}
      </span>
      <span className="pet-scene__name" style={{ color: currentTheme.text.primary }}>
        {name}
      </span>
      {accent && <span className="pet-item__rarity" style={{ background: accent }} />}
    </button>
  );
}

function ColorPanel({
  pet,
  season,
  active,
  onChange,
}: {
  pet: Pet;
  season: SeasonId | null;
  active: string;
  onChange: (color: string) => void;
}) {
  const { currentTheme } = useTheme();
  return (
    <div className="pet-colors-grid">
      {Object.entries(PET_COLORS).map(([key, value]) => {
        const on = active === key;
        return (
          <button
            key={key}
            type="button"
            className={`pet-color-btn${on ? ' is-on' : ''}`}
            aria-label={t('Farbe {name}', { name: t(COLOR_LABEL[key] ?? key) })}
            aria-pressed={on}
            onClick={() => {
              hapticTap();
              onChange(key);
            }}
            style={{
              background: on
                ? `linear-gradient(160deg, ${value}40, ${currentTheme.background.surface})`
                : currentTheme.background.surface,
              borderColor: on ? value : currentTheme.border.default,
              boxShadow: on ? `0 6px 18px ${value}45` : 'none',
            }}
          >
            <span className="pet-color-btn__art">
              <Pixel src={petPortrait(pet, key, season)} className="pet-color-btn__img" />
            </span>
            <span className="pet-color-btn__name" style={{ color: currentTheme.text.primary }}>
              <span className="pet-color-btn__dot" style={{ background: value }} />
              {t(COLOR_LABEL[key] ?? key)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
