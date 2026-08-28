/**
 * Aufhol-Hinweis unter einem Countdown: schaffst du den Rückstand bis zum
 * Start — und wenn nicht, welches Tempo oder welcher Filler-Verzicht rettet es.
 */

import { CheckCircleOutlined, FastForwardRounded, WarningAmberRounded } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { dateLocale, t } from '../../services/i18n';
import type { CatchUpPlan } from '../../lib/catchUpPlan';

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

  const madeIt = plan.current.willMakeIt;
  const tone = madeIt ? success : warning;
  const Icon = madeIt ? CheckCircleOutlined : WarningAmberRounded;

  const headline = madeIt
    ? plan.current.projectedDate
      ? t('Rechtzeitig durch — fertig ca. {date}', {
          date: formatDay(plan.current.projectedDate),
        })
      : t('Rechtzeitig durch')
    : plan.current.projectedDate
      ? plan.current.daysLate >= 14
        ? t('{n} Wochen zu spät', { n: Math.round(plan.current.daysLate / 7) })
        : t('{n} Tage zu spät', { n: plan.current.daysLate })
      : t('{n} Folgen offen, kein Tempo messbar', { n: plan.current.episodes });

  return (
    <div className={`cd-plan${compact ? ' cd-plan--compact' : ''}`}>
      <p className="cd-plan-line" style={{ color: tone }}>
        <Icon style={{ fontSize: 15 }} />
        <span>{headline}</span>
      </p>

      {!madeIt && plan.requiredPerWeek > 0 && (
        <p className="cd-plan-sub" style={{ color: currentTheme.text.secondary }}>
          {t('{open} Folgen offen · {need} Folgen/Woche nötig', {
            open: plan.current.episodes,
            need: formatNumber(plan.requiredPerWeek),
          })}
        </p>
      )}

      {!compact && plan.withoutFiller && plan.withoutFiller.episodes < plan.current.episodes && (
        <p className="cd-plan-sub" style={{ color: plan.fillerSavesIt ? success : accent }}>
          <FastForwardRounded style={{ fontSize: 14 }} />
          {plan.fillerSavesIt
            ? t('Ohne die {n} Filler-Folgen schaffst du es.', {
                n: plan.current.episodes - plan.withoutFiller.episodes,
              })
            : t('Ohne die {n} Filler-Folgen: noch {rest} Folgen.', {
                n: plan.current.episodes - plan.withoutFiller.episodes,
                rest: plan.withoutFiller.episodes,
              })}
        </p>
      )}
    </div>
  );
};
