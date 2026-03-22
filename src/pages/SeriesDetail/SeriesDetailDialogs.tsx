import Check from '@mui/icons-material/Check';
import { Dialog } from '../../components/ui';
import { DiscussionThread } from '../../components/Discussion';
import { EpisodeActionSheet } from './EpisodeActionSheet';

import type { SeriesEpisode } from './types';

interface SeriesDetailDialogsProps {
  series: any;
  showRewatchDialog: any;
  setShowRewatchDialog: (val: any) => void;
  handleEpisodeRewatch: (episode: SeriesEpisode) => Promise<void>;
  handleEpisodeUnwatch: (episode: SeriesEpisode) => Promise<void>;
  dialog: any;
  setDialog: (val: any) => void;
  snackbar: { open: boolean; message: string };
  currentTheme: any;
  navigate: (path: string) => void;
}

export const SeriesDetailDialogs: React.FC<SeriesDetailDialogsProps> = ({
  series,
  showRewatchDialog,
  setShowRewatchDialog,
  handleEpisodeRewatch,
  handleEpisodeUnwatch,
  dialog,
  setDialog,
  snackbar,
  currentTheme,
  navigate,
}) => (
  <>
    {/* Episode Action Sheet */}
    <EpisodeActionSheet
      isOpen={showRewatchDialog.show}
      episode={showRewatchDialog.item}
      seriesTitle={series?.title || series?.name || ''}
      seasonNumber={showRewatchDialog.seasonNumber || 1}
      episodeNumber={showRewatchDialog.episodeNumber || 1}
      onRewatch={handleEpisodeRewatch}
      onUnwatch={handleEpisodeUnwatch}
      onNavigateToDiscussion={() => {
        const sn = showRewatchDialog.seasonNumber || 1;
        const en = showRewatchDialog.episodeNumber || 1;
        setShowRewatchDialog({ show: false, type: 'episode', item: null });
        navigate(`/episode/${series?.id}/s/${sn}/e/${en}`);
      }}
      onClose={() => setShowRewatchDialog({ show: false, type: 'episode', item: null })}
    />

    {/* Discussion Thread */}
    {series && (
      <div style={{ padding: '0 20px 20px' }}>
        <DiscussionThread
          itemId={series.id}
          itemType="series"
          feedMetadata={{
            itemTitle: series.title || series.name || 'Unbekannte Serie',
            posterPath:
              series.poster && typeof series.poster === 'object' ? series.poster.poster : undefined,
          }}
        />
      </div>
    )}

    {/* Dialog */}
    <Dialog
      open={dialog.open}
      onClose={() => setDialog({ ...dialog, open: false })}
      title={
        dialog.type === 'warning'
          ? 'Bestätigung'
          : dialog.type === 'error'
            ? 'Fehler'
            : 'Information'
      }
      message={dialog.message}
      type={dialog.type}
      actions={
        dialog.onConfirm
          ? [
              {
                label: 'Abbrechen',
                onClick: () => setDialog({ ...dialog, open: false }),
                variant: 'secondary',
              },
              { label: 'Bestätigen', onClick: dialog.onConfirm, variant: 'primary' },
            ]
          : []
      }
    />

    {/* Snackbar */}
    {snackbar.open && (
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(20px + env(safe-area-inset-bottom))',
          left: '20px',
          right: '20px',
          background: currentTheme.status.success,
          color: currentTheme.text.secondary,
          padding: '16px 20px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          zIndex: 1000,
          fontSize: '15px',
          fontWeight: 600,
          boxShadow: currentTheme.shadow.card,
        }}
      >
        <Check style={{ fontSize: '20px' }} />
        <span>{snackbar.message}</span>
      </div>
    )}
  </>
);
