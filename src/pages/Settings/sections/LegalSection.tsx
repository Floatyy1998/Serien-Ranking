import { Description, Gavel, Insights } from '@mui/icons-material';
import { memo, useCallback, useState } from 'react';
import { getAnalyticsConsent, setAnalyticsConsent } from '../../../services/firebase/analytics';
import { hapticSelect } from '../../../lib/interaction/haptics';
import { t } from '../../../services/i18n';
import { SBlock, SRow, SSwitch } from '../kit/SettingsKit';

const DATA_SOURCES = [
  { label: 'Streaming-Anbieter', link: 'https://www.justwatch.com', name: 'JustWatch' },
  { label: 'Episoden-Informationen', link: 'https://www.tvmaze.com', name: 'TVmaze' },
  { label: 'Film- & Seriendaten', link: 'https://www.themoviedb.org', name: 'TMDB' },
  { label: 'Bewertungen', link: 'https://www.imdb.com', name: 'IMDb' },
  { label: 'Manga- & Webtoon-Daten', link: 'https://anilist.co', name: 'AniList' },
  { label: 'Manga-Kapitel', link: 'https://www.mangaupdates.com', name: 'MangaUpdates' },
] as const;

interface LegalSectionProps {
  onNavigatePrivacy: () => void;
  onNavigateImpressum: () => void;
}

export const LegalSection = memo(
  ({ onNavigatePrivacy, onNavigateImpressum }: LegalSectionProps) => {
    const [analyticsEnabled, setAnalyticsEnabled] = useState(() => getAnalyticsConsent() === true);

    const handleAnalyticsToggle = useCallback((next: boolean) => {
      setAnalyticsEnabled(next);
      setAnalyticsConsent(next);
      hapticSelect();
    }, []);

    return (
      <>
        <SRow
          icon={Description}
          title={t('Datenschutzerklärung')}
          chevron
          onClick={onNavigatePrivacy}
        />
        <SRow icon={Gavel} title={t('Impressum')} chevron onClick={onNavigateImpressum} />
        <SRow
          icon={Insights}
          title={t('Nutzungsstatistiken')}
          subtitle={t('Kontobezogene Nutzungsdaten zur Verbesserung der App — keine Drittanbieter')}
          trailing={
            <SSwitch
              checked={analyticsEnabled}
              onChange={handleAnalyticsToggle}
              label={t('Nutzungsstatistiken')}
            />
          }
        />
        <SBlock>
          <span className="st-mini-title">{t('Datenquellen')}</span>
          <dl className="st-sources">
            {DATA_SOURCES.map((item) => (
              <div key={item.name}>
                <dt>{t(item.label)}</dt>
                <dd>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.name}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </SBlock>
      </>
    );
  }
);

LegalSection.displayName = 'LegalSection';
