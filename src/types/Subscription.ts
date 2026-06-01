/**
 * Streaming-Abonnements: vom Nutzer gepflegte Liste der aktiven Provider
 * mit optionalem Monatspreis. Wird genutzt um ungenutzte Abos zu erkennen
 * und auf Lücken in der Watchlist hinzuweisen.
 *
 * Firebase-Pfad: users/{uid}/subscriptions
 */

export interface ProviderSubscription {
  active: boolean;
  monthlyPrice?: number;
  cancelIfUnused?: boolean;
}

export interface SubscriptionsConfig {
  providers: Record<string, ProviderSubscription>;
  /** Tage Inaktivität, ab denen ein Abo als ungenutzt gilt. Default 60. */
  unusedThresholdDays?: number;
  /** Pro-Serie Override: seriesId → Provider-Name. Überstimmt die Auto-Attribution. */
  seriesOverrides?: Record<string, string>;
}

export interface ProviderInsight {
  name: string;
  active: boolean;
  monthlyPrice: number;
  cancelIfUnused: boolean;
  lastWatchedAt: number | null;
  daysSinceLastWatch: number | null;
  recentCount: number;
  isUnused: boolean;
  /** Titel der zuletzt zugeordneten Episode/Serie (Debug-Hilfe) */
  lastWatchTitle: string | null;
  /** Letzte 5 zugeordnete Watches absteigend nach Zeit */
  recentWatches: { title: string; timestamp: number; seriesId: number | null }[];
}
