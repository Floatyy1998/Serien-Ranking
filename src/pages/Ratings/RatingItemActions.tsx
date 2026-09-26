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
import { useAuth } from '../../contexts/AuthContext';
import type { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';
import type { RatingFolder } from '../../lib/rating/ratingFolders';
import { t } from '../../services/i18n';
import { setRatingFolderItem } from '../../services/rating/ratingFoldersService';
import { itemFolderKey } from './ratingsHelpers';
import type { PreparedItem } from './useRatingsData';
import './RatingFolders.css';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

export const RatingItemActions = ({
  theme,
  item,
  folders,
  onClose,
  onRate,
  onMarkWatched,
  onCreateFolder,
}: {
  theme: Theme;
  item: PreparedItem | null;
  folders: RatingFolder[];
  onClose: () => void;
  onRate: (item: PreparedItem) => void;
  onMarkWatched: (item: PreparedItem) => void;
  onCreateFolder: (item: PreparedItem) => void;
}) => {
  const { user } = useAuth() || {};
  const [view, setView] = useState<'menu' | 'folders'>('menu');

  useEffect(() => {
    if (item) setView('menu');
  }, [item]);

  const key = item ? itemFolderKey(item) : '';
  const memberCount = item ? folders.filter((f) => f.items.has(key)).length : 0;

  const toggleFolder = async (folder: RatingFolder) => {
    if (!user || !item) return;
    hapticTap();
    try {
      await setRatingFolderItem(user.uid, folder.id, key, !folder.items.has(key));
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
    }
  };

  const actionStyle = { borderColor: theme.border.default, color: theme.text.primary };

  return (
    <BottomSheet isOpen={!!item} onClose={onClose} ariaLabel={item?.title ?? ''} maxHeight="80vh">
      {item && (
        <div className="rf-sheet rf-actions-sheet">
          <h3 className="rf-sheet__title" style={{ color: theme.text.secondary }}>
            {item.title}
          </h3>

          {view === 'menu' ? (
            <>
              <button
                type="button"
                className="rf-action"
                onClick={() => {
                  onClose();
                  onRate(item);
                }}
                style={actionStyle}
              >
                <Star style={{ fontSize: 22, color: theme.accent }} />
                {item.rating > 0 ? t('Bewertung ändern') : t('Bewerten')}
              </button>
              {item.isMovie && !item.watched && (
                <button
                  type="button"
                  className="rf-action"
                  onClick={() => {
                    onClose();
                    onMarkWatched(item);
                  }}
                  style={actionStyle}
                >
                  <Visibility style={{ fontSize: 22, color: theme.primary }} />
                  {t('Als gesehen markieren')}
                </button>
              )}
              <button
                type="button"
                className="rf-action"
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
                    onClick={() => void toggleFolder(folder)}
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
                onClick={() => {
                  onClose();
                  onCreateFolder(item);
                }}
                style={{
                  borderColor: theme.border.default,
                  borderStyle: 'dashed',
                  color: theme.text.secondary,
                }}
              >
                <Add style={{ fontSize: 22 }} />
                {t('Neue Liste')}
              </button>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
};
