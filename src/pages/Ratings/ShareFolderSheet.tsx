import { IosShare, LinkOff, LinkOutlined } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import type { useTheme } from '../../contexts/ThemeContext';
import { showToast } from '../../lib/interaction/toast';
import type { RatingFolder } from '../../lib/rating/ratingFolders';
import {
  buildSharedListPayload,
  sharedListSignature,
  sharedListUrl,
} from '../../lib/rating/sharedList';
import { t } from '../../services/i18n';
import {
  publishSharedList,
  rememberSharedListSignature,
  resolveOwnerName,
  unpublishSharedList,
} from '../../services/rating/sharedListService';
import { renderListCollage } from '../../services/share/listCollage';
import { shareLink } from '../../services/share/shareLink';
import { copyTextToClipboard } from '../../utils/clipboard';
import { listSubtitle } from '../SharedList/listSubtitle';
import './RatingFolders.css';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

interface Prepared {
  folderId: string;
  image: Blob | null;
  previewUrl: string | null;
  count: number;
  ownerName: string;
}

const isAbort = (err: unknown) => (err as DOMException)?.name === 'AbortError';

export const ShareFolderSheet = ({
  theme,
  folder,
  onClose,
}: {
  theme: Theme;
  folder: RatingFolder | null;
  onClose: () => void;
}) => {
  const { user } = useAuth() || {};
  const { isMobile } = useDeviceType();
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [failed, setFailed] = useState(false);

  const folderId = folder?.id;
  useEffect(() => {
    if (!folder || !user) return;
    let cancelled = false;
    let previewUrl: string | null = null;
    setPrepared(null);
    setFailed(false);
    (async () => {
      const ownerName = await resolveOwnerName(user);
      const payload = buildSharedListPayload(folder, allSeriesList, movieList, {
        uid: user.uid,
        name: ownerName,
      });
      try {
        await publishSharedList(folder.id, payload);
        rememberSharedListSignature(folder.id, sharedListSignature(payload));
      } catch {
        if (!cancelled) setFailed(true);
        return;
      }
      const count = payload.items.length;
      const image = await renderListCollage({
        name: folder.name,
        subtitle: listSubtitle(ownerName, count),
        posterPaths: payload.items.filter((i) => i.p).map((i) => i.p as string),
      }).catch(() => null);
      if (cancelled) return;
      previewUrl = image ? URL.createObjectURL(image) : null;
      setPrepared({ folderId: folder.id, image, previewUrl, count, ownerName });
    })();
    return () => {
      cancelled = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // Nur beim Öffnen vorbereiten; spätere Änderungen übernimmt SharedListSync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, user?.uid]);

  const ready = prepared && prepared.folderId === folderId ? prepared : null;

  const handleShare = async () => {
    if (!folder || !ready) return;
    const url = sharedListUrl(folder.id);
    const text = t('Schau dir meine Liste „{name}" auf TV-RANK an', { name: folder.name });

    if (ready.image && typeof navigator.canShare === 'function') {
      const file = new File([ready.image], 'liste.jpg', { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: folder.name, text: `${text}\n${url}` });
          onClose();
          return;
        } catch (err) {
          if (isAbort(err)) return;
        }
      }
    }

    const result = await shareLink({ url, title: folder.name, text });
    if (result === 'shared') onClose();
    else if (result === 'copied') showToast(t('Link kopiert!'), 2000);
  };

  const handleCopy = async () => {
    if (!folder) return;
    const ok = await copyTextToClipboard(sharedListUrl(folder.id));
    showToast(
      ok ? t('Link kopiert!') : t('Kopieren fehlgeschlagen'),
      2000,
      ok ? undefined : 'error'
    );
  };

  const handleStop = async () => {
    if (!folder || !user) return;
    try {
      await unpublishSharedList(user.uid, folder.id);
      showToast(t('Liste wird nicht mehr geteilt'), 2500);
      onClose();
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
    }
  };

  const linkText = folder ? sharedListUrl(folder.id).replace(/^https:\/\//, '') : '';

  return (
    <BottomSheet
      isOpen={!!folder}
      onClose={onClose}
      ariaLabel={t('Liste teilen')}
      maxWidth={isMobile ? undefined : 'min(1040px, 94vw)'}
    >
      {folder && (
        <div className="rf-sheet rf-actions-sheet rf-share">
          <div className="rf-share__preview" style={{ borderColor: theme.border.default }}>
            {ready?.previewUrl ? (
              <img src={ready.previewUrl} alt={folder.name} />
            ) : (
              <div className="rf-share__placeholder" style={{ color: theme.text.muted }}>
                {failed ? t('Link konnte nicht erstellt werden') : t('Vorschau wird erstellt …')}
              </div>
            )}
          </div>

          <div className="rf-share__side">
            <div className="rf-share__head">
              <h3 className="rf-share__title" style={{ color: theme.text.primary }}>
                {t('Liste teilen')}
              </h3>
              <p className="rf-share__hint" style={{ color: theme.text.muted }}>
                {t(
                  'Jeder mit dem Link sieht die Liste, auch ohne Konto. Änderungen an der Liste werden automatisch übernommen.'
                )}
              </p>
            </div>

            <div
              className="rf-share__link"
              style={{ borderColor: theme.border.default, color: theme.text.secondary }}
            >
              <LinkOutlined style={{ fontSize: 20, color: theme.text.muted }} />
              <span className="rf-share__url">{linkText}</span>
              <button
                type="button"
                className="rf-chip rf-chip--small"
                disabled={!ready}
                onClick={() => void handleCopy()}
                style={{ borderColor: theme.border.default, color: theme.text.primary }}
              >
                {t('Link kopieren')}
              </button>
            </div>

            <button
              type="button"
              className="rf-btn rf-btn--primary"
              disabled={!ready}
              onClick={() => void handleShare()}
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                color: theme.background.default,
              }}
            >
              <IosShare style={{ fontSize: 20 }} />
              {t('Teilen')}
            </button>

            {(folder.shared || ready) && (
              <button
                type="button"
                className="rf-action rf-action--quiet rf-share__stop"
                onClick={() => void handleStop()}
                style={{ borderColor: 'transparent', color: theme.status.error }}
              >
                <LinkOff style={{ fontSize: 20 }} />
                {t('Teilen beenden')}
              </button>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
};
