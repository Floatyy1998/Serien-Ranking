import { t } from '../../services/i18n';
import type { CrossoverKind, CrossoverPart } from '../../types/Crossover';
import { partCode } from '../../lib/crossover/crossoverIndex';

export const kindLabel = (kind: CrossoverKind): string => {
  switch (kind) {
    case 'backdoor':
      return t('Backdoor-Pilot');
    case 'guest':
      return t('Gastauftritt');
    case 'order':
      return t('Sehreihenfolge');
    default:
      return t('Mehrteiler');
  }
};

/** Ein Satz, was die Art für den Zuschauer bedeutet (Info im Editor und im Sheet). */
export const kindDescription = (kind: CrossoverKind): string => {
  switch (kind) {
    case 'backdoor':
      return t(
        'Eine neue Serie wird in Folgen einer anderen Serie eingeführt. Diese Folgen sind ihre Vorgeschichte und gehören vor die erste Folge.'
      );
    case 'guest':
      return t(
        'Figuren aus einer anderen Serie tauchen kurz auf. Nett zu wissen, zum Verstehen aber nicht nötig.'
      );
    case 'order':
      return t('Empfohlene Reihenfolge ganzer Staffeln über mehrere Serien hinweg.');
    default:
      return t(
        'Eine Geschichte läuft über Folgen mehrerer Serien. Sie ergibt nur zusammen und in dieser Reihenfolge Sinn.'
      );
  }
};

/** Serientitel aus der eigenen Liste (Katalog-Schreibweise), sonst der gespeicherte. */
export const partTitle = (
  part: CrossoverPart,
  seriesList: ReadonlyArray<{ id: number; title?: string }>
): string => seriesList.find((s) => s.id === part.id)?.title || part.t;

/** „S5 E9 · Folgentitel“, „S2 · Ganze Staffel“, Special-Titel oder „Ganze Serie“. */
export const partLabel = (part: CrossoverPart): string => {
  const code = partCode(part);
  if (!code) return part.n || t('Ganze Serie');
  if (part.e === undefined) return `${code} · ${t('Ganze Staffel')}`;
  return part.n ? `${code} · ${part.n}` : code;
};

/** TMDB-Posterpfad aus den Poster-Formen der App (Pfad oder volle URL). */
export const tmdbPosterPath = (poster: string | { poster?: string } | undefined | null) => {
  const raw = typeof poster === 'object' && poster ? poster.poster : poster;
  if (!raw) return undefined;
  if (raw.startsWith('/')) return raw;
  const idx = raw.indexOf('/t/p/');
  if (idx < 0) return undefined;
  const rest = raw.slice(idx + 5);
  const slash = rest.indexOf('/');
  return slash >= 0 ? rest.slice(slash) : undefined;
};
