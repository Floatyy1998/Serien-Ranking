import { CheckCircle, Link as LinkIcon, OpenInNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { t } from '../../../services/i18n';
import type { AniListMangaSearchResult } from '../../../types/Manga';
import { getDisplayFormat } from '../mangaUtils';
import { COUNTRY_LABELS, RELATION_LABELS, type MangaHeroData } from './mangaDetailData';
import { Section, SectionTitle } from './Section';

interface MangaInfoSectionsProps {
  data: MangaHeroData;
  anilist: AniListMangaSearchResult | null;
  isMobile: boolean;
  ownedIds: Set<number>;
  /** Hauptspalte (Handlung, Verwandte, Empfehlungen) oder Seitenleiste (Details, Links). */
  part: 'main' | 'side';
}

interface PosterLink {
  id: number;
  title: string;
  poster: string;
  label?: string;
}

const PosterGrid = ({ items, ownedIds }: { items: PosterLink[]; ownedIds: Set<number> }) => {
  const navigate = useNavigate();
  return (
    <div className="md-poster-grid">
      {items.map((item) => (
        <div
          key={item.id}
          className="md-poster"
          role="button"
          tabIndex={0}
          aria-label={t('{title} öffnen', { title: item.title })}
          onClick={() => navigate(`/manga/${item.id}`)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(`/manga/${item.id}`);
            }
          }}
        >
          <div className="md-poster-art">
            <img src={item.poster} alt={item.title} loading="lazy" decoding="async" />
            {ownedIds.has(item.id) && (
              <span className="md-poster-owned" title={t('In deiner Sammlung')}>
                <CheckCircle style={{ fontSize: 14 }} />
              </span>
            )}
          </div>
          {item.label && <div className="md-poster-label">{item.label}</div>}
          <div className="md-poster-title">{item.title}</div>
        </div>
      ))}
    </div>
  );
};

export const MangaInfoSections = ({
  data,
  anilist,
  isMobile,
  ownedIds,
  part,
}: MangaInfoSectionsProps) => {
  const relations: PosterLink[] = (anilist?.relations?.edges || [])
    .filter((e) => e.node.type === 'MANGA')
    .map((e) => ({
      id: e.node.id,
      title: e.node.title.english || e.node.title.romaji,
      poster: e.node.coverImage.large,
      label: RELATION_LABELS[e.relationType] || e.relationType.replace(/_/g, ' ').toLowerCase(),
    }));

  const recommendationPool = (anilist?.recommendations?.edges || [])
    .map((e) => e.node.mediaRecommendation)
    .filter(Boolean);
  // Volle Reihen (6 Spalten Desktop, 3 mobil) statt eines einsamen Nachzüglers.
  const recommendationCount =
    recommendationPool.length >= 12
      ? 12
      : recommendationPool.length >= 6
        ? 6
        : recommendationPool.length;
  const recommendations: PosterLink[] = recommendationPool
    .slice(0, recommendationCount)
    .map((m) => ({
      id: m.id,
      title: m.title.english || m.title.romaji,
      poster: m.coverImage.large,
      label: getDisplayFormat(undefined, m.format),
    }));

  const details: [string, string][] = [
    [t('Format'), data.formatLabel],
    [t('Herkunft'), data.countryOfOrigin ? COUNTRY_LABELS[data.countryOfOrigin] || '' : ''],
    [t('Status'), data.statusLabel],
    [t('Erschienen ab'), data.startLabel],
    [t('Kapitel'), data.chapters ? String(data.chapters) : ''],
    [t('Bände'), data.volumes ? String(data.volumes) : ''],
    [t('AniList-Wertung'), data.score ? `${data.score}%` : ''],
    [t('Autor & Zeichner'), data.authors.join(', ')],
  ].filter(([, value]) => !!value) as [string, string][];

  const externalLinks = (anilist?.externalLinks || []).slice(0, 8);

  if (part === 'side') {
    return (
      <>
        {details.length > 0 && (
          <Section delay={0.14} order={6}>
            <SectionTitle>{t('Details')}</SectionTitle>
            <dl className="md-facts">
              {details.map(([label, value]) => (
                <div key={label} className="md-fact">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        <Section delay={0.26} order={9}>
          <SectionTitle>{t('Lesen & Links')}</SectionTitle>
          <div className="md-links">
            <a
              href={`https://anilist.co/manga/${data.anilistId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="manga-detail-link-btn md-link--primary"
            >
              <LinkIcon style={{ fontSize: 15 }} /> AniList
              <OpenInNew style={{ fontSize: 12, opacity: 0.5 }} />
            </a>
            {externalLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="manga-detail-link-btn"
              >
                <LinkIcon style={{ fontSize: 15 }} /> {link.site}
                <OpenInNew style={{ fontSize: 12, opacity: 0.5 }} />
              </a>
            ))}
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      {isMobile && data.description && (
        <Section delay={0.1} order={5}>
          <SectionTitle>{t('Handlung')}</SectionTitle>
          <p className="manga-detail-description">{data.description}</p>
        </Section>
      )}

      {relations.length > 0 && (
        <Section delay={0.18} order={7}>
          <SectionTitle>{t('Verwandte Titel')}</SectionTitle>
          <PosterGrid items={relations} ownedIds={ownedIds} />
        </Section>
      )}

      {recommendations.length > 0 && (
        <Section delay={0.22} order={8}>
          <SectionTitle>{t('Das könnte dir auch gefallen')}</SectionTitle>
          <PosterGrid items={recommendations} ownedIds={ownedIds} />
        </Section>
      )}
    </>
  );
};
