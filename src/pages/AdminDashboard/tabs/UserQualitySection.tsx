/**
 * Bereinigte Nutzerzahlen: wie viele der Konten sind wirklich Nutzer?
 *
 * Zahlen kommen fertig gerechnet aus `analytics/quality` (Cron
 * `build-user-quality.js`) — der Client liest keine fremden Nutzerknoten.
 */

import { CheckCircle, HourglassEmpty, Public, Verified } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { SafeResponsiveContainer } from '../../../components/ui/SafeResponsiveContainer';
import type { useTheme } from '../../../contexts/ThemeContext';
import { KpiScorecard } from '../components/KpiScorecard';
import type { useAdminDashboardData } from '../useAdminDashboardData';

const COLORS = {
  echt: '#3ddc97',
  aktiv: '#7c6ef0',
  neu: '#fdcb6e',
  aussortiert: '#ff5c7a',
  gesamt: '#7a8296',
};

const KOHORTEN: Array<{
  key: 'echt' | 'ruhend' | 'neu' | 'angefangen' | 'abgebrochen' | 'welle';
  label: string;
  ton: string;
}> = [
  { key: 'echt', label: 'Echte Nutzer', ton: COLORS.echt },
  { key: 'ruhend', label: 'Ruhend (waren echt)', ton: '#7aa2ff' },
  { key: 'neu', label: 'Neu, noch in Karenz', ton: COLORS.neu },
  { key: 'angefangen', label: 'Nur angefangen', ton: '#c08cff' },
  { key: 'abgebrochen', label: 'Onboarding abgebrochen', ton: '#ff8a5c' },
  { key: 'welle', label: 'Registrier-Welle (Tester)', ton: COLORS.aussortiert },
];

interface UserQualitySectionProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
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

/** 2026-08-06 -> 06.08. — ISO-Datum liest sich in einem Fliesstext schlecht. */
function tag(iso: string): string {
  const [, m, d] = iso.split('-');
  return m && d ? `${d}.${m}.` : iso;
}

function land(tz: string): string {
  if (tz === 'unbekannt') return 'unbekannt';
  const teil = tz.split('/').pop() || tz;
  return teil.replace(/_/g, ' ');
}

export const UserQualitySection = React.memo<UserQualitySectionProps>(({ data, theme }) => {
  const q = data.userQuality;
  if (!q) return null;

  const aussortiert = q.welle + q.abgebrochen;
  const max = Math.max(1, ...KOHORTEN.map((k) => q[k.key]));
  const anteil = q.gesamt > 0 ? Math.round((q.echt / q.gesamt) * 100) : 0;
  const laender = q.laender || [];

  return (
    <>
      <div className="adm-grid">
        <KpiScorecard
          title="Echte Nutzer"
          value={q.echt}
          icon={<Verified style={{ fontSize: 18 }} />}
          color={COLORS.echt}
          theme={theme}
          delay={0}
        />
        <KpiScorecard
          title="Davon aktiv (30 Tage)"
          value={q.aktiv30}
          icon={<CheckCircle style={{ fontSize: 18 }} />}
          color={COLORS.aktiv}
          theme={theme}
          delay={1}
        />
        <KpiScorecard
          title="Neu, noch in Karenz"
          value={q.neu}
          icon={<HourglassEmpty style={{ fontSize: 18 }} />}
          color={COLORS.neu}
          theme={theme}
          delay={2}
        />
        <KpiScorecard
          title="Aussortiert"
          value={aussortiert}
          icon={<Public style={{ fontSize: 18 }} />}
          color={COLORS.aussortiert}
          theme={theme}
          delay={3}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="adm-card"
      >
        <h3 className="adm-card__title">
          <Verified style={{ fontSize: 18 }} />
          Echtes Wachstum
        </h3>
        <p className="adm-card__hint">
          <b>{q.echt}</b> von {q.gesamt} Konten sind echte Nutzer ({anteil} %) — Onboarding
          abgeschlossen, mindestens {q.regeln.minInhalte} Einträge angelegt und nach mehr als einem
          Tag wiedergekommen. Konten unter {q.regeln.karenzTage} Tagen zählen noch nicht mit, die
          Kurve unten holt sie nach. Stand {stand(q.ts)}.
        </p>
        <SafeResponsiveContainer minWidth={0} minHeight={0} width="100%" height={260}>
          <LineChart data={data.qualityChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border.default} opacity={0.3} />
            <XAxis dataKey="date" stroke={theme.text.muted} fontSize={11} />
            <YAxis stroke={theme.text.muted} fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: theme.background.surface,
                border: `1px solid ${theme.border.default}`,
                borderRadius: 10,
                color: theme.text.primary,
              }}
            />
            <Line
              type="monotone"
              dataKey="gesamt"
              name="Konten gesamt"
              stroke={COLORS.gesamt}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="echt"
              name="Echte Nutzer"
              stroke={COLORS.echt}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </SafeResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="adm-card"
      >
        <h3 className="adm-card__title">Woraus sich die Konten zusammensetzen</h3>
        <div className="adm-funnel">
          {KOHORTEN.map((k) => (
            <div key={k.key} className="adm-funnel__row">
              <span className="adm-funnel__label">{k.label}</span>
              <span className="adm-funnel__track">
                <span
                  className="adm-funnel__fill"
                  style={{ width: `${(q[k.key] / max) * 100}%`, background: k.ton }}
                />
              </span>
              <span className="adm-funnel__value">{q[k.key]}</span>
            </div>
          ))}
        </div>

        {laender.length > 0 && (
          <>
            <p className="adm-card__hint">Herkunft der echten und neuen Konten (Gerätezeitzone):</p>
            <div className="adm-chips">
              {laender.map((l) => (
                <span key={l.tz} className="adm-chip">
                  {land(l.tz)}
                  <span className="adm-chip__count">{l.n}</span>
                </span>
              ))}
            </div>
          </>
        )}

        {q.wellen && q.wellen.length > 0 && (
          <p className="adm-card__hint">
            Erkannte Registrier-Wellen (ab {q.regeln.welleMinKonten} Konten an einem Tag,
            überwiegend ohne Inhalte):{' '}
            {q.wellen
              .map((w) => `${tag(w.tag)} (${w.konten} Konten, davon ${w.leer} leer)`)
              .join(' · ')}
            . Diese Konten sind aus der Kernzahl herausgerechnet.
          </p>
        )}
      </motion.div>
    </>
  );
});

UserQualitySection.displayName = 'UserQualitySection';
