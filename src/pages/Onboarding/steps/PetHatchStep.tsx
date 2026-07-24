import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { EvolvingPixelPet } from '../../../components/pet';
import { t } from '../../../services/i18n';
import type { Pet } from '../../../types/pet.types';
import { PET_COLORS } from '../../../types/pet.types';

interface Props {
  name: string;
  type: Pet['type'];
  onNameChange: (name: string) => void;
  onTypeChange: (type: Pet['type']) => void;
  onNext: () => void;
  onBack: () => void;
}

// Signaturfarbe pro Gestalt (Key aus PET_COLORS) — die Auswahl wirkt dadurch
// wie ein Ensemble statt zehnmal dasselbe Pet in Teal.
const TYPES: { type: Pet['type']; label: string; color: string }[] = [
  { type: 'cat', label: 'Katze', color: 'orange' },
  { type: 'dog', label: 'Hund', color: 'gelb' },
  { type: 'fox', label: 'Fuchs', color: 'rot' },
  { type: 'rabbit', label: 'Hase', color: 'rosa' },
  { type: 'panda', label: 'Panda', color: 'gruen' },
  { type: 'bird', label: 'Vogel', color: 'tuerkis' },
  { type: 'dragon', label: 'Drache', color: 'lila' },
  { type: 'owl', label: 'Eule', color: 'orange' },
  { type: 'penguin', label: 'Pinguin', color: 'blau' },
  { type: 'axolotl', label: 'Axolotl', color: 'rosa' },
];

const typeColorKey = (type: Pet['type']): string =>
  TYPES.find((x) => x.type === type)?.color ?? 'blau';

function previewPet(type: Pet['type'], name: string): Pet {
  return {
    id: `preview-${type}`,
    userId: 'preview',
    name: name || 'Buddy',
    type,
    color: typeColorKey(type),
    level: 3,
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

export const PetHatchStep: React.FC<Props> = ({
  name,
  type,
  onNameChange,
  onTypeChange,
  onNext,
  onBack,
}) => {
  const heroPet = useMemo(() => previewPet(type, name), [type, name]);
  const nameEmpty = name.trim().length === 0;
  const heroHex = PET_COLORS[typeColorKey(type)] ?? PET_COLORS.blau;
  const heroLabel = TYPES.find((x) => x.type === type)?.label ?? '';

  return (
    <motion.div
      className="ob-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(18px, 4vw, 44px) clamp(20px, 5vw, 56px)',
        gap: 20,
        maxWidth: 620,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <button onClick={onBack} className="ob-link" style={{ padding: '6px 0', fontSize: 11 }}>
          {t('← zurück')}
        </button>
        <span className="ob-mono" style={{ color: 'var(--ob-text-mute)' }}>
          05 — {t('dein Begleiter')}
        </span>
      </div>

      {/* Hero: echtes Pixel-Pet auf einer Lichtbühne mit Farb-Aura der Gestalt */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: 208,
        }}
      >
        <motion.div
          aria-hidden
          key={`glow-${type}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            bottom: 18,
            width: 260,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at 50% 75%, ${heroHex}55 0%, ${heroHex}18 45%, transparent 72%)`,
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 30,
            width: 200,
            height: 34,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${heroHex}66 0%, transparent 70%)`,
            filter: 'blur(6px)',
          }}
        />
        <motion.div
          key={type}
          initial={{ scale: 0.7, y: 14, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <EvolvingPixelPet pet={heroPet} size={170} animated />
        </motion.div>
        <motion.span
          key={`tag-${type}-${nameEmpty}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="ob-mono"
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: 2,
            padding: '4px 12px',
            borderRadius: 999,
            border: `1px solid ${heroHex}88`,
            background: `color-mix(in srgb, ${heroHex} 16%, var(--ob-stage-2))`,
            color: 'var(--ob-paper)',
            fontSize: 11,
          }}
        >
          {nameEmpty ? t(heroLabel) : `${name.trim()} · ${t(heroLabel)}`}
        </motion.span>
      </div>

      <div>
        <h1
          className="ob-display"
          style={{ fontSize: 'clamp(34px, 8vw, 62px)', margin: 0, color: 'var(--ob-paper)' }}
        >
          {t('Dein Begleiter erwacht')}
        </h1>
        <p
          className="ob-mono"
          style={{
            marginTop: 10,
            color: 'var(--ob-text-mute)',
            fontSize: 12,
            textTransform: 'none',
            letterSpacing: '0.04em',
            fontFamily: 'var(--ob-font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
          }}
        >
          {t('Er levelt mit jeder Folge, die du schaust. Gib ihm einen Namen und eine Gestalt.')}
        </p>
      </div>

      <div className="ob-search">
        <input
          value={name}
          maxLength={20}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('Name deines Begleiters …')}
        />
      </div>

      {/* Gestalt-Auswahl: echte Sprites, kein Emoji */}
      <div>
        <span
          className="ob-mono"
          style={{ color: 'var(--ob-text-mute)', display: 'block', marginBottom: 10 }}
        >
          {t('Gestalt')}
        </span>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
          {TYPES.map((x) => {
            const active = type === x.type;
            const hex = PET_COLORS[x.color] ?? PET_COLORS.blau;
            return (
              <button
                key={x.type}
                onClick={() => onTypeChange(x.type)}
                title={t(x.label)}
                aria-label={t(x.label)}
                aria-pressed={active}
                style={{
                  flexShrink: 0,
                  width: 84,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '10px 0 8px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  background: active
                    ? `color-mix(in srgb, ${hex} 18%, var(--ob-stage-2))`
                    : 'var(--ob-stage-2)',
                  border: `1px solid ${active ? hex : 'var(--ob-line)'}`,
                  boxShadow: active ? `0 10px 30px ${hex}44` : 'none',
                  transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
                }}
              >
                <EvolvingPixelPet pet={previewPet(x.type, '')} size={56} animated={active} />
                <span
                  className="ob-mono"
                  style={{
                    fontSize: 9,
                    color: active ? 'var(--ob-paper)' : 'var(--ob-text-mute)',
                  }}
                >
                  {t(x.label)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onNext} disabled={nameEmpty} className="ob-cta">
        <span className="ob-cta__inner">
          <span>{t('weiter zur premiere')}</span>
          {nameEmpty && (
            <>
              <span style={{ opacity: 0.55, fontSize: 11 }}>·</span>
              <span style={{ opacity: 0.55, fontSize: 11 }}>{t('gib ihm einen namen')}</span>
            </>
          )}
        </span>
        <span className="ob-cta__arrow">→</span>
      </button>
    </motion.div>
  );
};
