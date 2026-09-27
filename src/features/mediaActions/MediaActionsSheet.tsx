import {
  Add,
  ArrowBack,
  CheckCircle,
  PlaylistAdd,
  RadioButtonUnchecked,
  Star,
  Visibility,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import type { MediaTarget } from '../../lib/interaction/mediaTarget';
import { folderItemKey, type RatingFolder } from '../../lib/rating/ratingFolders';
import { t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';
import '../../pages/Ratings/RatingFolders.css';
import './MediaActions.css';

export interface MediaActionsState {
  target: MediaTarget;
  title: string;
  poster?: string;
  owned: boolean;
  rating: number;
  watched: boolean;
}

export const MediaActionsSheet = ({
  state,
  folders,
  busy,
  onClose,
  onAdd,
  onRate,
  onMarkWatched,
  onToggleFolder,
  onCreateFolder,
}: {
  state: MediaActionsState | null;
  folders: RatingFolder[];
  busy: boolean;
  onClose: () => void;
  onAdd: () => void;
  onRate: () => void;
  onMarkWatched: () => void;
  onToggleFolder: (folder: RatingFolder) => void;
  onCreateFolder: () => void;
}) => {
  const { currentTheme: theme } = useTheme();
  const [view, setView] = useState<'menu' | 'folders'>('menu');
  const targetKey = state ? `${state.target.type}-${state.target.id}` : '';

  useEffect(() => {
    if (targetKey) setView('menu');
  }, [targetKey]);

  const key = state ? folderItemKey(state.target.type, state.target.id) : '';
  const memberCount = state ? folders.filter((f) => f.items.has(key)).length : 0;
  const isMovie = state?.target.type === 'movie';
  const actionStyle = { borderColor: theme.border.default, color: theme.text.primary };
  const poster = state?.poster ? getImageUrl(state.poster, 'w154', '') : '';

  return (
    <BottomSheet
      isOpen={!!state}
      onClose={onClose}
      ariaLabel={state?.title ?? ''}
      maxHeight="80vh"
      maxWidth="520px"
    >
      {state && (
        <div className="rf-sheet rf-actions-sheet" aria-busy={busy}>
          <div className="ma-head">
            {poster && <img className="ma-head__poster" src={poster} alt="" />}
            <div className="ma-head__text">
              <span className="ma-head__title" style={{ color: theme.text.primary }}>
                {state.title}
              </span>
              <span className="ma-head__meta" style={{ color: theme.text.muted }}>
                {isMovie ? t('Film') : t('Serie')}
                {state.owned ? ` · ${t('In deiner Bibliothek')}` : ''}
              </span>
            </div>
          </div>

          {view === 'menu' ? (
            <>
              {!state.owned && (
                <button
                  type="button"
                  className="rf-action"
                  disabled={busy}
                  onClick={onAdd}
                  style={actionStyle}
                >
                  <Add style={{ fontSize: 22, color: theme.primary }} />
                  {isMovie ? t('Zu meinen Filmen hinzufügen') : t('Zu meinen Serien hinzufügen')}
                </button>
              )}
              <button
                type="button"
                className="rf-action"
                disabled={busy}
                onClick={onRate}
                style={actionStyle}
              >
                <Star style={{ fontSize: 22, color: theme.accent }} />
                {state.rating > 0 ? t('Bewertung ändern') : t('Bewerten')}
              </button>
              {isMovie && !state.watched && (
                <button
                  type="button"
                  className="rf-action"
                  disabled={busy}
                  onClick={onMarkWatched}
                  style={actionStyle}
                >
                  <Visibility style={{ fontSize: 22, color: theme.primary }} />
                  {t('Als gesehen markieren')}
                </button>
              )}
              <button
                type="button"
                className="rf-action"
                disabled={busy}
                onClick={() => setView('folders')}
                style={actionStyle}
              >
                <PlaylistAdd style={{ fontSize: 22, color: theme.primary }} />
                <span className="rf-action__label">{t('Zu Liste hinzufügen')}</span>
                {memberCount > 0 && (
                  <span className="rf-action__meta" style={{ color: theme.text.muted }}>
                    {memberCount === 1 ? t('in 1 Liste') : t('in {n} Listen', { n: memberCount })}
                  </span>
                )}
              </button>
              {busy && (
                <p className="ma-busy" style={{ color: theme.text.muted }}>
                  {t('Wird hinzugefügt …')}
                </p>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className="rf-action rf-action--quiet"
                onClick={() => setView('menu')}
                style={{ borderColor: 'transparent', color: theme.text.muted }}
              >
                <ArrowBack style={{ fontSize: 20 }} />
                {t('Zurück')}
              </button>
              {folders.map((folder) => {
                const isIn = folder.items.has(key);
                return (
                  <button
                    key={folder.id}
                    type="button"
                    className="rf-action"
                    aria-pressed={isIn}
                    disabled={busy}
                    onClick={() => onToggleFolder(folder)}
                    style={{
                      borderColor: isIn ? theme.primary : theme.border.default,
                      background: isIn ? `${theme.primary}1f` : undefined,
                      color: theme.text.primary,
                    }}
                  >
                    {isIn ? (
                      <CheckCircle style={{ fontSize: 22, color: theme.primary }} />
                    ) : (
                      <RadioButtonUnchecked style={{ fontSize: 22, color: theme.text.muted }} />
                    )}
                    <span className="rf-action__label">{folder.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                className="rf-action"
                disabled={busy}
                onClick={onCreateFolder}
                style={{
                  borderColor: theme.border.default,
                  borderStyle: 'dashed',
                  color: theme.text.secondary,
                }}
              >
                <Add style={{ fontSize: 22 }} />
                {t('Neue Liste')}
              </button>
              {!state.owned && (
                <p className="ma-busy" style={{ color: theme.text.muted }}>
                  {isMovie
                    ? t('Der Film wird dabei zu deinen Filmen hinzugefügt.')
                    : t('Die Serie wird dabei zu deinen Serien hinzugefügt.')}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
};
