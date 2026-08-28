/**
 * Reichweite: Konten, DAU, WAU, MAU aus Firebase Auth — unabhaengig davon, ob
 * jemand den Analytics-Hinweis angenommen hat. Damit vollstaendig, im Gegensatz
 * zur Analytics-DAU darueber.
 */

import { CalendarMonth, DateRange, Groups, PersonAdd } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { SafeResponsiveContainer } from '../../../components/ui/SafeResponsiveContainer';
import type { useTheme } from '../../../contexts/ThemeContext';
import { KpiScorecard } from '../components/KpiScorecard';
import type { useAdminDashboardData } from '../useAdminDashboardData';

const COLORS = {
  total: '#f6a6c1',
  dau: '#7c6ef0',
  wau: '#00cec9',
  mau: '#fdcb6e',
};

/** Uhrzeit des letzten Laufs — ohne sie sieht man nicht, wie frisch die Zahl ist. */
function formatStand(ts: number | undefined, date: string): string {
  if (!ts) return date;
  const d = new Date(ts);
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ReachSectionProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

export const ReachSection = React.memo<ReachSectionProps>(({ data, theme }) => {
  const latest = data.reachLatest;
  if (!latest) return null;

  const stale = latest.date !== new Date().toISOString().slice(0, 10);
  // Der Zaehler laeuft stuendlich; zwischen Mitternacht und 00:55 ist die
  // neueste Zeile aber noch die von gestern. Dann darf die Kachel nicht "heute"
  // behaupten, sonst steht sie scheinbar im Widerspruch zur laufend
  // mitgezaehlten DAU darunter.
  const [, monat, tag] = latest.date.split('-');
  const dauTitel = stale ? `Aktiv am ${tag}.${monat}.` : 'Aktiv heute';
  const fensterZusatz = stale ? ` (Stand ${tag}.${monat}.)` : '';

  return (
    <>
      <div className="adm-grid">
        <KpiScorecard
          title="Konten gesamt"
          value={latest.total}
          icon={<PersonAdd style={{ fontSize: 18 }} />}
          color={COLORS.total}
          theme={theme}
          delay={0}
        />
        <KpiScorecard
          title={dauTitel}
          value={latest.dau}
          icon={<Groups style={{ fontSize: 18 }} />}
          color={COLORS.dau}
          theme={theme}
          delay={1}
        />
        <KpiScorecard
          title={`Aktiv 7 Tage${fensterZusatz}`}
          value={latest.wau}
          icon={<DateRange style={{ fontSize: 18 }} />}
          color={COLORS.wau}
          theme={theme}
          delay={2}
        />
        <KpiScorecard
          title={`Aktiv 30 Tage${fensterZusatz}`}
          value={latest.mau}
          icon={<CalendarMonth style={{ fontSize: 18 }} />}
          color={COLORS.mau}
          theme={theme}
          delay={3}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="adm-card"
      >
        <h3 className="adm-card__title">Reichweite (unterschiedliche Konten)</h3>
        <p className="adm-card__hint">
          Aus Firebase Auth gezaehlt, unabhaengig vom Analytics-Hinweis — anders als die DAU oben
          fehlt hier niemand. Stand {formatStand(latest.ts, latest.date)} (der Zaehler laeuft
          stuendlich zur Minute 55).
        </p>
        <SafeResponsiveContainer minWidth={0} minHeight={0} width="100%" height={260}>
          <LineChart data={data.reachChartData}>
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
              dataKey="mau"
              name="30 Tage"
              stroke={COLORS.mau}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="wau"
              name="7 Tage"
              stroke={COLORS.wau}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="dau"
              name="Heute"
              stroke={COLORS.dau}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </SafeResponsiveContainer>
      </motion.div>
    </>
  );
});

ReachSection.displayName = 'ReachSection';
