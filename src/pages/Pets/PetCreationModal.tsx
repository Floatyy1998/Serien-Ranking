import { ArrowBack, Casino } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { EvolvingPixelPet } from '../../components/pet';
import {
  PET_COLOR_LABELS,
  PET_SIGNATURES,
  petSignatureColor,
} from '../../components/pet/data/petSignature';
import { BackButton, IconButton } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/ui/useReducedMotion';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { PET_COLORS } from '../../types/pet.types';
import type { Pet } from '../../types/pet.types';
import './PetCreation.css';

interface PetCreationModalProps {
  petName: string;
  selectedType: Pet['type'];
  selectedColor?: string;
  onNameChange: (name: string) => void;
  onTypeChange: (type: Pet['type']) => void;
  onColorChange?: (color: string) => void;
  onCreatePet: () => void | Promise<void>;
  /** Zurück zum vorhandenen Pet; ohne Wert führt Zurück aus der Seite heraus. */
  onCancel?: () => void;
}

const NAME_MAX = 20;
const HATCH_MS = 1700;
const SPARKS = Array.from({ length: 12 }, (_, i) => i);
const BURST = Array.from({ length: 16 }, (_, i) => i);

function previewPet(type: Pet['type'], color: string, name: string): Pet {
  return {
    id: `preview-${type}`,
    userId: 'preview',
    name: name || 'Buddy',
    type,
    color,
    level: 1,
    experience: 0,
    hunger: 10,
    happiness: 95,
    lastFed: new Date(0),
    createdAt: new Date(0),
    episodesWatched: 0,
    isAlive: true,
    mood: 'happy',
  } as Pet;
}

function useWideLayout(): boolean {
  const query = '(min-width: 960px)';
  const [wide, setWide] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return wide;
}

