import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import type { ReactNode } from 'react';
import './SettingsKit.css';

export function SGroup({
  title,
  description,
  footer,
  children,
}: {
  title?: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="st-group">
      {(title || description) && (
        <header className="st-group-head">
          {title && <h3 className="st-group-title">{title}</h3>}
          {description && <p className="st-group-desc">{description}</p>}
        </header>
      )}
      <div className="st-card">{children}</div>
      {footer && <div className="st-group-foot">{footer}</div>}
    </section>
  );
}

interface RowProps {
  icon?: SvgIconComponent;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  below?: ReactNode;
  onClick?: () => void;
  href?: string;
  download?: boolean;
  chevron?: boolean;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

export function SRow({
  icon: Icon,
  title,
  subtitle,
  trailing,
  below,
  onClick,
  href,
  download,
  chevron,
  tone = 'default',
  disabled,
}: RowProps) {
  const main = (
    <>
      {Icon && (
        <span className="st-row-icon" aria-hidden>
          <Icon />
        </span>
      )}
      <span className="st-row-text">
        <span className="st-row-title">{title}</span>
        {subtitle && <span className="st-row-sub">{subtitle}</span>}
      </span>
      {trailing && <span className="st-row-trailing">{trailing}</span>}
      {chevron && <ChevronRightRounded className="st-row-chev" aria-hidden />}
    </>
  );
  const cls = `st-row st-row--${tone}`;

  if (href && !below) {
    return (
      <a className={`${cls} st-row--action`} href={href} download={download}>
        <span className="st-row-main">{main}</span>
      </a>
    );
  }
  if (onClick && !below) {
    return (
      <button
        type="button"
        className={`${cls} st-row--action`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className="st-row-main">{main}</span>
      </button>
    );
  }
  return (
    <div className={cls}>
      <div className="st-row-main">{main}</div>
      {below && <div className="st-row-below">{below}</div>}
    </div>
  );
}

export function SSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={`st-switch${checked ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="st-switch-track" aria-hidden>
        <span className="st-switch-thumb" />
      </span>
    </label>
  );
}

export interface SegmentOption<T> {
  value: T;
  label: string;
  preview?: ReactNode;
}

export function SSegment<T extends string | number | boolean>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled,
  wrap,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (next: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className={`st-seg${wrap ? ' st-seg--wrap' : ''}`} role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            className={`st-seg-item${active ? ' is-active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.preview}
            <span className="st-seg-label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SNote({ icon: Icon, children }: { icon?: SvgIconComponent; children: ReactNode }) {
  return (
    <div className="st-note">
      {Icon && <Icon className="st-note-icon" aria-hidden />}
      <p>{children}</p>
    </div>
  );
}

export function SButton({
  variant = 'secondary',
  icon: Icon,
  children,
  onClick,
  disabled,
  type = 'button',
  ariaLabel,
}: {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: SvgIconComponent;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      className={`st-btn st-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {Icon && <Icon aria-hidden />}
      <span>{children}</span>
    </button>
  );
}

export function SButtons({ children }: { children: ReactNode }) {
  return <div className="st-btns">{children}</div>;
}

export function SBlock({ children }: { children: ReactNode }) {
  return <div className="st-block">{children}</div>;
}
