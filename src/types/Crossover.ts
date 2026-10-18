/** Gemeinsame Crossover-Datenbank (RTDB `crossovers/$id`), von allen Nutzern erweiterbar. */

export type CrossoverKind = 'crossover' | 'backdoor' | 'guest' | 'order';

export interface CrossoverPart {
  /** TMDB-Serien-ID (Katalog-Schlüssel). */
  id: number;
  /** Serientitel — damit Teile auch ohne Katalogeintrag lesbar bleiben. */
  t: string;
  /** Staffel (1-basiert, wie in der App angezeigt); fehlt bei „ganze Serie“. */
  s?: number;
  /** Folge (1-basiert); fehlt bei „ganze Staffel“/„ganze Serie“. */
  e?: number;
  /** Folgentitel. */
  n?: string;
  /** TMDB-Posterpfad. */
  p?: string;
}

export interface CrossoverEntry {
  title: string;
  kind: CrossoverKind;
  franchise?: string;
  year?: number;
  /** Teile in Sehreihenfolge. */
  parts: CrossoverPart[];
  /** Hinweis (deutscher Quelltext) + Übersetzungen. */
  note?: string;
  noteL?: Partial<Record<string, string>>;
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
  source?: 'seed' | 'community';
  /** Nutzer-Einträge warten auf Freigabe; ohne Feld gilt ein Eintrag als freigegeben. */
  status?: CrossoverStatus;
}

export type CrossoverStatus = 'pending' | 'approved';

export type CrossoverMap = Record<string, CrossoverEntry>;

export const CROSSOVER_KINDS: CrossoverKind[] = ['crossover', 'backdoor', 'guest', 'order'];
