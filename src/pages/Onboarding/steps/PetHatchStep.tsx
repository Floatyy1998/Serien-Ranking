import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { EvolvingPixelPet } from '../../../components/pet';
import { t } from '../../../services/i18n';
import type { Pet } from '../../../types/pet.types';

interface Props {
  name: string;
  type: Pet['type'];
  onNameChange: (name: string) => void;
  onTypeChange: (type: Pet['type']) => void;
  onNext: () => void;
  onBack: () => void;
}

const TYPES: { type: Pet['type']; label: string }[] = [
  { type: 'cat', label: 'Katze' },
  { type: 'dog', label: 'Hund' },
  { type: 'fox', label: 'Fuchs' },
  { type: 'rabbit', label: 'Hase' },
  { type: 'panda', label: 'Panda' },
  { type: 'bird', label: 'Vogel' },
  { type: 'dragon', label: 'Drache' },
];

function previewPet(type: Pet['type'], name: string): Pet {
  return {
    id: `preview-${type}`,
    userId: 'preview',
    name: name || 'Buddy',
    type,
    color: 'grau',
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

      {/* Hero: echtes Pixel-Pet auf einer Lichtbühne */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          minHeight: 176,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 6,
            width: 190,
            height: 34,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, color-mix(in srgb, var(--ob-paper) 45%, transparent) 0%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
        <motion.div
          key={type}
          initial={{ scale: 0.7, y: 14, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <EvolvingPixelPet pet={heroPet} size={150} animated />
        </motion.div>
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
            return (
              <button
                key={x.type}
                onClick={() => onTypeChange(x.type)}
                title={t(x.label)}
                aria-label={t(x.label)}
                aria-pressed={active}
                style={{
                  flexShrink: 0,
                  width: 74,
                  height: 74,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  cursor: 'pointer',
                  background: active
                    ? 'color-mix(in srgb, var(--ob-paper) 14%, var(--ob-stage-2))'
                    : 'var(--ob-stage-2)',
                  border: `1px solid ${active ? 'var(--ob-paper)' : 'var(--ob-line)'}`,
                  boxShadow: active
                    ? '0 10px 30px color-mix(in srgb, var(--ob-paper) 22%, transparent)'
                    : 'none',
                  transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
                }}
              >
                <EvolvingPixelPet pet={previewPet(x.type, '')} size={52} animated={false} />
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
