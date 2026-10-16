import { AutoAwesome, ExpandMore, WarningAmber } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { HorizontalScrollContainer } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { hardcoverReady, hardcoverSimilar } from '../../../services/api/hardcoverApi';
import { t } from '../../../services/i18n';
import type { BookSearchResult } from '../../../types/Book';
import { moodLabel, warningLabel } from '../data/genreCatalog';
import { DiscoverCard, SkeletonCards } from '../discover/DiscoverParts';
import { useAddFlow } from '../discover/useAddFlow';

/** Stimmung und Tempo als Chips, Inhaltshinweise eingeklappt (sie können Handlung verraten). */
export const BookMoodPanel: React.FC<{
  moods?: string[];
  pace?: string[];
  warnings?: string[];
}> = ({ moods = [], pace = [], warnings = [] }) => {
  const { currentTheme } = useTheme();
  const [showWarnings, setShowWarnings] = useState(false);
  const chips = [...moods, ...pace].filter((value, index, all) => all.indexOf(value) === index);
  if (chips.length === 0 && warnings.length === 0) return null;
  return (
    <div className="bd-panel">
      {chips.length > 0 && (
        <>
          <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
            <AutoAwesome style={{ fontSize: 20, color: currentTheme.primary }} />
            {t('Stimmung & Tempo')}
          </h2>
          <div className="bd-chips">
            {chips.map((chip) => (
              <span
                key={chip}
                className="bd-chip"
                style={{
                  color: currentTheme.text.primary,
                  borderColor: `${currentTheme.primary}55`,
                  background: `${currentTheme.primary}1f`,
                }}
              >
                {moodLabel(chip)}
              </span>
            ))}
          </div>
        </>
      )}
      {warnings.length > 0 && (
        <div style={{ marginTop: chips.length > 0 ? 14 : 0 }}>
          <button
            type="button"
            className="bd-warn-toggle"
            aria-expanded={showWarnings}
            onClick={() => setShowWarnings((v) => !v)}
            style={{ color: currentTheme.text.secondary }}
          >
            <WarningAmber style={{ fontSize: 18, color: currentTheme.text.muted }} />
            {showWarnings ? t('Inhaltshinweise ausblenden') : t('Inhaltshinweise anzeigen')}
            <ExpandMore
              style={{
                fontSize: 20,
                transform: showWarnings ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
          {showWarnings && (
            <div className="bd-chips" style={{ marginTop: 10 }}>
              {warnings.map((warning) => (
                <span
                  key={warning}
                  className="bd-chip bd-chip--warn"
                  style={{
                    color: currentTheme.text.secondary,
                    borderColor: currentTheme.text.muted,
                  }}
                >
                  {warningLabel(warning)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Ähnliche Bücher laut Hardcover; ohne Treffer oder bei pausierter Quelle verschwindet der Block. */
export const SimilarBooksPanel: React.FC<{ hardcoverId: number }> = ({ hardcoverId }) => {
  const { currentTheme } = useTheme();
  const [items, setItems] = useState<BookSearchResult[] | null>(null);
  const { openAdd, sheet } = useAddFlow();

  useEffect(() => {
    if (!hardcoverReady()) {
      setItems([]);
      return;
    }
    let alive = true;
    setItems(null);
    hardcoverSimilar(hardcoverId)
      .then((list) => alive && setItems(list))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [hardcoverId]);

  if (items && items.length === 0) return null;
  return (
    <div className="bd-panel">
      <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
        <AutoAwesome style={{ fontSize: 20, color: currentTheme.primary }} />
        {t('Das könnte dir auch gefallen')}
      </h2>
      <HorizontalScrollContainer
        scrollerClassName="dsc-row"
        scrollerStyle={{ padding: '4px 0 6px', margin: '0 -4px' }}
      >
        {items ? (
          items.slice(0, 14).map((r) => <DiscoverCard key={r.id} result={r} onAdd={openAdd} />)
        ) : (
          <SkeletonCards count={5} />
        )}
      </HorizontalScrollContainer>
      {sheet}
    </div>
  );
};
