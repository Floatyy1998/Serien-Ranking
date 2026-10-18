/**
 * Crossover-Kasten der Detailseite, aus Sicht DIESER Serie: welche Folge betroffen
 * ist, was vorher und was danach zu schauen ist. Gastauftritte sind nur Zusatzinfo
 * und liegen eingeklappt darunter.
 */
import Add from '@mui/icons-material/Add';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded';
import { memo, useMemo, useState } from 'react';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { kindLabel, partTitle } from '../../../components/crossover/crossoverLabels';
import {
  partCode,
  partWatchState,
  type CrossoverRef,
  type PartWatchState,
} from '../../../lib/crossover/crossoverIndex';
import { t } from '../../../services/i18n';
import type { DynamicTheme } from '../../../theme/dynamicTheme';
import type { CrossoverPart } from '../../../types/Crossover';

interface CrossoverSectionProps {
  seriesId: number;
  refs: CrossoverRef[];
  currentTheme: DynamicTheme;
  isMobile: boolean;
  onOpen: (id: string) => void;
  onAdd: () => void;
}

const VISIBLE = 3;

interface Row {
  ref: CrossoverRef;
  own: CrossoverPart[];
  before: CrossoverPart[];
  after: CrossoverPart[];
  sortKey: number;
}

/** Eigene Teile, alles davor und alles danach — aus Sicht der angezeigten Serie. */
function toRow(ref: CrossoverRef, seriesId: number): Row {
  const parts = ref.entry.parts;
  const ownIdx = parts.map((p, i) => (p.id === seriesId ? i : -1)).filter((i) => i >= 0);
  const first = ownIdx[0] ?? 0;
  const last = ownIdx[ownIdx.length - 1] ?? 0;
  const own = ownIdx.map((i) => parts[i]);
  const anchor = own.find((p) => p.s !== undefined);
  return {
    ref,
    own,
    before: parts.slice(0, first),
    after: parts.slice(last + 1),
    // Ohne eigene Folgennummer (Backdoor-Vorgeschichte) ganz nach vorn.
    sortKey: anchor ? (anchor.s ?? 0) * 10000 + (anchor.e ?? 0) : -1,
  };
}

