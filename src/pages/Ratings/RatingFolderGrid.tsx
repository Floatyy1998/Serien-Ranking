import { ArrowBack, DeleteOutlined, EditOutlined, ListAlt, PlaylistAdd } from '@mui/icons-material';
import React from 'react';
import { BottomSheet } from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContext';
import { useLongPress } from '../../hooks/ui/useLongPress';
import { hapticTap } from '../../lib/interaction/haptics';
import type { RatingFolder } from '../../lib/rating/ratingFolders';
import { t } from '../../services/i18n';
import type { FolderPreview } from './useRatingsData';
import './RatingFolders.css';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

const EMPTY_PREVIEW: FolderPreview = { count: 0, posters: [] };

const FolderCollage = ({ posters, theme }: { posters: string[]; theme: Theme }) => {
  if (posters.length === 0) {
    return (
      <div className="rf-collage rf-collage--empty" style={{ color: theme.text.muted }}>
        <ListAlt style={{ fontSize: 44 }} />
      </div>
    );
  }
  const cells = posters.slice(0, 4);
  return (
    <div className={`rf-collage rf-collage--${cells.length}`}>
      {cells.map((src, i) => (
        <img key={i} className="rf-collage__img" src={src} alt="" loading="lazy" />
      ))}
    </div>
  );
};

export const RatingFolderGrid = React.memo(
  ({
    theme,
    folders,
    previews,
    onOpen,
    onCreate,
    onLongPress,
  }: {
    theme: Theme;
    folders: RatingFolder[];
    previews: Record<string, FolderPreview>;
    onOpen: (id: string) => void;
    onCreate: () => void;
    onLongPress: (folder: RatingFolder) => void;
  }) => {
    const longPress = useLongPress<RatingFolder>((folder) => {
      hapticTap();
      onLongPress(folder);
    });
    return (
      <div className="rf-grid">
        {folders.map((folder) => {
          const preview = previews[folder.id] ?? EMPTY_PREVIEW;
          return (
            <button
              key={folder.id}
              type="button"
              className="rf-card"
              onClick={() => onOpen(folder.id)}
              aria-label={folder.name}
              {...longPress(folder)}
            >
              <div className="rf-card__art" style={{ borderColor: theme.border.default }}>
                <FolderCollage posters={preview.posters} theme={theme} />
              </div>
              <span className="rf-card__name" style={{ color: theme.text.primary }}>
                {folder.name}
              </span>
              <span className="rf-card__count" style={{ color: theme.text.muted }}>
                {preview.count === 1 ? t('1 Titel') : t('{n} Titel', { n: preview.count })}
              </span>
            </button>
          );
        })}
        <button type="button" className="rf-card" onClick={onCreate}>
          <div
            className="rf-card__art rf-card__art--new"
            style={{ borderColor: theme.border.default, color: theme.text.muted }}
          >
            <PlaylistAdd style={{ fontSize: 40 }} />
          </div>
          <span className="rf-card__name" style={{ color: theme.text.secondary }}>
            {t('Neue Liste')}
          </span>
          <span className="rf-card__count" style={{ color: theme.text.muted }}>
            {folders.length === 0 ? t('z. B. Marvel oder Lieblingsfilme') : ' '}
          </span>
        </button>
      </div>
    );
  }
);

RatingFolderGrid.displayName = 'RatingFolderGrid';

export const RatingFolderBar = ({
  theme,
  folder,
  count,
  onBack,
  onEdit,
}: {
  theme: Theme;
  folder: RatingFolder;
  count: number;
  onBack: () => void;
  onEdit: () => void;
}) => (
  <div className="rf-bar">
    <button
      type="button"
      className="rf-icon-btn"
      onClick={onBack}
      aria-label={t('Alle Listen')}
      style={{ borderColor: theme.border.default, color: theme.text.secondary }}
    >
      <ArrowBack style={{ fontSize: 20 }} />
    </button>
    <div className="rf-bar__text">
      <span className="rf-bar__name" style={{ color: theme.text.primary }}>
        {folder.name}
      </span>
      <span className="rf-bar__count" style={{ color: theme.text.muted }}>
        {count === 1 ? t('1 Titel') : t('{n} Titel', { n: count })}
      </span>
    </div>
    <button
      type="button"
      className="rf-chip"
      onClick={onEdit}
      style={{ borderColor: theme.border.default, color: theme.text.secondary }}
    >
      <EditOutlined className="rf-chip__icon" />
      {t('Bearbeiten')}
    </button>
  </div>
);

export const RatingFolderActionsSheet = ({
  theme,
  folder,
  onClose,
  onEdit,
  onDelete,
}: {
  theme: Theme;
  folder: RatingFolder | null;
  onClose: () => void;
  onEdit: (folder: RatingFolder) => void;
  onDelete: (folder: RatingFolder) => void;
}) => (
  <BottomSheet isOpen={!!folder} onClose={onClose} ariaLabel={folder?.name ?? t('Listen')}>
    {folder && (
      <div className="rf-sheet rf-actions-sheet">
        <h3 className="rf-sheet__title" style={{ color: theme.text.secondary }}>
          {folder.name}
        </h3>
        <button
          type="button"
          className="rf-action"
          onClick={() => {
            onClose();
            onEdit(folder);
          }}
          style={{ borderColor: theme.border.default, color: theme.text.primary }}
        >
          <EditOutlined style={{ fontSize: 22 }} />
          {t('Bearbeiten')}
        </button>
        <button
          type="button"
          className="rf-action"
          onClick={() => {
            onClose();
            onDelete(folder);
          }}
          style={{ borderColor: theme.border.default, color: theme.status.error }}
        >
          <DeleteOutlined style={{ fontSize: 22 }} />
          {t('Liste löschen')}
        </button>
      </div>
    )}
  </BottomSheet>
);
