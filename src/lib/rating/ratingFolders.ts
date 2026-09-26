export type FolderItemKind = 'series' | 'movie';

export const RATING_FOLDER_NAME_MAX = 40;

export interface StoredRatingFolder {
  name?: string;
  createdAt?: number;
  items?: Record<string, boolean>;
}

export interface RatingFolder {
  id: string;
  name: string;
  createdAt: number;
  items: Set<string>;
}

export const folderItemKey = (kind: FolderItemKind, id: number | string): string =>
  `${kind === 'series' ? 's' : 'm'}_${id}`;

export const normalizeFolderName = (name: string): string =>
  name.replace(/\s+/g, ' ').trim().slice(0, RATING_FOLDER_NAME_MAX);

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
    folders.push({ id, name: value.name, createdAt: value.createdAt ?? 0, items });
  }
  return folders.sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name));
}

export function compactRatingFolder(
  name: string,
  items: Iterable<string>,
  createdAt: number
): StoredRatingFolder {
  const record: Record<string, boolean> = {};
  for (const key of items) record[key] = true;
  return { name: normalizeFolderName(name), createdAt, items: record };
}
