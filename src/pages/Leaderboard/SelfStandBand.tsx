/**
 * „Dein Stand" — die Zeile, die die eigentliche Frage beantwortet: Auf welchem
 * Platz stehe ich, und wie weit ist der vor mir weg? Ohne sie muss man sich
 * seinen eigenen Eintrag in der Liste suchen.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GradientText } from '../../components/ui/display/GradientText';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import type { LeaderboardEntry, RankingCategory } from '../../types/Leaderboard';
import { formatValue } from './leaderboardUtils';
import { computeSelfStand } from './selfStand';

interface SelfStandBandProps {
  entries: LeaderboardEntry[];
  category: RankingCategory;
  unit: string;
  categoryLabel: string;
}

export const SelfStandBand = React.memo(function SelfStandBand({
  entries,
  category,
  unit,
  categoryLabel,
}: SelfStandBandProps) {
  const { currentTheme } = useTheme();
  const stand = computeSelfStand(entries);

  if (!stand) return null;

  const leaderValue = entries[0]?.value ?? 0;
  const progress = leaderValue > 0 ? Math.max(4, Math.round((stand.value / leaderValue) * 100)) : 0;

  const gapText = stand.isLeader
    ? stand.gap > 0
      ? t('{gap} Vorsprung', { gap: `${formatValue(stand.gap, category)} ${unit}`.trim() })
      : t('Du führst')
    : t('{gap} hinter {name}', {
        gap: `${formatValue(stand.gap, category)} ${unit}`.trim(),
        name: stand.aheadName ?? '',
      });

  return (
    <motion.section
      className="lb-stand"
      aria-label={t('Dein Stand')}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="lb-stand-rank">
        <GradientText as="span" style={{ fontSize: 'inherit', fontWeight: 800, lineHeight: 1 }}>
          {stand.rank}
        </GradientText>
        <span className="lb-stand-of" style={{ color: currentTheme.text.muted }}>
          {t('von {n}', { n: stand.of })}
        </span>
      </div>

      <div className="lb-stand-body">
        <div className="lb-stand-head">
          <span className="lb-stand-label" style={{ color: currentTheme.text.muted }}>
            {categoryLabel}
          </span>
          <span className="lb-stand-value" style={{ color: currentTheme.text.secondary }}>
            {formatValue(stand.value, category)}
            {unit && <em style={{ color: currentTheme.text.muted }}>{unit}</em>}
          </span>
        </div>

        <div className="lb-stand-track">
          <motion.span
            className="lb-stand-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <span
          className="lb-stand-gap"
          style={{ color: stand.isLeader ? currentTheme.accent : currentTheme.text.muted }}
        >
          {gapText}
        </span>
      </div>
    </motion.section>
  );
});