export const PetCreationModal = memo(function PetCreationModal({
  petName,
  selectedType,
  selectedColor,
  onNameChange,
  onTypeChange,
  onColorChange,
  onCreatePet,
  onCancel,
}: PetCreationModalProps) {
  const { currentTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const wide = useWideLayout();
  const [hatching, setHatching] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const colorKey = selectedColor ?? petSignatureColor(selectedType);
  const heroHex = PET_COLORS[colorKey] ?? PET_COLORS.blau;
  const trimmed = petName.trim();
  const nameEmpty = trimmed.length === 0;
  const typeLabel = PET_SIGNATURES.find((x) => x.type === selectedType)?.label ?? '';
  const heroPet = useMemo(
    () => previewPet(selectedType, colorKey, trimmed),
    [selectedType, colorKey, trimmed]
  );
  const ctaText = getOptimalTextColor(currentTheme.primary);

  const vars = {
    '--hero': heroHex,
    '--pcx-bg': currentTheme.background.default,
    '--pcx-surface': currentTheme.background.surface,
    '--pcx-border': currentTheme.border.default,
    '--pcx-text': currentTheme.text.secondary,
    '--pcx-muted': currentTheme.text.muted,
    '--pcx-primary': currentTheme.primary,
    '--pcx-accent': currentTheme.accent,
    '--pcx-cta-text': ctaText,
  } as CSSProperties;

  const hatch = async () => {
    if (nameEmpty || hatching) return;
    if (reduceMotion) {
      await onCreatePet();
      return;
    }
    setHatching(true);
    await new Promise((resolve) => setTimeout(resolve, HATCH_MS));
    try {
      await onCreatePet();
    } finally {
      if (mounted.current) setHatching(false);
    }
  };

  const surprise = () => {
    const others = PET_SIGNATURES.filter((x) => x.type !== selectedType);
    const next = others[Math.floor(Math.random() * others.length)];
    onTypeChange(next.type);
    const colors = Object.keys(PET_COLORS);
    onColorChange?.(colors[Math.floor(Math.random() * colors.length)]);
  };

  const heroSize = wide ? 256 : 192;

  return (
    <div className="pcx" style={vars}>
      <div className="pcx-ambient" aria-hidden>
        <AnimatePresence>
          <motion.div
            key={colorKey}
            className="pcx-ambient__hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>
        <div className="pcx-ambient__grid" />
      </div>

      <header className="pcx-top">
        {onCancel ? (
          <IconButton
            icon={<ArrowBack style={{ fontSize: '20px' }} />}
            onClick={onCancel}
            size={40}
            borderRadius="14px"
            variant="glass"
            ariaLabel={t('Zurück')}
            tooltip={t('Zurück')}
          />
        ) : (
          <BackButton />
        )}
        <span className="pcx-kicker">{t('dein Begleiter')}</span>
      </header>

      <main className="pcx-layout">
        <section className="pcx-stage" aria-hidden>
          <div className="pcx-core">
            <div className="pcx-core__halo" />
            <div className="pcx-core__ring" />
            <div className="pcx-core__ring pcx-core__ring--inner" />
            <div className="pcx-core__floor" />
            <div className="pcx-core__sparks">
              {SPARKS.map((i) => (
                <span key={i} style={{ '--i': i } as CSSProperties} />
              ))}
            </div>
            <motion.div
              key={`${selectedType}-${colorKey}`}
              className="pcx-core__pet"
              initial={reduceMotion ? false : { scale: 0.55, y: 28, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 16 }}
            >
              <EvolvingPixelPet pet={heroPet} size={heroSize} animated />
            </motion.div>
          </div>
          <div className="pcx-plate">
            <span className={`pcx-plate__name${nameEmpty ? ' is-empty' : ''}`}>
              {nameEmpty ? '· · ·' : trimmed}
            </span>
            <span className="pcx-plate__meta">
              {`${t(typeLabel)} · ${t(PET_COLOR_LABELS[colorKey] ?? 'Blau')}`}
            </span>
          </div>
        </section>

        <section className="pcx-panel">
          <div className="pcx-head">
            <h1 className="pcx-title">{t('Erschaffe dein Pet!')}</h1>
            <p className="pcx-sub">
              {t(
                'Er levelt mit jeder Folge, die du schaust. Gib ihm einen Namen und eine Gestalt.'
              )}
            </p>
          </div>

          <label className="pcx-name">
            <input
              type="text"
              value={petName}
              maxLength={NAME_MAX}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void hatch();
              }}
              placeholder={t('Pet Name...')}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="pcx-name__count">
              {petName.length}/{NAME_MAX}
            </span>
          </label>

          <div className="pcx-block">
            <div className="pcx-block__head">
              <span className="pcx-label">{t('Gestalt')}</span>
              <button type="button" className="pcx-dice" onClick={surprise}>
                <Casino style={{ fontSize: 16 }} />
                {t('Überrasch mich')}
              </button>
            </div>
            <div className="pcx-tiles">
              {PET_SIGNATURES.map((x) => {
                const active = x.type === selectedType;
                const tileColor = active ? colorKey : x.color;
                return (
                  <button
                    key={x.type}
                    type="button"
                    className={`pcx-tile${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => onTypeChange(x.type)}
                    style={{ '--tile': PET_COLORS[tileColor] } as CSSProperties}
                  >
                    <EvolvingPixelPet
                      pet={previewPet(x.type, tileColor, '')}
                      size={64}
                      animated={active}
                    />
                    <span className="pcx-tile__label">{t(x.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {onColorChange && (
            <div className="pcx-block">
              <div className="pcx-block__head">
                <span className="pcx-label">{t('Farbe')}</span>
              </div>
              <div className="pcx-swatches">
                {Object.entries(PET_COLORS).map(([key, hex]) => (
                  <button
                    key={key}
                    type="button"
                    className={`pcx-swatch${key === colorKey ? ' is-active' : ''}`}
                    aria-pressed={key === colorKey}
                    aria-label={t('Farbe {name}', { name: t(PET_COLOR_LABELS[key] ?? key) })}
                    title={t(PET_COLOR_LABELS[key] ?? key)}
                    onClick={() => onColorChange(key)}
                    style={{ '--sw': hex } as CSSProperties}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pcx-cta-wrap">
            <button
              type="button"
              className="pcx-cta"
              onClick={() => void hatch()}
              disabled={nameEmpty || hatching}
            >
              <span>{t('Pet erschaffen!')}</span>
              <span className="pcx-cta__arrow" aria-hidden>
                →
              </span>
            </button>
            <span className={`pcx-hint${nameEmpty ? '' : ' is-hidden'}`}>
              {t('gib ihm einen namen')}
            </span>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {hatching && (
          <motion.div
            className="pcx-hatch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="status"
          >
            <div className="pcx-hatch__rays" />
            <div className="pcx-hatch__flash" />
            <div className="pcx-hatch__rings">
              <span />
              <span />
              <span />
            </div>
            <div className="pcx-hatch__burst">
              {BURST.map((i) => (
                <span key={i} style={{ '--i': i } as CSSProperties} />
              ))}
            </div>
            <motion.div
              className="pcx-hatch__pet"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.18, 1], opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.25, times: [0, 0.65, 1] }}
            >
              <EvolvingPixelPet pet={heroPet} size={wide ? 352 : 256} animated />
            </motion.div>
            <motion.p
              className="pcx-hatch__text"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
            >
              {t('{name} ist geschlüpft!', { name: trimmed })}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
