import { useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { Section, SectionTitle } from './Section';

const COLLAPSED = 30;

interface VolumeShelfProps {
  current: number;
  /** 0 = Gesamtzahl unbekannt — dann bis zum nächsten Band. */
  total: number;
  currentTheme: ThemeContextType['currentTheme'];
  onChange: (volume: number) => void;
}

/** Zählweise Bände: jeder Band eine Kachel — antippen hakt bis dorthin ab. */
export const VolumeShelf = ({ current, total, currentTheme, onChange }: VolumeShelfProps) => {
  const [confirm, setConfirm] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const count = Math.max(total, current + (total > 0 ? 0 : 1));
  const shown = showAll ? count : Math.min(count, Math.max(COLLAPSED, current + 6));
  const volumes = Array.from({ length: shown }, (_, i) => i + 1);

  return (
    // Mobil vor „Lesestatus": für Print-Leser ist das die Hauptsteuerung.
    <Section delay={0.08} order={1}>
      <SectionTitle
        action={
          total > 0 ? (
            <span className="md-hint" style={{ margin: 0, color: currentTheme.text.muted }}>
              {t('{a} von {b} gelesen', { a: current, b: total })}
            </span>
          ) : undefined
        }
      >
        {t('Deine Bände')}
      </SectionTitle>
      <div className="md-volumes">
        {volumes.map((n) => {
          const read = n <= current;
          return (
            <button
              key={n}
              type="button"
              className={`md-volume ${read ? 'md-volume--read' : ''} ${n === current + 1 ? 'md-volume--next' : ''}`}
              aria-pressed={read}
              aria-label={
                read
                  ? t('Band {n} als ungelesen markieren', { n })
                  : t('Bis Band {n} als gelesen markieren', { n })
              }
              onClick={() => {
                if (read) setConfirm(n);
                else {
                  setConfirm(null);
                  onChange(n);
                }
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {confirm !== null && (
        <div className="md-volumes-confirm">
          <span style={{ color: currentTheme.text.secondary }}>
            {confirm === current
              ? t('Band {n} als ungelesen markieren?', { n: confirm })
              : t('Ab Band {n} als ungelesen markieren?', { n: confirm })}
          </span>
          <button
            type="button"
            className="manga-chapter-confirm-btn"
            onClick={() => {
              onChange(confirm - 1);
              setConfirm(null);
            }}
            style={{ background: 'var(--theme-primary-15)', color: currentTheme.primary }}
          >
            {t('Ja')}
          </button>
          <button
            type="button"
            className="manga-chapter-confirm-btn"
            onClick={() => setConfirm(null)}
            style={{ background: 'var(--glass-light)', color: currentTheme.text.secondary }}
          >
            {t('Nein')}
          </button>
        </div>
      )}
      {shown < count && (
        <button
          type="button"
          className="md-volumes-more"
          onClick={() => setShowAll(true)}
          style={{ color: currentTheme.primary }}
        >
          {t('Alle {n} Bände zeigen', { n: count })}
        </button>
      )}
    </Section>
  );
};
