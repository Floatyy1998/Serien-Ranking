import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Event, Schedule } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticSelect } from '../../lib/interaction/haptics';
import { formatPlanTime } from '../../lib/watch/watchPlan';
import { dateLocale, t } from '../../services/i18n';

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const QUICK_TIMES = ['18:00', '19:00', '20:00', '20:15', '21:00', '22:00'];
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));

const formatPlanDay = (key: string) =>
  parseKey(key).toLocaleDateString(dateLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

const PickerTrigger = ({
  open,
  onToggle,
  icon,
  label,
  placeholder,
  ariaLabel,
}: {
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  label: string;
  placeholder?: boolean;
  ariaLabel: string;
}) => {
  const { currentTheme } = useTheme();
  return (
    <button
      type="button"
      className={`wp-picker-trigger${open ? ' is-open' : ''}`}
      aria-expanded={open}
      aria-label={ariaLabel}
      onClick={onToggle}
      style={{
        borderColor: open ? `${currentTheme.primary}80` : currentTheme.border.default,
        background: open ? `${currentTheme.primary}12` : undefined,
        color: placeholder ? currentTheme.text.muted : currentTheme.text.secondary,
      }}
    >
      <span className="wp-picker-trigger__icon" style={{ color: currentTheme.primary }}>
        {icon}
      </span>
      <span className="wp-picker-trigger__label">{label}</span>
    </button>
  );
};

const Cell = ({
  active,
  muted,
  today,
  onClick,
  children,
  ariaLabel,
  className = 'wp-cell',
}: {
  active?: boolean;
  muted?: boolean;
  today?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}) => {
  const { currentTheme } = useTheme();
  return (
    <button
      type="button"
      className={className}
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={() => {
        hapticSelect();
        onClick();
      }}
      style={
        active
          ? {
              background: currentTheme.primary,
              color: currentTheme.background.default,
              boxShadow: `0 4px 14px ${currentTheme.primary}40`,
            }
          : {
              color: muted ? currentTheme.text.muted : currentTheme.text.secondary,
              boxShadow: today ? `inset 0 0 0 1px ${currentTheme.primary}90` : undefined,
            }
      }
    >
      {children}
    </button>
  );
};

export const PlanDateTrigger = ({
  value,
  open,
  onToggle,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
}) => (
  <PickerTrigger
    open={open}
    onToggle={onToggle}
    icon={<Event style={{ fontSize: 18 }} />}
    label={value ? formatPlanDay(value) : t('Tag wählen')}
    placeholder={!value}
    ariaLabel={t('Tag')}
  />
);

export const PlanTimeTrigger = ({
  value,
  open,
  onToggle,
  twelveHour,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
  twelveHour: boolean;
}) => (
  <PickerTrigger
    open={open}
    onToggle={onToggle}
    icon={<Schedule style={{ fontSize: 18 }} />}
    label={value ? formatPlanTime(value, twelveHour) : t('Ohne Uhrzeit')}
    placeholder={!value}
    ariaLabel={t('Uhrzeit (optional)')}
  />
);

export const PlanDatePanel = ({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (key: string) => void;
  onClose: () => void;
}) => {
  const { currentTheme } = useTheme();
  const todayKey = keyOf(new Date());
  const [month, setMonth] = useState(() => {
    const d = value ? parseKey(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(2024, 0, 1 + i).toLocaleDateString(dateLocale(), { weekday: 'short' })
      ),
    []
  );

  const cells = useMemo(() => {
    const lead = (month.getDay() + 6) % 7;
    const all = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(month.getFullYear(), month.getMonth(), 1 - lead + i);
      return { key: keyOf(d), day: d.getDate(), inMonth: d.getMonth() === month.getMonth() };
    });
    return all.slice(35).some((c) => c.inMonth) ? all : all.slice(0, 35);
  }, [month]);

  const shiftMonth = (by: number) =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1));

  return (
    <div
      className="wp-picker-panel"
      style={{ borderColor: currentTheme.border.default }}
      role="group"
      aria-label={t('Tag')}
    >
      <div className="wp-month-head">
        <button
          type="button"
          className="wp-icon-btn"
          onClick={() => shiftMonth(-1)}
          aria-label={t('Vorheriger Monat')}
          style={{ color: currentTheme.text.secondary }}
        >
          <ChevronLeft style={{ fontSize: 22 }} />
        </button>
        <span className="wp-month-title" style={{ color: currentTheme.text.secondary }}>
          {month.toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          className="wp-icon-btn"
          onClick={() => shiftMonth(1)}
          aria-label={t('Nächster Monat')}
          style={{ color: currentTheme.text.secondary }}
        >
          <ChevronRight style={{ fontSize: 22 }} />
        </button>
      </div>
      <div className="wp-grid wp-grid--7">
        {weekdays.map((w, i) => (
          <span key={i} className="wp-weekday" style={{ color: currentTheme.text.muted }}>
            {w.replace('.', '')}
          </span>
        ))}
        {cells.map((c) => (
          <Cell
            key={c.key}
            active={c.key === value}
            muted={!c.inMonth || c.key < todayKey}
            today={c.key === todayKey}
            ariaLabel={formatPlanDay(c.key)}
            className="wp-cell wp-cell--day"
            onClick={() => {
              onChange(c.key);
              onClose();
            }}
          >
            {c.day}
          </Cell>
        ))}
      </div>
    </div>
  );
};

