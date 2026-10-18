import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import Close from '@mui/icons-material/Close';
import Add from '@mui/icons-material/Add';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { showToast } from '../../lib/interaction/toast';
import {
  loadSeasonsForPicker,
  searchSeriesForPicker,
  type PickerSeason,
  type PickerSeries,
} from '../../services/crossover/crossoverPicker';
import { saveCrossover } from '../../services/crossover/crossoverService';
import { t } from '../../services/i18n';
import type { CrossoverEntry, CrossoverKind, CrossoverPart } from '../../types/Crossover';
import { CROSSOVER_KINDS } from '../../types/Crossover';
import { getImageUrl } from '../../utils/imageUrl';
import { BottomSheet } from '../ui/overlay/BottomSheet';
import { kindLabel, tmdbPosterPath } from './crossoverLabels';

export interface CrossoverPrefill {
  id: number;
  title: string;
  poster?: string;
  season?: number;
}

interface CrossoverEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Vorhandener Eintrag (Bearbeiten) oder null (Neu). */
  id: string | null;
  initial: CrossoverEntry | null;
  prefill?: CrossoverPrefill;
  onSaved?: (id: string) => void;
}

interface EditorPart extends CrossoverPart {
  key: number;
}

type SeasonState = PickerSeason[] | 'loading' | 'error';

let partKey = 1;
const nextKey = () => partKey++;

const toEditorParts = (parts: CrossoverPart[]): EditorPart[] =>
  parts.map((p) => ({ ...p, key: nextKey() }));

