import { showToast, showUndoToast } from '../../lib/interaction/toast';
import type { RatingFolder } from '../../lib/rating/ratingFolders';
import { t } from '../../services/i18n';
import {
  deleteRatingFolder,
  restoreRatingFolder,
} from '../../services/rating/ratingFoldersService';

export async function deleteFolderWithUndo(
  uid: string,
  folder: RatingFolder,
  onDeleted: (id: string) => void
): Promise<void> {
  try {
    await deleteRatingFolder(uid, folder.id);
    onDeleted(folder.id);
    showUndoToast(t('Liste gelöscht'), () => void restoreRatingFolder(uid, folder));
  } catch {
    showToast(t('Löschen fehlgeschlagen'), 2500, 'error');
  }
}