export const PlanTimePanel = ({
  value,
  onChange,
  onClose,
  twelveHour,
}: {
  value: string;
  onChange: (time: string) => void;
  onClose: () => void;
  twelveHour: boolean;
}) => {
  const { currentTheme } = useTheme();
  const [hour, minute] = value ? value.split(':') : ['', ''];
  const hour24 = hour ? Number(hour) : null;
  const pm = hour24 === null ? true : hour24 >= 12;
  const setHour24 = (h: number) => onChange(`${pad(h)}:${minute || '00'}`);
  const setPeriod = (toPm: boolean) => {
    if (hour24 === null) setHour24(toPm ? 20 : 8);
    else if (toPm !== pm) setHour24((hour24 + 12) % 24);
  };
  const shown = value ? formatPlanTime(value, twelveHour) : '--:--';
  const [clock, suffix] = shown.split(' ');
  const [shownHour, shownMinute] = clock.split(':');

  return (
    <div
      className="wp-picker-panel"
      style={{ borderColor: currentTheme.border.default }}
      role="group"
      aria-label={t('Uhrzeit (optional)')}
    >
      <div
        className="wp-time-display"
        style={{ color: value ? currentTheme.primary : currentTheme.text.muted }}
      >
        <span>{shownHour}</span>
        <span className="wp-time-display__colon">:</span>
        <span>{shownMinute}</span>
        {suffix && <span className="wp-time-display__suffix">{suffix}</span>}
      </div>

      <div className="wp-quick-times">
        {QUICK_TIMES.map((q) => {
          const active = q === value;
          return (
            <button
              key={q}
              type="button"
              className="wp-chip"
              aria-pressed={active}
              onClick={() => {
                hapticSelect();
                onChange(q);
              }}
              style={
                active
                  ? {
                      background: `${currentTheme.primary}22`,
                      borderColor: `${currentTheme.primary}80`,
                      color: currentTheme.primary,
                    }
                  : { borderColor: currentTheme.border.default, color: currentTheme.text.secondary }
              }
            >
              {formatPlanTime(q, twelveHour)}
            </button>
          );
        })}
      </div>

      <div className="wp-picker-caption-row">
        <span className="wp-picker-caption" style={{ color: currentTheme.text.muted }}>
          {t('Stunde')}
        </span>
        {twelveHour && (
          <div className="wp-ampm" role="radiogroup" aria-label="AM/PM">
            {[false, true].map((isPm) => {
              const active = hour24 !== null && isPm === pm;
              return (
                <button
                  key={isPm ? 'pm' : 'am'}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className="wp-ampm__btn"
                  onClick={() => {
                    hapticSelect();
                    setPeriod(isPm);
                  }}
                  style={
                    active
                      ? { background: currentTheme.primary, color: currentTheme.background.default }
                      : { color: currentTheme.text.secondary }
                  }
                >
                  {isPm ? 'PM' : 'AM'}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="wp-grid wp-grid--hours">
        {twelveHour
          ? HOURS_12.map((h12) => {
              const h = (h12 % 12) + (pm ? 12 : 0);
              return (
                <Cell key={h12} active={hour24 === h} onClick={() => setHour24(h)}>
                  {h12}
                </Cell>
              );
            })
          : HOURS.map((h) => (
              <Cell key={h} active={h === hour} onClick={() => setHour24(Number(h))}>
                {h}
              </Cell>
            ))}
      </div>

      <span className="wp-picker-caption" style={{ color: currentTheme.text.muted }}>
        {t('Minute')}
      </span>
      <div className="wp-grid wp-grid--minutes">
        {MINUTES.map((m) => (
          <Cell key={m} active={m === minute} onClick={() => onChange(`${hour || '20'}:${m}`)}>
            {m}
          </Cell>
        ))}
      </div>

      <div className="wp-picker-foot">
        <button
          type="button"
          className="wp-link-btn"
          onClick={() => {
            onChange('');
            onClose();
          }}
          style={{ color: currentTheme.text.muted }}
        >
          {t('Ohne Uhrzeit')}
        </button>
        <button
          type="button"
          className="wp-link-btn"
          onClick={onClose}
          style={{ color: currentTheme.primary }}
        >
          {t('Fertig')}
        </button>
      </div>
    </div>
  );
};
