import { t } from '../../services/i18n';

export type FolderItemKind = 'series' | 'movie';

export const RATING_FOLDER_NAME_MAX = 40;
export const REWATCH_FOLDER_ID = 'rewatch';
export const REWATCH_FOLDER_NAME = 'Nochmal schauen';

export interface StoredRatingFolder {
  name?: string;
  createdAt?: number;
  items?: Record<string, boolean>;
  shared?: boolean;
}

export interface RatingFolder {
  id: string;
  name: string;
  createdAt: number;
  items: Set<string>;
  shared?: boolean;
}

export const folderItemKey = (kind: FolderItemKind, id: number | string): string =>
  `${kind === 'series' ? 's' : 'm'}_${id}`;

export const normalizeFolderName = (name: string): string =>
  name.replace(/\s+/g, ' ').trim().slice(0, RATING_FOLDER_NAME_MAX);

export const isRewatchFolder = (folder: { id: string } | string): boolean =>
  (typeof folder === 'string' ? folder : folder.id) === REWATCH_FOLDER_ID;

export const folderDisplayName = (folder: RatingFolder): string =>
  isRewatchFolder(folder) ? t('Nochmal schauen') : folder.name;

const compareFolders = (a: RatingFolder, b: RatingFolder): number =>
  Number(isRewatchFolder(b)) - Number(isRewatchFolder(a)) ||
  a.createdAt - b.createdAt ||
  a.name.localeCompare(b.name);

export function expandRatingFolders(
  raw: Record<string, StoredRatingFolder> | null | undefined
): RatingFolder[] {
  if (!raw || typeof raw !== 'object') return [];
  const folders: RatingFolder[] = [];
  for (const [id, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object' || !value.name) continue;
    const items = new Set(
      Object.entries(value.items ?? {})
        .filter(([, on]) => on === true)
        .map(([key]) => key)
    );
    if (isRewatchFolder(id) && items.size === 0) continue;
    folders.push({
      id,
      name: value.name,
      createdAt: value.createdAt ?? 0,
      items,
      shared: value.shared === true,
    });
  }
  return folders.sort(compareFolders);
}

/** Stellt die eingebaute Rewatch-Liste voran, auch wenn sie noch nie gespeichert wurde. */
export function withRewatchFolder(folders: RatingFolder[]): RatingFolder[] {
  if (folders.some(isRewatchFolder)) return folders;
  return [
    { id: REWATCH_FOLDER_ID, name: REWATCH_FOLDER_NAME, createdAt: 0, items: new Set() },
    ...folders,
  ];
}

export function compactRatingFolder(
  name: string,
  items: Iterable<string>,
  createdAt: number,
  shared = false
): StoredRatingFolder {
  const record: Record<string, boolean> = {};
  for (const key of items) record[key] = true;
  const folder: StoredRatingFolder = { name: normalizeFolderName(name), createdAt, items: record };
  if (shared) folder.shared = true;
  return folder;
}
