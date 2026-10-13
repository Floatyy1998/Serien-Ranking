import { Theaters } from '@mui/icons-material';
import React from 'react';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ShowBookSuggestion } from '../../../hooks/books/useBasedOnBooks';
import { t } from '../../../services/i18n';
import { getImageUrl } from '../../../utils/imageUrl';
import { useOpenByTitle } from '../discover/DiscoverParts';
import '../discover/discover.css';
import { pauseOffscreen } from '../components/pauseOffscreen';

interface Props {
  suggestions: ShowBookSuggestion[];
  title?: string;
  loading?: boolean;
}

/** Vorlagen deiner Serien und Filme — die Brücke von „Schauen" zu „Lesen". */
export const ForYourShowsSection: React.FC<Props> = ({ suggestions, title, loading }) => {
  const { currentTheme } = useTheme();
  const { open, busyKey } = useOpenByTitle();
  if (suggestions.length === 0 && !loading) return null;

  return (
    <section className="bk-section">
      <SectionHeader
        icon={<Theaters />}
        iconColor={currentTheme.status.purple}
        title={title ?? t('Bücher zu deinen Serien')}
      />
      <HorizontalScrollContainer scrollerClassName="bk-carousel" scrollerStyle={{ gap: 12 }}>
        {suggestions.length === 0 &&
          [0, 1, 2].map((i) => (
            <div
              key={i}
              ref={pauseOffscreen}
              className="bk-source-card"
              aria-hidden
              style={{ cursor: 'default' }}
            >
              <div className="dsc-skeleton" style={{ width: 58 }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="dsc-skeleton-line" style={{ width: 70 }} />
                <span className="dsc-skeleton-line" style={{ width: 140 }} />
                <span className="dsc-skeleton-line" style={{ width: 100 }} />
              </span>
            </div>
          ))}
        {suggestions.slice(0, 16).map(({ book, shows }) => (
          <button
            key={book.wikidataId}
            type="button"
            className="bk-source-card"
            onClick={() => void open(book.title, book.author)}
            style={{ opacity: busyKey === `${book.title}|${book.author ?? ''}` ? 0.55 : 1 }}
          >
            <span className="bk-source-posters" aria-hidden>
              {shows.slice(0, 2).map((s) => (
                <img
                  key={`${s.kind}-${s.tmdbId}`}
                  src={getImageUrl(s.poster, 'w154')}
                  alt=""
                  loading="lazy"
                />
              ))}
            </span>
            <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span className="bk-source-kicker" style={{ color: currentTheme.status.purple }}>
                {book.isSeries ? t('Buchreihe') : t('Roman')}
              </span>
              <span
                className="bk-item-title"
                style={{ color: currentTheme.text.secondary, fontSize: 14.5 }}
              >
                {book.title}
              </span>
              {book.author && (
                <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
                  {book.author}
                </span>
              )}
              <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
                {t('Vorlage zu {title}', { title: shows[0].title })}
                {shows.length > 1 ? ` +${shows.length - 1}` : ''}
              </span>
            </span>
          </button>
        ))}
      </HorizontalScrollContainer>
    </section>
  );
};
