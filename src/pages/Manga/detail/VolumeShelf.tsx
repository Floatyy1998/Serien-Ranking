import { Fragment, useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { Section, SectionTitle } from './Section';

const COLLAPSED = 30;

export type VolumeMode = 'read' | 'own';

export interface VolumeOwnership {
  /** Ganze Reihe im Regal, ohne einzeln gewählte Bände. */
  all: boolean;
  volumes: number[];
  onToggle: (volume: number, count: number) => void;
  onAll: (owned: boolean) => void;
}

interface VolumeShelfProps {
  current: number;
  /** 0 = Gesamtzahl unbekannt — dann bis zum nächsten Band. */
  total: number;
  currentTheme: ThemeContextType['currentTheme'];
  /** Fehlt bei Kapitel-Zählweise — dann geht es nur um den Besitz. */
  onChange?: (volume: number) => void;
  ownership?: VolumeOwnership;
  mode?: VolumeMode;
  onModeChange?: (mode: VolumeMode) => void;
  /** Band aus der Suche: bleibt auch in der eingeklappten Reihe sichtbar. */
  highlight?: number;
}

export const VolumeShelf = ({
  current,
  total,
  currentTheme,
  onChange,
  ownership,
  mode = 'read',
  onModeChange,
  highlight = 0,
}: VolumeShelfProps) => {
  const [confirm, setConfirm] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const active: VolumeMode = !onChange ? 'own' : ownership ? mode : 'read';
  const ownedSet = new Set(ownership?.volumes ?? []);
  const isOwned = (n: number) => !!ownership && (ownership.all || ownedSet.has(n));
  const ownedCount = ownership?.volumes.length ?? 0;
  const anyOwned = !!ownership && (ownership.all || ownedCount > 0);

  const count = Math.max(total, current + (total > 0 ? 0 : 1), highlight, ...ownedSet);
  const base = showAll ? count : Math.min(count, Math.max(COLLAPSED, current + 6));
  const beyond = [...new Set([...ownedSet, highlight])]
    .filter((n) => n > base)
    .sort((a, b) => a - b);
  const volumes = [...Array.from({ length: base }, (_, i) => i + 1), ...beyond];

  const summary =
    active === 'read'
      ? total > 0
        ? t('{a} von {b} gelesen', { a: current, b: total })
        : ''
      : ownership?.all
        ? t('Ganze Reihe im Besitz')
        : ownedCount === 0
          ? ''
          : total > 0
            ? t('{a} von {b} im Besitz', { a: ownedCount, b: total })
            : t('{n} im Besitz', { n: ownedCount });

  const tile = (n: number) => {
    const owned = isOwned(n);
    if (active === 'own') {
      return (
        <button
          type="button"
          className={`md-volume ${owned ? 'md-volume--mine' : ''} ${n === highlight ? 'md-volume--next' : ''}`}
          aria-pressed={owned}
          aria-label={
            owned
              ? t('Band {n} aus dem Besitz entfernen', { n })
              : t('Band {n} als Besitz markieren', { n })
          }
          onClick={() => ownership?.onToggle(n, count)}
        >
          {n}
        </button>
      );
    }
    const read = n <= current;
    return (
      <button
        type="button"
        className={`md-volume ${read ? 'md-volume--read' : ''} ${n === current + 1 ? 'md-volume--next' : ''} ${owned ? 'md-volume--owned' : ''}`}
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
            onChange?.(n);
          }
        }}
      >
        {n}
      </button>
    );
  };

  return (
    <Section id="manga-volumes" delay={0.08} order={onChange ? 1 : 2}>
      <SectionTitle
        action={
          summary ? (
            <span className="md-hint" style={{ margin: 0, color: currentTheme.text.muted }}>
              {summary}
            </span>
          ) : undefined
        }
      >
        {t('Deine Bände')}
      </SectionTitle>
      {onChange && ownership && (
        <div className="mdh-unit md-volume-mode" role="group" aria-label={t('Ansicht')}>
          {(
            [
              ['read', t('Gelesen')],
              ['own', t('Im Besitz')],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mdh-unit-btn ${active === value ? 'mdh-unit-btn--active' : ''}`}
              aria-pressed={active === value}
              onClick={() => {
                setConfirm(null);
                setConfirmClear(false);
                onModeChange?.(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="md-volumes">
        {volumes.map((n, i) => (
          <Fragment key={n}>
            {i > 0 && n - volumes[i - 1] > 1 && (
              <span className="md-volume-gap" aria-hidden>
                …
              </span>
            )}
            {tile(n)}
          </Fragment>
        ))}
      </div>
      {active === 'read' && confirm !== null && (
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
              onChange?.(confirm - 1);
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
      {active === 'own' && ownership && confirmClear && (
        <div className="md-volumes-confirm">
          <span style={{ color: currentTheme.text.secondary }}>
            {t('Alle Bände aus dem Besitz entfernen?')}
          </span>
          <button
            type="button"
            className="manga-chapter-confirm-btn"
            onClick={() => {
              ownership.onAll(false);
              setConfirmClear(false);
            }}
            style={{ background: 'var(--theme-primary-15)', color: currentTheme.primary }}
          >
            {t('Ja')}
          </button>
          <button
            type="button"
            className="manga-chapter-confirm-btn"
            onClick={() => setConfirmClear(false)}
            style={{ background: 'var(--glass-light)', color: currentTheme.text.secondary }}
          >
            {t('Nein')}
          </button>
        </div>
      )}
      {active === 'own' && ownership && !anyOwned && (
        <p className="md-hint" style={{ color: currentTheme.text.muted }}>
          {t('Tippe die Bände an, die bei dir im Regal stehen.')}
        </p>
      )}
      <div className="md-volumes-links">
        {base < count && (
          <button
            type="button"
            className="md-volumes-more"
            onClick={() => setShowAll(true)}
            style={{ color: currentTheme.primary }}
          >
            {t('Alle {n} Bände zeigen', { n: count })}
          </button>
        )}
        {active === 'own' && ownership && !ownership.all && (
          <button
            type="button"
            className="md-volumes-more"
            onClick={() => {
              setConfirmClear(false);
              ownership.onAll(true);
            }}
            style={{ color: currentTheme.primary }}
          >
            {t('Ganze Reihe markieren')}
          </button>
        )}
        {active === 'own' && ownership && anyOwned && !confirmClear && (
          <button
            type="button"
            className="md-volumes-more"
            onClick={() =>
              ownership.all || ownedCount > 1 ? setConfirmClear(true) : ownership.onAll(false)
            }
            style={{ color: currentTheme.text.muted }}
          >
            {t('Alle entfernen')}
          </button>
        )}
      </div>
    </Section>
  );
};