export function CrossoverEditorSheet({
  isOpen,
  onClose,
  id,
  initial,
  prefill,
  onSaved,
}: CrossoverEditorSheetProps) {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { allSeriesList } = useSeriesList();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<CrossoverKind>('crossover');
  const [note, setNote] = useState('');
  const [year, setYear] = useState('');
  const [franchise, setFranchise] = useState('');
  const [parts, setParts] = useState<EditorPart[]>([]);
  const [seasonsById, setSeasonsById] = useState<Record<number, SeasonState>>({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickerSeries[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setQuery('');
    setResults([]);
    if (initial) {
      setTitle(initial.title);
      setKind(initial.kind);
      setNote(initial.note || '');
      setYear(initial.year ? String(initial.year) : '');
      setFranchise(initial.franchise || '');
      setParts(toEditorParts(initial.parts));
      setSearchOpen(false);
    } else {
      setTitle('');
      setKind('crossover');
      setNote('');
      setYear('');
      setFranchise('');
      const first: EditorPart[] = prefill
        ? [
            {
              key: nextKey(),
              id: prefill.id,
              t: prefill.title,
              p: tmdbPosterPath(prefill.poster),
              s: prefill.season,
            },
          ]
        : [];
      setParts(first);
      setSearchOpen(first.length === 0);
    }
  }, [isOpen, id, initial, prefill]);

  useEffect(() => {
    if (!isOpen) return;
    for (const part of parts) {
      if (seasonsById[part.id] !== undefined) continue;
      setSeasonsById((prev) => ({ ...prev, [part.id]: 'loading' }));
      loadSeasonsForPicker(part.id)
        .then((seasons) => setSeasonsById((prev) => ({ ...prev, [part.id]: seasons })))
        .catch(() => setSeasonsById((prev) => ({ ...prev, [part.id]: 'error' })));
    }
  }, [isOpen, parts, seasonsById]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchSeriesForPicker(q)
        .then((hits) => {
          if (!cancelled) setResults(hits);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const localHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return allSeriesList
      .filter((s) => (s.title || '').toLowerCase().includes(q))
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        title: s.title,
        year: '',
        poster_path: tmdbPosterPath(s.poster) ?? null,
      }));
  }, [allSeriesList, query]);

  const mergedResults = useMemo(() => {
    const seen = new Set(localHits.map((h) => h.id));
    return [...localHits, ...results.filter((r) => !seen.has(r.id))];
  }, [localHits, results]);

  const muted = currentTheme.text?.muted || 'rgba(255,255,255,0.5)';
  const secondary = currentTheme.text?.secondary || 'rgba(255,255,255,0.7)';
  const border = currentTheme.border?.default || 'rgba(255,255,255,0.12)';
  const surface = currentTheme.background?.surface || 'rgba(255,255,255,0.05)';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: 'rgba(255,255,255,0.04)',
    color: currentTheme.text?.primary || '#fff',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: muted,
    margin: '14px 0 6px',
  };

  const iconBtn = (disabled?: boolean): React.CSSProperties => ({
    minWidth: 32,
    minHeight: 32,
    width: 32,
    height: 32,
    padding: 0,
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: 'transparent',
    color: disabled ? muted : secondary,
    cursor: disabled ? 'default' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.4 : 1,
  });

  const addPart = (hit: PickerSeries) => {
    setParts((prev) => [
      ...prev,
      { key: nextKey(), id: hit.id, t: hit.title, p: hit.poster_path || undefined },
    ]);
    setQuery('');
    setResults([]);
    setSearchOpen(false);
  };

  const updatePart = (key: number, patch: Partial<CrossoverPart>) =>
    setParts((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const movePart = (index: number, delta: number) =>
    setParts((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const removePart = (key: number) => setParts((prev) => prev.filter((p) => p.key !== key));

  const save = async () => {
    if (!user || saving) return;
    const cleanTitle = title.trim();
    if (cleanTitle.length < 2) {
      setError(t('Bitte einen Titel eingeben'));
      return;
    }
    const minParts = kind === 'crossover' || kind === 'order' ? 2 : 1;
    if (parts.length < minParts) {
      setError(minParts === 2 ? t('Mindestens zwei Teile nötig') : t('Mindestens ein Teil nötig'));
      return;
    }
    setError(null);
    setSaving(true);
    const yearNum = Number(year);
    const entry: CrossoverEntry = {
      title: cleanTitle,
      kind,
      parts: parts.map(({ key: _key, ...part }) => part),
      note: note.trim() || undefined,
      noteL: initial && initial.note === note.trim() ? initial.noteL : undefined,
      year: yearNum >= 1950 && yearNum <= 2100 ? yearNum : undefined,
      franchise: franchise.trim() || undefined,
      createdBy: initial?.createdBy || user.uid,
      createdAt: initial?.createdAt || Date.now(),
      updatedAt: Date.now(),
      source: initial?.source || 'community',
    };
    try {
      const savedId = await saveCrossover(id, entry);
      showToast(t('Crossover gespeichert'));
      onSaved?.(savedId);
      onClose();
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 3000, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderSeasonPicker = (part: EditorPart) => {
    const state = seasonsById[part.id];
    const seasons = Array.isArray(state) ? state : null;
    const season = seasons?.find((s) => s.number === part.s);
    const selectStyle: React.CSSProperties = { ...inputStyle, padding: '8px 10px', fontSize: 13 };
    if (state === 'error' || (seasons && seasons.length === 0)) {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t('Staffel')}
            value={part.s ?? ''}
            onChange={(e) =>
              updatePart(part.key, {
                s: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
            style={selectStyle}
          />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={t('Episode')}
            value={part.e ?? ''}
            onChange={(e) =>
              updatePart(part.key, {
                e: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
            style={selectStyle}
          />
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={part.s ?? ''}
          disabled={!seasons}
          aria-label={t('Staffel')}
          onChange={(e) => {
            const s = e.target.value === '' ? undefined : Number(e.target.value);
            updatePart(part.key, { s, e: undefined, n: undefined });
          }}
          style={selectStyle}
        >
          <option value="">{t('Ganze Serie')}</option>
          {(seasons || []).map((s) => (
            <option key={s.number} value={s.number}>
              {t('Staffel {n}', { n: s.number })}
            </option>
          ))}
        </select>
        <select
          value={part.e ?? ''}
          disabled={!season}
          aria-label={t('Episode')}
          onChange={(e) => {
            const num = e.target.value === '' ? undefined : Number(e.target.value);
            const ep = season?.episodes.find((x) => x.number === num);
            updatePart(part.key, { e: num, n: ep?.name || undefined });
          }}
          style={selectStyle}
        >
          <option value="">{t('Ganze Staffel')}</option>
          {(season?.episodes || []).map((ep) => (
            <option key={ep.number} value={ep.number}>
              E{ep.number}
              {ep.name ? ` · ${ep.name}` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={id ? t('Crossover bearbeiten') : t('Crossover ergänzen')}
      maxHeight="92vh"
    >
      <div style={{ padding: '0 20px 28px' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>
          {id ? t('Crossover bearbeiten') : t('Crossover ergänzen')}
        </h3>
        <p style={{ fontSize: 12.5, color: muted, margin: 0, lineHeight: 1.4 }}>
          {t('Alle sehen deinen Eintrag sofort. Bitte nur echte, ausgestrahlte Crossover.')}
        </p>

        <label style={labelStyle} htmlFor="crossover-title">
          {t('Titel')}
        </label>
        <input
          id="crossover-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('z. B. Crisis on Infinite Earths')}
          maxLength={120}
          style={inputStyle}
        />

        <span style={labelStyle}>{t('Art')}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CROSSOVER_KINDS.map((k) => {
            const active = k === kind;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                style={{
                  minHeight: 34,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${active ? currentTheme.primary : border}`,
                  background: active
                    ? `color-mix(in srgb, ${currentTheme.primary} 16%, transparent)`
                    : 'transparent',
                  color: active ? currentTheme.primary : secondary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {kindLabel(k)}
              </button>
            );
          })}
        </div>

        <span style={labelStyle}>{t('Teile in Sehreihenfolge')}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {parts.map((part, index) => (
            <div
              key={part.key}
              style={{
                padding: 10,
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: surface,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: muted, minWidth: 16 }}>
                  {index + 1}
                </span>
                {part.p ? (
                  <img
                    src={getImageUrl(part.p, 'w92')}
                    alt=""
                    style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 5 }}
                  />
                ) : (
                  <span
                    style={{
                      width: 28,
                      height: 42,
                      borderRadius: 5,
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  />
                )}
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {part.t}
                </span>
                <button
                  type="button"
                  aria-label={t('Nach oben')}
                  disabled={index === 0}
                  onClick={() => movePart(index, -1)}
                  style={iconBtn(index === 0)}
                >
                  <ArrowUpward style={{ fontSize: 16 }} />
                </button>
                <button
                  type="button"
                  aria-label={t('Nach unten')}
                  disabled={index === parts.length - 1}
                  onClick={() => movePart(index, 1)}
                  style={iconBtn(index === parts.length - 1)}
                >
                  <ArrowDownward style={{ fontSize: 16 }} />
                </button>
                <button
                  type="button"
                  aria-label={t('Entfernen')}
                  onClick={() => removePart(part.key)}
                  style={iconBtn()}
                >
                  <Close style={{ fontSize: 16 }} />
                </button>
              </div>
              <div style={{ marginTop: 8 }}>{renderSeasonPicker(part)}</div>
            </div>
          ))}
        </div>

        {searchOpen ? (
          <div style={{ marginTop: 10 }}>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Serie suchen')}
              autoFocus
              style={inputStyle}
            />
            {(mergedResults.length > 0 || searching) && (
              <div
                style={{
                  marginTop: 6,
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                  background: surface,
                  overflow: 'hidden',
                }}
              >
                {mergedResults.map((hit) => (
                  <button
                    key={hit.id}
                    type="button"
                    onClick={() => addPart(hit)}
                    style={{
                      width: '100%',
                      minHeight: 44,
                      padding: '6px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${border}`,
                      color: currentTheme.text?.primary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 10,
                      textAlign: 'left',
                    }}
                  >
                    {hit.poster_path ? (
                      <img
                        src={getImageUrl(hit.poster_path, 'w92')}
                        alt=""
                        style={{ width: 24, height: 36, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 24,
                          height: 36,
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.06)',
                        }}
                      />
                    )}
                    <span style={{ fontSize: 14, flex: 1, minWidth: 0 }}>{hit.title}</span>
                    {hit.year && <span style={{ fontSize: 12, color: muted }}>{hit.year}</span>}
                  </button>
                ))}
                {searching && (
                  <div style={{ padding: '8px 10px', fontSize: 12.5, color: muted }}>
                    {t('Suchen')}…
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchRef.current?.focus(), 50);
            }}
            style={{
              marginTop: 10,
              width: '100%',
              minHeight: 42,
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px dashed ${border}`,
              background: 'transparent',
              color: secondary,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Add style={{ fontSize: 18 }} />
            {t('Teil hinzufügen')}
          </button>
        )}

        <label style={labelStyle} htmlFor="crossover-note">
          {t('Hinweis (optional)')}
        </label>
        <textarea
          id="crossover-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="crossover-year">
              {t('Jahr (optional)')}
            </label>
            <input
              id="crossover-year"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={labelStyle} htmlFor="crossover-franchise">
              {t('Franchise (optional)')}
            </label>
            <input
              id="crossover-franchise"
              value={franchise}
              onChange={(e) => setFranchise(e.target.value)}
              maxLength={60}
              placeholder="Arrowverse, One Chicago, SOKO …"
              style={inputStyle}
            />
          </div>
        </div>

        {error && (
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 13,
              color: currentTheme.status?.error || '#ef4444',
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 12,
              border: `1px solid ${border}`,
              background: 'transparent',
              color: secondary,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('Abbrechen')}
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            style={{
              flex: 1,
              minHeight: 46,
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent || currentTheme.primary})`,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? t('Wird gespeichert…') : t('Speichern')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
