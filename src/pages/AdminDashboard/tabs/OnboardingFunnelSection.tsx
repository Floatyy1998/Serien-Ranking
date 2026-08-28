/**
 * Onboarding-Trichter: wo bleiben neue Konten stehen?
 *
 * Zahlen kommen fertig gezaehlt aus `analytics/onboarding/funnel` (Cron
 * `build-onboarding-funnel.js`) — der Client rechnet hier nichts nach und liest
 * keine fremden Nutzerknoten.
 */

import { HowToReg } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import type { useTheme } from '../../../contexts/ThemeContext';
import type { OnboardingFunnel, useAdminDashboardData } from '../useAdminDashboardData';

interface OnboardingFunnelSectionProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

const STEP_LABELS: Array<[string, string]> = [
  ['welcome', 'Genres & Name'],
  ['series', 'Serien'],
  ['movies', 'Filme'],
  ['subscriptions', 'Abos'],
  ['pet', 'Pet'],
  ['done', 'Abschluss'],
];

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  passwort: 'E-Mail',
  unbekannt: 'unbekannt',
};

function quote(fertig: number, angelegt: number): string {
  if (angelegt <= 0) return '—';
  return `${Math.round((fertig / angelegt) * 100)} %`;
}

function stand(ts: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const StepBars = React.memo(({ f }: { f: OnboardingFunnel }) => {
  const steps = STEP_LABELS.map(([key, label]) => ({ label, n: f.steps?.[key] ?? 0 }));
  const gemessen = steps.reduce((sum, s) => sum + s.n, 0);
  const max = Math.max(1, ...steps.map((s) => s.n));

  if (gemessen === 0) {
    return (
      <p className="adm-card__hint">
        Noch keine Schritt-Marker: die Messung greift erst bei Konten, die sich ab jetzt anmelden.
        Die {f.ohneMarker} offenen Altkonten lassen sich nur grob einordnen — {f.ohneName} davon
        haben nicht einmal einen Namen gesetzt, kommen also nicht über den ersten Schritt hinaus.
      </p>
    );
  }

  return (
    <div className="adm-funnel">
      {steps.map((s) => (
        <div key={s.label} className="adm-funnel__row">
          <span className="adm-funnel__label">{s.label}</span>
          <span className="adm-funnel__track">
            <span className="adm-funnel__fill" style={{ width: `${(s.n / max) * 100}%` }} />
          </span>
          <span className="adm-funnel__value">{s.n}</span>
        </div>
      ))}
      {f.ohneMarker > 0 && (
        <div className="adm-funnel__row is-muted">
          <span className="adm-funnel__label">ohne Marker (Altbestand)</span>
          <span className="adm-funnel__track" />
          <span className="adm-funnel__value">{f.ohneMarker}</span>
        </div>
      )}
    </div>
  );
});
StepBars.displayName = 'StepBars';

export const OnboardingFunnelSection = React.memo<OnboardingFunnelSectionProps>(({ data }) => {
  const f = data.onboardingFunnel;
  if (!f) return null;

  const provider = Object.entries(f.provider || {}).sort((a, b) => b[1].angelegt - a[1].angelegt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="adm-card"
    >
      <h3 className="adm-card__title">
        <HowToReg style={{ fontSize: 18 }} />
        Onboarding
      </h3>
      <p className="adm-card__hint">
        Abschlussquote der letzten 30 Tage:{' '}
        <b>{quote(f.letzte30Tage.fertig, f.letzte30Tage.angelegt)}</b> ({f.letzte30Tage.fertig} von{' '}
        {f.letzte30Tage.angelegt} neuen Konten). Insgesamt <b>{f.open}</b> offene Konten, davon{' '}
        <b>{f.sofortWeg}</b> ohne jede Rückkehr nach der Anmeldung und <b>{f.mitPet}</b> mit bereits
        angelegtem Pet (die waren am Ende und sind trotzdem nicht durchgekommen). Stand{' '}
        {stand(f.ts)}.
      </p>

      <StepBars f={f} />

      {provider.length > 0 && (
        <div className="adm-table__wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Anmeldeart</th>
                <th>Konten</th>
                <th>fertig</th>
                <th>offen</th>
                <th>Quote</th>
              </tr>
            </thead>
            <tbody>
              {provider.map(([name, p]) => (
                <tr key={name}>
                  <td>{PROVIDER_LABELS[name] ?? name}</td>
                  <td>{p.angelegt}</td>
                  <td>{p.fertig}</td>
                  <td>{p.offen}</td>
                  <td>{quote(p.fertig, p.angelegt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
});

OnboardingFunnelSection.displayName = 'OnboardingFunnelSection';