export const CrossoverSection = memo(
  ({ seriesId, refs, currentTheme, isMobile, onOpen, onAdd }: CrossoverSectionProps) => {
    const { allSeriesList } = useSeriesList();
    const [showAll, setShowAll] = useState(false);
    const [showGuests, setShowGuests] = useState(false);
    const muted = currentTheme.text.muted;
    const secondary = currentTheme.text.secondary;
    const accent = currentTheme.accent || currentTheme.primary;
    const border = currentTheme.border?.default || 'rgba(255,255,255,0.12)';

    const { main, guests, nextId } = useMemo(() => {
      const rows = refs.map((r) => toRow(r, seriesId)).sort((a, b) => a.sortKey - b.sortKey);
      const mainRows = rows.filter((r) => r.ref.entry.kind !== 'guest');
      const next = mainRows.find((r) =>
        r.own.some((p) => partWatchState(p, allSeriesList) === 'unwatched')
      );
      return {
        main: mainRows,
        guests: rows.filter((r) => r.ref.entry.kind === 'guest'),
        nextId: next?.ref.id ?? null,
      };
    }, [refs, seriesId, allSeriesList]);

    const addButton = (compact: boolean) => (
      <button
        type="button"
        onClick={onAdd}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          minHeight: compact ? 32 : 40,
          padding: compact ? '6px 10px' : '8px 14px',
          borderRadius: 999,
          border: compact ? 'none' : `1px dashed ${border}`,
          background: 'transparent',
          color: compact ? muted : secondary,
          fontSize: compact ? 12.5 : 13.5,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Add style={{ fontSize: compact ? 15 : 17 }} />
        {t('Crossover ergänzen')}
      </button>
    );

    if (refs.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
          {addButton(true)}
        </div>
      );
    }

    const stateColor = (state: PartWatchState) =>
      state === 'watched' ? currentTheme.primary : state === 'not-in-list' ? muted : secondary;

    const partChip = (part: CrossoverPart, i: number, withSeries: boolean) => {
      const state = partWatchState(part, allSeriesList);
      const code = partCode(part);
      const label = withSeries
        ? `${partTitle(part, allSeriesList)}${code ? ` ${code}` : ''}`
        : code || partTitle(part, allSeriesList);
      return (
        <span
          key={`${part.id}-${i}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            color: stateColor(state),
            fontWeight: state === 'watched' ? 600 : 500,
            whiteSpace: 'nowrap',
          }}
        >
          {state === 'watched' && <CheckCircle style={{ fontSize: 13 }} />}
          {label}
        </span>
      );
    };

    const partList = (parts: CrossoverPart[]) => (
      <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '2px 10px' }}>
        {parts.map((p, i) => partChip(p, i, true))}
      </span>
    );

    const line = (label: string, content: React.ReactNode) => (
      <span style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.45 }}>
        <span style={{ color: muted, minWidth: 52, flexShrink: 0 }}>{label}</span>
        <span style={{ minWidth: 0 }}>{content}</span>
      </span>
    );

    const renderMain = (row: Row) => {
      const { ref, own, before, after } = row;
      const isNext = ref.id === nextId;
      const ownNumbered = own.filter((p) => p.s !== undefined);
      return (
        <button
          key={ref.id}
          type="button"
          onClick={() => onOpen(ref.id)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: `1px solid ${isNext ? `color-mix(in srgb, ${accent} 55%, transparent)` : border}`,
            background: isNext
              ? `color-mix(in srgb, ${accent} 8%, transparent)`
              : 'rgba(255,255,255,0.03)',
            color: currentTheme.text.primary,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            gap: 6,
            textAlign: 'left',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {ownNumbered.length > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 8,
                  color: accent,
                  background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                }}
              >
                {ownNumbered.map((p) => partCode(p)).join(' + ')}
              </span>
            )}
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ref.entry.title}
            </span>
            {isNext ? (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  color: accent,
                }}
              >
                {t('Als Nächstes')}
              </span>
            ) : (
              <span style={{ flexShrink: 0, fontSize: 11, color: muted }}>
                {kindLabel(ref.entry.kind)}
              </span>
            )}
          </span>
          {ownNumbered.length === 0
            ? line(t('Vorher'), partList(before.length ? before : ref.entry.parts))
            : before.length > 0 && line(t('Vorher'), partList(before))}
          {after.length > 0 && line(t('Danach'), partList(after))}
          {ownNumbered.length > 0 && before.length === 0 && after.length === 0 && (
            <span style={{ fontSize: 12.5, color: muted }}>{t('Alle Teile in dieser Serie')}</span>
          )}
        </button>
      );
    };

    const visibleMain = showAll ? main : main.slice(0, VISIBLE);

    return (
      <section
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: isMobile ? 14 : 18,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 15,
              fontWeight: 800,
              color: currentTheme.text.primary,
            }}
          >
            <SwapHorizRounded style={{ fontSize: 20, color: accent }} />
            {t('Crossover')}
          </span>
          {main.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: muted, lineHeight: 1.4 }}>
              {t(
                'Diese Folgen gehören zu Geschichten über mehrere Serien. Tippen zeigt die ganze Reihenfolge.'
              )}
            </p>
          )}
        </div>

        {main.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleMain.map(renderMain)}
          </div>
        )}

        {main.length > VISIBLE && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            style={{
              marginTop: 8,
              width: '100%',
              minHeight: 36,
              padding: '6px 10px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              color: secondary,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {showAll ? t('Weniger anzeigen') : t('Alle {n} anzeigen', { n: main.length })}
            {showAll ? (
              <ExpandLess style={{ fontSize: 18 }} />
            ) : (
              <ExpandMore style={{ fontSize: 18 }} />
            )}
          </button>
        )}

        {guests.length > 0 && (
          <div
            style={{
              marginTop: main.length > 0 ? 10 : 0,
              paddingTop: main.length > 0 ? 10 : 0,
              borderTop: main.length > 0 ? `1px solid ${border}` : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => setShowGuests((v) => !v)}
              aria-expanded={showGuests}
              style={{
                width: '100%',
                minHeight: 36,
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: secondary,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <span>{t('Gastauftritte aus anderen Serien ({n})', { n: guests.length })}</span>
              {showGuests ? (
                <ExpandLess style={{ fontSize: 18 }} />
              ) : (
                <ExpandMore style={{ fontSize: 18 }} />
              )}
            </button>
            {showGuests && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                {guests.map(({ ref, own }) => {
                  const ownNumbered = own.filter((p) => p.s !== undefined);
                  const others = ref.entry.parts.filter((p) => p.id !== seriesId);
                  return (
                    <button
                      key={ref.id}
                      type="button"
                      onClick={() => onOpen(ref.id)}
                      style={{
                        width: '100%',
                        minHeight: 36,
                        padding: '6px 4px',
                        border: 'none',
                        background: 'transparent',
                        color: currentTheme.text.primary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 10,
                        fontSize: 12.5,
                        textAlign: 'left',
                      }}
                    >
                      {ownNumbered.length > 0 ? (
                        <>
                          <span style={{ minWidth: 64, fontWeight: 700 }}>
                            {ownNumbered.map((p, i) => partChip(p, i, false))}
                          </span>
                          <span style={{ color: secondary }}>
                            {t('mit Figuren aus {series}', {
                              series: others.map((p) => partTitle(p, allSeriesList)).join(', '),
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 600 }}>{partList(others)}</span>
                          <span style={{ color: secondary }}>
                            {t('Figuren aus dieser Serie zu Gast')}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          {addButton(false)}
        </div>
      </section>
    );
  }
);

CrossoverSection.displayName = 'CrossoverSection';
