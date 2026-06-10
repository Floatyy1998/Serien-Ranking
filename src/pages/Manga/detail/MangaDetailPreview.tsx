import { Add, MenuBook } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PageHeader, PageLayout } from '../../../components/ui';
import type { AniListMangaSearchResult } from '../../../types/Manga';
import type { ThemeContextType } from '../../../contexts/ThemeContextDef';
import { ANILIST_STATUS_LABELS, getDisplayFormat } from '../mangaUtils';
import { Section, SectionTitle } from './Section';

interface MangaDetailPreviewProps {
  anilistData: AniListMangaSearchResult;
  currentTheme: ThemeContextType['currentTheme'];
  onAdd: () => void | Promise<void>;
  anilistId: number;
}

/** Shown when the manga is not yet in the user's collection (AniList preview + add button). */
export const MangaDetailPreview = ({
  anilistData,
  currentTheme,
  onAdd,
  anilistId,
}: MangaDetailPreviewProps) => {
  const previewFormat = getDisplayFormat(anilistData.countryOfOrigin, anilistData.format);
  const previewDesc = (anilistData.description || '').replace(/<[^>]*>/g, '');
  const previewTitle = anilistData.title.english || anilistData.title.romaji;

  return (
    <PageLayout>
      {anilistData.bannerImage && (
        <div className="manga-detail-banner">
          <img src={anilistData.bannerImage} alt="" />
          <div className="manga-detail-banner-fade" />
        </div>
      )}

      <PageHeader
        title={previewTitle}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        subtitle={previewFormat}
        icon={<MenuBook />}
      />

      <div className="manga-detail-content">
        <div className="manga-detail-info-row">
          <img
            className="manga-detail-poster"
            src={anilistData.coverImage.large}
            alt={previewTitle}
            style={{ viewTransitionName: `poster-manga-${anilistId}` }}
          />
          <div className="manga-detail-info">
            {anilistData.title.romaji && anilistData.title.romaji !== previewTitle && (
              <div
                className="manga-detail-alt-title"
                style={{ color: currentTheme.text.secondary }}
              >
                {anilistData.title.romaji}
              </div>
            )}
            <div className="manga-detail-meta">
              {anilistData.status && (
                <span className="manga-detail-meta-item">
                  {ANILIST_STATUS_LABELS[anilistData.status] || anilistData.status}
                </span>
              )}
              {anilistData.chapters && (
                <span className="manga-detail-meta-item">{anilistData.chapters} Kapitel</span>
              )}
              {anilistData.volumes && (
                <span className="manga-detail-meta-item">{anilistData.volumes} Bände</span>
              )}
              {anilistData.averageScore && (
                <span className="manga-detail-meta-item">⭐ {anilistData.averageScore}%</span>
              )}
            </div>
            {anilistData.genres && anilistData.genres.length > 0 && (
              <div className="manga-detail-genres">
                {anilistData.genres.slice(0, 5).map((g) => (
                  <span
                    key={g}
                    className="manga-detail-genre"
                    style={{
                      background: `${currentTheme.primary}20`,
                      color: currentTheme.primary,
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAdd}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 14,
            border: 'none',
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
            boxShadow: `var(--glow-primary), 0 4px 20px ${currentTheme.primary}55`,
          }}
        >
          <Add style={{ fontSize: 20 }} />
          Zur Sammlung hinzufügen
        </motion.button>

        {previewDesc && (
          <Section bg={`${currentTheme.text.primary}08`} delay={0.1}>
            <SectionTitle color={currentTheme.text.primary}>Beschreibung</SectionTitle>
            <p className="manga-detail-description" style={{ color: currentTheme.text.secondary }}>
              {previewDesc}
            </p>
          </Section>
        )}
      </div>
    </PageLayout>
  );
};
