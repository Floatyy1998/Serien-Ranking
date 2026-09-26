import {
  CheckCircle,
  DeleteOutlined,
  Movie as MovieIcon,
  RadioButtonUnchecked,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { BottomSheet, SearchInput } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticSuccess, hapticTap } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';
import {
  RATING_FOLDER_NAME_MAX,
  folderItemKey,
  normalizeFolderName,
  type FolderItemKind,
  type RatingFolder,
} from '../../lib/rating/ratingFolders';
import { t } from '../../services/i18n';
import { createRatingFolder, saveRatingFolder } from '../../services/rating/ratingFoldersService';
import { deleteFolderWithUndo } from './deleteFolderWithUndo';
import { getImageUrl } from '../../utils/imageUrl';
import './RatingFolders.css';

export type RatingFolderSheetState =
  { open: false } | { open: true; folder: RatingFolder | null; preselect?: string[] };

type KindFilter = 'all' | 'series' | 'movie' | 'selected';

interface Candidate {
  key: string;
  kind: FolderItemKind;
  title: string;
  poster?: string;
}

export const RatingFolderSheet = ({
  state,
  onClose,
  onSaved,
  onDeleted,
}: {
  state: RatingFolderSheetState;
  onClose: () => void;
  onSaved?: (id: string) => void;
  onDeleted: (id: string) => void;
}) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const folder = state.open ? state.folder : null;
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state.open) return;
    const initial = new Set(state.folder?.items ?? state.preselect ?? []);
    setName(state.folder?.name ?? '');
    setQuery('');
    setKind('all');
    setSelected(initial);
    setPinned(initial);
    setSaving(false);
  }, [state]);

  const candidates = useMemo<Candidate[]>(() => {
    const list: Candidate[] = [
      ...allSeriesList.map((s) => ({
        key: folderItemKey('series', s.id),
        kind: 'series' as const,
        title: s.title || s.name || '',
        poster: s.poster?.poster,
      })),
      ...movieList.map((m) => ({
        key: folderItemKey('movie', m.id),
        kind: 'movie' as const,
        title: m.title || '',
        poster: m.poster?.poster,
      })),
    ];
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }, [allSeriesList, movieList]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = candidates.filter((c) => {
      if (kind === 'selected' && !selected.has(c.key)) return false;
      if ((kind === 'series' || kind === 'movie') && c.kind !== kind) return false;
      return !q || c.title.toLowerCase().includes(q);
    });
    return [
      ...filtered.filter((c) => pinned.has(c.key)),
      ...filtered.filter((c) => !pinned.has(c.key)),
    ];
  }, [candidates, query, kind, selected, pinned]);

  const toggle = (key: string) => {
    hapticTap();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const trimmedName = normalizeFolderName(name);
  const canSave = !!user && !!trimmedName && !saving;

  const handleSave = async () => {
    if (!user || !trimmedName) return;
    setSaving(true);
    try {
      if (folder) {
        await saveRatingFolder(user.uid, folder, trimmedName, selected);
        onSaved?.(folder.id);
      } else {
        const id = await createRatingFolder(user.uid, trimmedName, selected);
        onSaved?.(id);
        showToast(t('Liste „{name}" angelegt', { name: trimmedName }), 2000);
      }
      hapticSuccess();
      onClose();
    } catch {
      setSaving(false);
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
    }
  };

  const handleDelete = async () => {
    if (!user || !folder) return;
    onClose();
    await deleteFolderWithUndo(user.uid, folder, onDeleted);
  };

  const kindChips: { id: KindFilter; label: string }[] = [
    { id: 'all', label: t('Alle') },
    { id: 'series', label: t('Serien') },
    { id: 'movie', label: t('Filme') },
    { id: 'selected', label: t('Ausgewählt ({n})', { n: selected.size }) },
  ];

  const title = folder ? t('Liste bearbeiten') : t('Neue Liste');

  return (
    <BottomSheet isOpen={state.open} onClose={onClose} ariaLabel={title} maxHeight="90vh">
      <div className="rf-sheet">
        <h3 className="rf-sheet__title" style={{ color: currentTheme.text.secondary }}>
          {title}
        </h3>

        <label className="rf-field">
          <span className="rf-label" style={{ color: currentTheme.text.muted }}>
            {t('Name')}
          </span>
          <input
            className="rf-input"
            value={name}
            maxLength={RATING_FOLDER_NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('z. B. Marvel oder Lieblingsfilme')}
            style={{ borderColor: currentTheme.border.default, color: currentTheme.text.primary }}
          />
        </label>

        <div className="rf-kinds" role="group" aria-label={t('Filter')}>
          {kindChips.map((chip) => {
            const active = kind === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                className="rf-chip rf-chip--small"
                aria-pressed={active}
                onClick={() => setKind(chip.id)}
                style={
                  active
                    ? {
                        background: currentTheme.primary,
                        borderColor: currentTheme.primary,
                        color: currentTheme.background.default,
                      }
                    : {
                        borderColor: currentTheme.border.default,
                        color: currentTheme.text.secondary,
                      }
                }
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t('Serie oder Film suchen...')}
        />

        <div className="rf-results" role="list">
          {visible.length === 0 ? (
            <p className="rf-muted" style={{ color: currentTheme.text.muted }}>
              {candidates.length === 0
                ? t('Deine Liste ist noch leer. Füge erst Serien oder Filme hinzu.')
                : t('Nichts in deiner Liste gefunden')}
            </p>
          ) : (
            visible.map((item) => {
              const isOn = selected.has(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  role="listitem"
                  aria-pressed={isOn}
                  className="rf-result"
                  onClick={() => toggle(item.key)}
                  style={{
                    borderColor: isOn ? currentTheme.primary : currentTheme.border.default,
                    background: isOn ? `${currentTheme.primary}1f` : undefined,
                  }}
                >
                  <img
                    className="rf-poster"
                    src={getImageUrl(item.poster, 'w92')}
                    alt=""
                    loading="lazy"
                  />
                  <span className="rf-result__body">
                    <span
                      className="rf-result__title"
                      style={{ color: currentTheme.text.secondary }}
                    >
                      {item.title}
                    </span>
                    <span className="rf-result__kind" style={{ color: currentTheme.text.muted }}>
                      {item.kind === 'series' ? (
                        <Tv style={{ fontSize: 14 }} />
                      ) : (
                        <MovieIcon style={{ fontSize: 14 }} />
                      )}
                      {item.kind === 'series' ? t('Serie') : t('Film')}
                    </span>
                  </span>
                  {isOn ? (
                    <CheckCircle className="rf-check" style={{ color: currentTheme.primary }} />
                  ) : (
                    <RadioButtonUnchecked
                      className="rf-check"
                      style={{ color: currentTheme.text.muted }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="rf-actions" style={{ background: currentTheme.background.surface }}>
          {folder && (
            <motion.button
              type="button"
              whileTap={{ opacity: 0.7 }}
              className="rf-btn rf-btn--ghost"
              onClick={() => void handleDelete()}
              aria-label={t('Liste löschen')}
              style={{ borderColor: currentTheme.border.default, color: currentTheme.text.muted }}
            >
              <DeleteOutlined style={{ fontSize: 20 }} />
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={{ opacity: 0.7 }}
            className="rf-btn rf-btn--primary"
            disabled={!canSave}
            onClick={() => void handleSave()}
            style={{ background: currentTheme.primary, color: currentTheme.background.default }}
          >
            {folder
              ? t('Speichern ({n})', { n: selected.size })
              : t('Liste anlegen ({n})', { n: selected.size })}
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
};
