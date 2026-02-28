export interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

export type TabType =
  | 'genre'
  | 'provider'
  | 'heatmap'
  | 'activity'
  | 'trends'
  | 'serien'
  | 'insights';
