import { ErrorOutline } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ProviderInsight } from '../../../types/Subscription';

const formatEuro = (value: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

interface SubscriptionInsightsProps {
  activeCount: number;
  unusedInsights: ProviderInsight[];
  totalMonthlySpend: number;
  wastedMonthlySpend: number;
  unusedThresholdDays: number;
}

/** Insight-Karten oben auf der Seite: aktive Abos, ungenutzte Kosten und Kündigungs-Vorschlag. */
export const SubscriptionInsights = ({
  activeCount,
  unusedInsights,
  totalMonthlySpend,
  wastedMonthlySpend,
  unusedThresholdDays,
}: SubscriptionInsightsProps) => {
  const { currentTheme } = useTheme();

  const warning = currentTheme.status.warning;
  const success = currentTheme.status.success;
  const surface = currentTheme.background.surface;
  const muted = currentTheme.text.muted;

  return (
    <div className="sub-insights">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sub-insight-card"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}28, ${surface})`,
          borderColor: `${currentTheme.primary}40`,
          color: currentTheme.text.primary,
        }}
      >
        <p className="sub-insight-label" style={{ color: muted }}>
          Aktive Abos
        </p>
        <p className="sub-insight-value">{activeCount}</p>
        <p className="sub-insight-sub" style={{ color: currentTheme.text.secondary }}>
          {formatEuro(totalMonthlySpend)} pro Monat
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="sub-insight-card"
        style={{
          background:
            wastedMonthlySpend > 0
              ? `linear-gradient(135deg, ${warning}30, ${surface})`
              : `linear-gradient(135deg, ${success}20, ${surface})`,
          borderColor: wastedMonthlySpend > 0 ? `${warning}55` : `${success}40`,
          color: currentTheme.text.primary,
        }}
      >
        <p className="sub-insight-label" style={{ color: muted }}>
          Ungenutzt / Monat
        </p>
        <p
          className="sub-insight-value"
          style={{ color: wastedMonthlySpend > 0 ? warning : success }}
        >
          {formatEuro(wastedMonthlySpend)}
        </p>
        <p className="sub-insight-sub" style={{ color: currentTheme.text.secondary }}>
          {unusedInsights.length === 0
            ? 'Alles wird genutzt 🎉'
            : `${unusedInsights.length} Abo${unusedInsights.length === 1 ? '' : 's'} schläft`}
        </p>
      </motion.div>

      {unusedInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sub-insight-card sub-insight-card--full"
          style={{
            background: `linear-gradient(135deg, ${warning}22, ${surface})`,
            borderColor: `${warning}55`,
            color: currentTheme.text.primary,
          }}
        >
          <p
            className="sub-insight-label"
            style={{ color: warning, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ErrorOutline style={{ fontSize: 16 }} />
            Vorschlag
          </p>
          <p className="sub-insight-suggestion" style={{ color: currentTheme.text.primary }}>
            Du zahlst aktuell{' '}
            <strong style={{ color: warning }}>{formatEuro(wastedMonthlySpend)}</strong> pro Monat
            für Anbieter, die du seit über <strong>{unusedThresholdDays} Tagen</strong> nicht
            genutzt hast: {unusedInsights.map((i) => i.name).join(', ')}.
          </p>
        </motion.div>
      )}
    </div>
  );
};
