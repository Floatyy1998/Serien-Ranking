import { motion } from 'framer-motion';
import React from 'react';
import { tapScale } from '../../lib/motion';

export const FilterSection = ({
  label,
  action,
  layout = 'grid',
  children,
}: {
  label: string;
  action?: React.ReactNode;
  /** grid = gleich breite Kacheln, segmented = eine Leiste mit gleich breiten Feldern */
  layout?: 'grid' | 'segmented';
  children: React.ReactNode;
}) => (
  <section className="wn-section">
    <div className="wn-section__head">
      <span className="wn-section__label">{label}</span>
      {action}
    </div>
    <div className={`wn-chips wn-chips--${layout}`}>{children}</div>
  </section>
);

export const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <motion.button
    type="button"
    whileTap={tapScale}
    onClick={onClick}
    aria-pressed={active}
    className={`wn-chip${active ? ' wn-chip--active' : ''}`}
  >
    {children}
  </motion.button>
);

export const FilterSwitch = ({
  label,
  ariaLabel,
  on,
  onToggle,
}: {
  label: string;
  ariaLabel?: string;
  on: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    className={`wn-switch${on ? ' wn-switch--on' : ''}`}
    onClick={onToggle}
    aria-pressed={on}
    aria-label={ariaLabel ?? label}
  >
    <span className="wn-switch__label">{label}</span>
    <span className="wn-switch__track">
      <span className="wn-switch__knob" />
    </span>
  </button>
);
