import { Children, type CSSProperties, type ReactNode } from 'react';
import { BackButton } from '../../ui';
import './detailKit.css';

interface DetailStageProps {
  /** Breitbild-Artwork; fehlt es, wird `wash` (Cover) zur Farbwolke. */
  art?: string;
  wash?: string;
  /** Artwork unkenntlich machen (Spoiler-Schutz). */
  veil?: boolean;
  poster: ReactNode;
  navEnd?: ReactNode;
  /** Titelblock neben dem Poster. */
  children: ReactNode;
  /** Wertungen, Fortschritt, Aktionen — Desktop neben, mobil unter dem Poster. */
  below?: ReactNode;
}

export const DetailStage = ({
  art,
  wash,
  veil,
  poster,
  navEnd,
  children,
  below,
}: DetailStageProps) => {
  const image = art || wash;
  return (
    <header className={`dk-stage${art ? '' : ' dk-stage--wash'}${veil ? ' dk-stage--veil' : ''}`}>
      <div
        className="dk-stage__art"
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      />
      <div className="dk-stage__shade" />
      <div className="dk-stage__nav">
        <BackButton
          style={{ backdropFilter: 'var(--blur-sm)', WebkitBackdropFilter: 'var(--blur-sm)' }}
        />
        {navEnd && <div className="dk-stage__nav-end">{navEnd}</div>}
      </div>
      <div className="dk-stage__grid">
        <div className="dk-stage__poster">{poster}</div>
        <div className="dk-stage__head">{children}</div>
        {below && <div className="dk-stage__below">{below}</div>}
      </div>
    </header>
  );
};

export interface ScoreItem {
  key: string;
  label: string;
  value: string;
  /** Stimmenzahl o. Ä. — nur auf breiten Ansichten. */
  sub?: string;
  /** Farbe des Quellen-Punkts. */
  tone?: string;
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  dim?: boolean;
  /** Die eigene Wertung — in Akzentfarbe. */
  own?: boolean;
}

export const ScoreRow = ({ items }: { items: ScoreItem[] }) => {
  if (items.length === 0) return null;
  return (
    <div className="dk-scores">
      {items.map((item) => {
        const className = `dk-score${item.dim ? ' dk-score--dim' : ''}${item.own ? ' dk-score--own' : ''}`;
        const inner = (
          <>
            <span className="dk-score__value">
              {item.value}
              {item.sub && <span className="dk-score__sub">{item.sub}</span>}
            </span>
            <span className="dk-score__label">
              <span
                className="dk-score__dot"
                style={item.tone ? ({ '--dk-score-tone': item.tone } as CSSProperties) : undefined}
              />
              {item.label}
            </span>
          </>
        );
        if (item.href) {
          return (
            <a
              key={item.key}
              className={className}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {inner}
            </a>
          );
        }
        if (item.onClick) {
          return (
            <button
              key={item.key}
              type="button"
              className={className}
              onClick={item.onClick}
              aria-label={item.ariaLabel}
            >
              {inner}
            </button>
          );
        }
        return (
          <div key={item.key} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
};

export interface ProgressSegment {
  key: string | number;
  done: number;
  total: number;
  title?: string;
  /** Markiert diesen Abschnitt (z. B. die aktuelle Folge). */
  current?: boolean;
}

interface ProgressStripProps {
  segments: ProgressSegment[];
  /** Links unter dem Streifen (Stand). */
  children?: ReactNode;
  /** Rechts unter dem Streifen (Ausblick). */
  aside?: ReactNode;
}

export const ProgressStrip = ({ segments, children, aside }: ProgressStripProps) => {
  const visible = segments.filter((s) => s.total > 0);
  if (visible.length === 0) return null;
  const done = visible.every((s) => s.done >= s.total);
  return (
    <div className={`dk-progress${done ? ' dk-progress--done' : ''}`}>
      <div className="dk-progress__bar">
        {visible.map((s) => (
          <div
            key={s.key}
            className={`dk-progress__seg${s.current ? ' dk-progress__seg--current' : ''}`}
            style={{ flexGrow: s.total }}
            title={s.title}
          >
            <div
              className="dk-progress__fill"
              style={{ width: `${Math.min(100, (s.done / s.total) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      {(children || aside) && (
        <div className="dk-progress__legend">
          <span>{children}</span>
          {aside && <span>{aside}</span>}
        </div>
      )}
    </div>
  );
};

/** Beschriftete Aktionen. Mobil ein Raster: bis fünf in einer Zeile, sonst zwei gleich lange Zeilen. */
export const ActionTiles = ({ children }: { children: ReactNode }) => {
  const count = Children.toArray(children).length;
  if (count === 0) return null;
  const cols = count <= 5 ? count : Math.ceil(count / 2);
  return (
    <div className="dk-actions" style={{ '--dk-cols': cols } as CSSProperties}>
      {children}
    </div>
  );
};

export interface DetailTab<K extends string> {
  key: K;
  label: string;
  icon?: ReactNode;
}

interface DetailTabsProps<K extends string> {
  tabs: DetailTab<K>[];
  active: K;
  onChange: (key: K) => void;
  ariaLabel: string;
  /** Präfix für `id`/`aria-controls` (Reiter ↔ Panel). */
  idPrefix?: string;
}

export const DetailTabs = <K extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  idPrefix,
}: DetailTabsProps<K>) => (
  <div className="dk-tabs" role="tablist" aria-label={ariaLabel}>
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        role="tab"
        id={idPrefix ? `${idPrefix}-tab-${tab.key}` : undefined}
        aria-controls={idPrefix ? `${idPrefix}-tabpanel-${tab.key}` : undefined}
        aria-selected={active === tab.key}
        tabIndex={active === tab.key ? 0 : -1}
        className={`dk-tab${active === tab.key ? ' dk-tab--active' : ''}`}
        onClick={() => onChange(tab.key)}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);

export const RailSection = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) => (
  <section>
    <h2 className="dk-section__title">
      {title}
      {hint && <span className="dk-section__hint">{hint}</span>}
    </h2>
    {children}
  </section>
);

export const FactList = ({ facts }: { facts: { label: string; value: ReactNode }[] }) => {
  const rows = facts.filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  if (rows.length === 0) return null;
  return (
    <dl className="dk-facts">
      {rows.map((f) => (
        <FactRow key={f.label} label={f.label} value={f.value} />
      ))}
    </dl>
  );
};

const FactRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </>
);
