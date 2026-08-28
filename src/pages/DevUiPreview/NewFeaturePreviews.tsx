/**
 * Vorschau-Zustände für die neuen Sektionen. Nur im Dev-Server sichtbar
 * (`/dev/ui-preview`) — echte Daten liegen erst vor, wenn genug geschaut wurde
 * bzw. das Backend das Abbruch-Aggregat schreibt.
 */

import { useTheme } from '../../contexts/ThemeContext';
import { CatchUpPlanNote } from '../Countdown/CatchUpPlanNote';
import { DropOffView } from '../SeriesDetail/DropOffSection';
import type { CatchUpPlan, CatchUpVariant } from '../../lib/catchUpPlan';
import type { DropOffInsight } from '../../lib/dropOff';
import '../Countdown/CountdownPage.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(Date.now() + days * DAY_MS);

const variant = (over: Partial<CatchUpVariant> = {}): CatchUpVariant => ({
  episodes: 41,
  hours: 28,
  projectedDate: inDays(133),
  willMakeIt: false,
  daysLate: 86,
  ...over,
});

const plan = (over: Partial<CatchUpPlan> = {}): CatchUpPlan => ({
  shouldShow: true,
  daysUntilTarget: 47,
  episodesPerWeek: 4.2,
  requiredPerWeek: 6.1,
  current: variant(),
  withoutFiller: null,
  fillerSavesIt: false,
  ...over,
});

const insight = (over: Partial<DropOffInsight> = {}): DropOffInsight => ({
  shouldShow: true,
  decided: 143,
  completionRate: 0.29,
  seasons: [
    { seasonNumber: 1, quitters: 12, share: 0.08 },
    { seasonNumber: 2, quitters: 61, share: 0.43 },
    { seasonNumber: 3, quitters: 20, share: 0.14 },
    { seasonNumber: 4, quitters: 8, share: 0.06 },
  ],
  worstSeason: { seasonNumber: 2, quitters: 61, share: 0.43 },
  holdPoint: { episodeNumber: 6, completionAfter: 0.89 },
  ...over,
});

const Case = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const { currentTheme } = useTheme();
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          margin: '0 0 6px 0',
          color: currentTheme.text.muted,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
};

/** Aufhol-Plan: die Zeile unter einem Countdown, in allen Ausprägungen. */
export const CatchUpPreview = () => (
  <div style={{ padding: 16 }}>
    <Case label="Tempo reicht nicht">
      <CatchUpPlanNote plan={plan()} />
    </Case>

    <Case label="Filler-Verzicht rettet den Termin">
      <CatchUpPlanNote
        plan={plan({
          current: variant({ episodes: 30, daysLate: 24 }),
          withoutFiller: variant({ episodes: 19, willMakeIt: true, daysLate: 0 }),
          fillerSavesIt: true,
        })}
      />
    </Case>

    <Case label="Filler hilft, reicht aber nicht">
      <CatchUpPlanNote
        plan={plan({
          withoutFiller: variant({ episodes: 30, daysLate: 40 }),
        })}
      />
    </Case>

    <Case label="Rechtzeitig durch">
      <CatchUpPlanNote
        plan={plan({
          requiredPerWeek: 1.2,
          current: variant({
            episodes: 6,
            willMakeIt: true,
            daysLate: 0,
            projectedDate: inDays(10),
          }),
        })}
      />
    </Case>

    <Case label="Kein Tempo messbar (pausiert)">
      <CatchUpPlanNote
        plan={plan({ episodesPerWeek: 0, current: variant({ projectedDate: null }) })}
      />
    </Case>

    <Case label="Kompakt (Listeneintrag)">
      <CatchUpPlanNote plan={plan()} compact />
    </Case>
  </div>
);

/** Aussteiger-Radar: Sektion auf der Serien-Detailseite. Kopfzeile klappt auf. */
export const DropOffPreview = () => {
  const { currentTheme } = useTheme();
  return (
    <div style={{ padding: 16 }}>
      <Case label="Serie bricht in Staffel 2 weg (aufklappbar)">
        <DropOffView insight={insight()} currentTheme={currentTheme} isMobile={false} />
      </Case>

      <Case label="Hält ihr Publikum">
        <DropOffView
          insight={insight({
            completionRate: 0.82,
            worstSeason: null,
            holdPoint: null,
            seasons: [
              { seasonNumber: 1, quitters: 9, share: 0.06 },
              { seasonNumber: 2, quitters: 7, share: 0.05 },
            ],
          })}
          currentTheme={currentTheme}
          isMobile={false}
        />
      </Case>

      <Case label="Harter Einstieg, danach stabil">
        <DropOffView
          insight={insight({
            completionRate: 0.55,
            worstSeason: null,
            holdPoint: { episodeNumber: 3, completionAfter: 0.91 },
          })}
          currentTheme={currentTheme}
          isMobile={false}
        />
      </Case>

      <Case label="Zu wenig Daten (rendert nichts)">
        <DropOffView insight={null} currentTheme={currentTheme} isMobile={false} />
      </Case>
    </div>
  );
};
