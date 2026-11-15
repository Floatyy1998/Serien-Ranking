import Check from '@mui/icons-material/Check';
import SearchRounded from '@mui/icons-material/SearchRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import { memo, type CSSProperties } from 'react';
import { t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';

export interface PreviewColors {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface PreviewTitle {
  title: string;
  poster?: string;
}

interface ThemePreviewProps {
  colors: PreviewColors;
  titles: PreviewTitle[];
  name?: string;
}

const PROGRESS = [72, 38];
const RATINGS = ['8.6', '7.9', '9.1', '7.4', '8.2'];

const Poster = ({ item, index }: { item?: PreviewTitle; index: number }) =>
  item?.poster ? (
    <img src={getImageUrl(item.poster, 'w185')} alt="" loading="lazy" />
  ) : (
    <span className={`tp-blank tp-blank--${index % 3}`} />
  );

/** Die App im Kleinen, gefärbt mit den übergebenen Farben: zeigt sofort, was eine Farbe verändert. */
export const ThemePreview = memo(({ colors, titles, name }: ThemePreviewProps) => {
  const vars = {
    '--tp-primary': colors.primary,
    '--tp-accent': colors.accent,
    '--tp-bg': colors.background,
    '--tp-surface': colors.surface,
    '--tp-text': colors.text,
  } as CSSProperties;
  const rows = [titles[0], titles[1]];
  const rail = [titles[2], titles[3], titles[4], titles[5], titles[6]];

  return (
    <div className="tp" style={vars} aria-hidden>
      <div className="tp-head">
        <span className="tp-greet">{name || 'TV-Rank'}</span>
        <span className="tp-search">
          <SearchRounded />
          {t('Titel oder Schauspieler')}
        </span>
        <span className="tp-avatar" />
      </div>

      <div className="tp-figures tp-full">
        <span>
          <strong>1.284</strong>
          {t('Episoden')}
        </span>
        <span>
          <strong>96</strong>
          {t('Filme')}
        </span>
        <span className="is-hot">
          <strong>3</strong>
          {t('Heute')}
        </span>
      </div>

      <p className="tp-h tp-full">{t('Weiterschauen')}</p>
      <div className="tp-rows tp-full">
        {rows.map((item, i) => (
          <div key={i} className="tp-row">
            <span className="tp-row__poster">
              <Poster item={item} index={i} />
            </span>
            <span className="tp-row__text">
              <span className="tp-row__title">{item?.title || t('Serie')}</span>
              <span className="tp-row__sub">S2 E{i + 4}</span>
              <span className="tp-row__bar">
                <i style={{ width: `${PROGRESS[i]}%` }} />
              </span>
            </span>
            <span className="tp-row__check">
              <Check />
            </span>
          </div>
        ))}
      </div>

      <p className="tp-h">{t('Trending diese Woche')}</p>
      <div className="tp-rail">
        {rail.map((item, i) => (
          <span key={i} className="tp-card">
            <Poster item={item} index={i + 1} />
            <span className="tp-card__rank">{i + 1}</span>
            <span className="tp-card__score">
              <StarRounded />
              {RATINGS[i]}
            </span>
          </span>
        ))}
      </div>

      <div className="tp-actions">
        <span className="tp-btn tp-btn--primary">
          <Check />
          {t('Als gesehen markieren')}
        </span>
        <span className="tp-btn tp-btn--on">{t('Auf Watchlist')}</span>
        <span className="tp-btn">{t('Teilen')}</span>
      </div>
    </div>
  );
});

ThemePreview.displayName = 'ThemePreview';
