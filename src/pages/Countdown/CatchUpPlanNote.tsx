/**
 * Aufhol-Hinweis in einer Countdown-Karte: schaffst du den Rückstand bis zum
 * Start — und wenn nicht, welches Tempo oder welcher Filler-Verzicht rettet es.
 * Steht in einem Button, darum nur Spans.
 */

import {
  CheckCircleOutlined,
  FastForwardRounded,
  ScheduleRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { dateLocale, t } from '../../services/i18n';
import type { CatchUpPlan } from '../../lib/watch/catchUpPlan';

const formatNumber = (value: number): string =>
  new Intl.NumberFormat(dateLocale(), { maximumFractionDigits: 1 }).format(value);

const formatDay = (date: Date): string =>
  date.toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit' });

interface CatchUpPlanNoteProps {
  plan: CatchUpPlan;
  /** Kompakt = eine Zeile für Listeneinträge. */
  compact?: boolean;
}

export const CatchUpPlanNote = ({ plan, compact = false }: CatchUpPlanNoteProps) => {
  const { currentTheme } = useTheme();

  const success = currentTheme.status.success;
  const warning = currentTheme.status.warning;
  const accent = currentTheme.accent || currentTheme.primary;
  const muted = currentTheme.text.secondary;

  const madeIt = plan.current.willMakeIt;
  // Ohne messbares Tempo (pausiert, zu wenig Daten) gibt es keine Prognose, also auch keine Warnung.
  const noPace = !madeIt && !plan.current.projectedDate;
  const tone = madeIt ? success : noPace ? muted : warning;
  const Icon = madeIt ? CheckCircleOutlined : noPace ? ScheduleRounded : WarningAmberRounded;

  const open = plan.current.episodes;
  const need = formatNumber(plan.requiredPerWeek);
  const hasNeed = !madeIt && plan.requiredPerWeek > 0;

  const headline = madeIt
    ? plan.current.projectedDate
      ? t('Rechtzeitig durch — fertig ca. {date}', {
          date: formatDay(plan.current.projectedDate),
        })
      : t('Rechtzeitig durch')
    : noPace
      ? t('{n} Folgen bis zum Start offen', { n: open })
      : plan.current.daysLate >= 14
        ? t('{n} Wochen zu spät', { n: Math.round(plan.current.daysLate / 7) })
        : t('{n} Tage zu spät', { n: plan.current.daysLate });

  if (compact) {
    const line =
      noPace && hasNeed
        ? t('{n} offen · {need}/Woche reichen', { n: open, need })
        : hasNeed
          ? `${headline} · ${t('{need}/Woche nötig', { need })}`
          : headline;
    return (
      <span className="cd-plan cd-plan--compact">
        <span className="cd-plan-line" style={{ color: tone }}>
          <Icon className="cd-plan-icon" />
          <span className="cd-plan-text">{line}</span>
        </span>
      </span>
    );
  }

  return (
    <span className="cd-plan">
      <span className="cd-plan-line" style={{ color: tone }}>
        <Icon className="cd-plan-icon" />
        <span className="cd-plan-text">{headline}</span>
      </span>

      {hasNeed && (
        <span className="cd-plan-sub" style={{ color: muted }}>
          {noPace
            ? t('{need} Folgen pro Woche reichen', { need })
            : t('{open} Folgen offen · {need} Folgen/Woche nötig', { open, need })}
        </span>
      )}

      {plan.withoutFiller && plan.withoutFiller.episodes < open && (
        <span className="cd-plan-sub" style={{ color: plan.fillerSavesIt ? success : accent }}>
          <FastForwardRounded className="cd-plan-icon" />
          {plan.fillerSavesIt
            ? t('Ohne die {n} Filler-Folgen schaffst du es.', {
                n: open - plan.withoutFiller.episodes,
              })
            : t('Ohne die {n} Filler-Folgen: noch {rest} Folgen.', {
                n: open - plan.withoutFiller.episodes,
                rest: plan.withoutFiller.episodes,
              })}
        </span>
      )}
    </span>
  );
};
