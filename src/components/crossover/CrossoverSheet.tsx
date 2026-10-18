import CheckCircle from '@mui/icons-material/CheckCircle';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import ReportOutlined from '@mui/icons-material/ReportOutlined';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { ADMIN_UID } from '../../config/admin';
import { useAuth } from '../../contexts/AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { partWatchState } from '../../lib/crossover/crossoverIndex';
import { showToast } from '../../lib/interaction/toast';
import { tapScale } from '../../lib/motion';
import { deleteCrossover } from '../../services/crossover/crossoverService';
import { pickLocalized, t } from '../../services/i18n';
import { addToLibrary } from '../../services/series/addToLibrary';
import type { CrossoverEntry, CrossoverPart } from '../../types/Crossover';
import { getImageUrl } from '../../utils/imageUrl';
import { BottomSheet } from '../ui/overlay/BottomSheet';
import { kindDescription, kindLabel, partLabel, partTitle } from './crossoverLabels';

interface CrossoverSheetProps {
  isOpen: boolean;
  id: string | null;
  entry: CrossoverEntry | null;
  onClose: () => void;
  onEdit?: (id: string) => void;
  navigate: NavigateFunction;
}

export function CrossoverSheet({
  isOpen,
  id,
  entry,
  onClose,
  onEdit,
  navigate,
}: CrossoverSheetProps) {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { allSeriesList, refetchAfterAdd } = useSeriesList();
  const [adding, setAdding] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [kindInfo, setKindInfo] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmDelete(false);
      setKindInfo(false);
    }
  }, [isOpen]);

  if (!entry || !id) return null;

  const muted = currentTheme.text?.muted || 'rgba(255,255,255,0.5)';
  const secondary = currentTheme.text?.secondary || 'rgba(255,255,255,0.7)';
  const tone = currentTheme.accent || currentTheme.primary;
  const border = currentTheme.border?.default || 'rgba(255,255,255,0.12)';
  const isAdmin = user?.uid === ADMIN_UID;
  const canEdit = !!user && (isAdmin || entry.createdBy === user.uid);
  const note = entry.note ? pickLocalized(entry.note, entry.noteL) : '';

  const openPart = (part: CrossoverPart) => {
    const inList = allSeriesList.some((s) => s.id === part.id);
    onClose();
    if (inList && part.s !== undefined && part.e !== undefined) {
      navigate(`/episode/${part.id}/s/${part.s}/e/${part.e}`);
    } else {
      navigate(`/series/${part.id}`);
    }
  };

  const addPart = async (part: CrossoverPart, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || adding) return;
    setAdding(part.id);
    try {
      const result = await addToLibrary(
        user.uid,
        { id: part.id, type: 'series', title: part.t, posterPath: part.p },
        'crossover'
      );
      if (result === 'added') {
        void refetchAfterAdd(part.id);
        showToast(t('„{title}" hinzugefügt', { title: part.t }));
      } else if (result === 'exists') {
        showToast(t('Serie ist bereits in deiner Liste!'));
      } else {
        showToast(t('Fehler beim Hinzufügen der Serie.'), 3000, 'error');
      }
    } catch {
      showToast(t('Fehler beim Hinzufügen der Serie.'), 3000, 'error');
    } finally {
      setAdding(null);
    }
  };

  const remove = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteCrossover(id);
      showToast(t('Crossover gelöscht'));
      onClose();
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 3000, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const suggestFix = () => {
    const params = new URLSearchParams({
      create: 'true',
      type: 'bug',
      title: `Crossover: ${entry.title}`,
      description: `Crossover-ID: ${id}\n\n`,
    });
    onClose();
    navigate(`/bug-report?${params.toString()}`);
  };

  const actionStyle = (color: string): React.CSSProperties => ({
    flex: 1,
    minHeight: 44,
    padding: '10px 12px',
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
    borderRadius: 12,
    color,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel={entry.title} maxHeight="90vh">
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 9px',
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: tone,
              background: `color-mix(in srgb, ${tone} 10%, transparent)`,
              border: `1px solid color-mix(in srgb, ${tone} 45%, transparent)`,
            }}
          >
            {kindLabel(entry.kind)}
          </span>
          <button
            type="button"
            onClick={() => setKindInfo((v) => !v)}
            aria-expanded={kindInfo}
            aria-label={t('Was bedeutet das?')}
            title={t('Was bedeutet das?')}
            style={{
              minWidth: 28,
              minHeight: 28,
              width: 28,
              height: 28,
              padding: 0,
              marginLeft: 4,
              verticalAlign: 'middle',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: kindInfo ? tone : muted,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <InfoOutlined style={{ fontSize: 17 }} />
          </button>
          {kindInfo && (
            <p style={{ fontSize: 12.5, lineHeight: 1.45, color: secondary, margin: '6px 0 0' }}>
              {kindDescription(entry.kind)}
            </p>
          )}
          <h3 style={{ fontSize: 19, fontWeight: 700, margin: '10px 0 4px' }}>{entry.title}</h3>
          {(entry.franchise || entry.year) && (
            <p style={{ fontSize: 13, color: muted, margin: 0 }}>
              {[entry.franchise, entry.year].filter(Boolean).join(' · ')}
            </p>
          )}
          {note && (
            <p style={{ fontSize: 13.5, lineHeight: 1.45, color: secondary, margin: '10px 0 0' }}>
              {note}
            </p>
          )}
        </div>

        <p
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: muted,
            margin: '0 0 8px',
          }}
        >
          {t('In dieser Reihenfolge schauen')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entry.parts.map((part, i) => {
            const state = partWatchState(part, allSeriesList);
            const watched = state === 'watched';
            const notInList = state === 'not-in-list';
            return (
              <motion.button
                key={`${part.id}-${i}`}
                type="button"
                whileTap={tapScale}
                onClick={() => openPart(part)}
                style={{
                  width: '100%',
                  minHeight: 56,
                  padding: '8px 10px',
                  background: currentTheme.background?.surface || 'rgba(255,255,255,0.05)',
                  border: `1px solid ${watched ? `color-mix(in srgb, ${currentTheme.primary} 45%, transparent)` : border}`,
                  borderRadius: 12,
                  color: currentTheme.text?.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 10,
                  textAlign: 'left',
                  opacity: notInList ? 0.85 : 1,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: watched ? currentTheme.primary : muted,
                    background: watched
                      ? `color-mix(in srgb, ${currentTheme.primary} 18%, transparent)`
                      : 'rgba(255,255,255,0.07)',
                  }}
                >
                  {i + 1}
                </span>
                {part.p ? (
                  <img
                    src={getImageUrl(part.p, 'w92')}
                    alt=""
                    loading="lazy"
                    style={{
                      width: 32,
                      height: 48,
                      objectFit: 'cover',
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      width: 32,
                      height: 48,
                      borderRadius: 6,
                      flexShrink: 0,
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  />
                )}
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {partTitle(part, allSeriesList)}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: secondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {partLabel(part)}
                  </span>
                  {notInList && (
                    <span style={{ fontSize: 11.5, color: muted }}>
                      {t('Nicht in deiner Liste')}
                    </span>
                  )}
                </span>
                {notInList ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => void addPart(part, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void addPart(part, e as unknown as React.MouseEvent);
                      }
                    }}
                    style={{
                      flexShrink: 0,
                      padding: '7px 11px',
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: currentTheme.primary,
                      background: `color-mix(in srgb, ${currentTheme.primary} 14%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${currentTheme.primary} 40%, transparent)`,
                      opacity: adding === part.id ? 0.6 : 1,
                    }}
                  >
                    {adding === part.id ? t('Wird hinzugefügt...') : t('Hinzufügen')}
                  </span>
                ) : watched ? (
                  <CheckCircle
                    style={{ fontSize: 22, color: currentTheme.primary, flexShrink: 0 }}
                    aria-label={t('Gesehen')}
                  />
                ) : state === 'unwatched' ? (
                  <RadioButtonUnchecked
                    style={{ fontSize: 22, color: muted, flexShrink: 0 }}
                    aria-label={t('Noch nicht gesehen')}
                  />
                ) : null}
              </motion.button>
            );
          })}
        </div>

        {entry.source !== 'seed' && entry.createdBy !== ADMIN_UID && (
          <p style={{ fontSize: 11.5, color: muted, margin: '12px 0 0' }}>
            {t('Von der Community ergänzt')}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={() => onEdit?.(id)}
                style={actionStyle(currentTheme.primary)}
              >
                <EditOutlined style={{ fontSize: 18 }} />
                {t('Bearbeiten')}
              </button>
              <button
                type="button"
                onClick={() => void remove()}
                disabled={deleting}
                style={actionStyle(currentTheme.status?.error || '#ef4444')}
              >
                <DeleteOutlined style={{ fontSize: 18 }} />
                {confirmDelete ? t('Wirklich löschen?') : t('Löschen')}
              </button>
            </>
          ) : (
            <button type="button" onClick={suggestFix} style={actionStyle(secondary)}>
              <ReportOutlined style={{ fontSize: 18 }} />
              {t('Korrektur vorschlagen')}
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
