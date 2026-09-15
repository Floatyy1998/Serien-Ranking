import { Tune } from '@mui/icons-material';
import { useTheme } from '../../../contexts/ThemeContext';
import { hapticSelect } from '../../../lib/interaction/haptics';
import { t } from '../../../services/i18n';
import './GenreRatingDetails.css';

/** Feste Farben je Genre — Serien- und Film-Labels, damit die Regler unterscheidbar bleiben. */
const GENRE_COLORS: Record<string, string> = {
  Action: '#ff6b6b',
  'Action & Adventure': '#ff6b6b',
  Adventure: '#ffa94d',
  Animation: '#9775fa',
  Comedy: '#ffd43b',
  Crime: '#868e96',
  Documentary: '#4dabf7',
  Drama: '#f783ac',
  Family: '#69db7c',
  Fantasy: '#b197fc',
  History: '#c0a080',
  Horror: '#e03131',
  Kids: '#74c0fc',
  Music: '#f06595',
  Mystery: '#5c7cfa',
  News: '#adb5bd',
  Reality: '#ff922b',
  Romance: '#f06292',
  'Sci-Fi': '#4ecdc4',
  'Sci-Fi & Fantasy': '#4ecdc4',
  'Science Fiction': '#4ecdc4',
  Soap: '#e599f7',
  Talk: '#ffc078',
  Thriller: '#fa5252',
  War: '#8c7851',
  'War & Politics': '#8c7851',
  Western: '#d9a066',
};

interface GenreRatingDetailsProps {
  /** Genres des Titels — stehen oben und hängen am Gesamtregler. */
  ownGenres: string[];
  /** Alle übrigen Genres, standardmäßig unbewertet. */
  otherGenres: string[];
  /** Aktueller Wert je Genre (0 = unbewertet). */
  values: Record<string, number>;
  onChange: (genre: string, value: number) => void;
  /** Setzt die bewerteten Genres wieder auf den Gesamtwert. */
  onLevel: () => void;
  /** Gesamtwert, den `onLevel` herstellen würde. */
  overall: number;
  /** Laufen die Einzelwerte auseinander? */
  differs: boolean;
}

/**
 * Zweite Stufe der Schnellbewertung: ein Regler je Genre. Speichert nichts
 * selbst — der Aufrufer besitzt die Werte und schreibt sie als
 * genre-gefächerte Bewertung (`{Genre: Wert}`) wie der Bewertungseditor.
 * Genres auf 0 werden nicht gespeichert.
 */
export const GenreRatingDetails: React.FC<GenreRatingDetailsProps> = ({
  ownGenres,
  otherGenres,
  values,
  onChange,
  onLevel,
  overall,
  differs,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;

  const handleChange = (genre: string, next: number) => {
    onChange(genre, next);
    hapticSelect();
  };

  const renderRow = (genre: string) => {
    const color = GENRE_COLORS[genre] || accent;
    const value = values[genre] ?? 0;
    return (
      <div key={genre} className={`genre-detail-row${value > 0 ? '' : ' genre-detail-row--empty'}`}>
        <div className="genre-detail-row-head">
          <div className="genre-detail-name">
            <i className="genre-detail-dot" style={{ background: color }} />
            <span>{t(genre)}</span>
          </div>
          <span
            className="genre-detail-value"
            style={{ color: value > 0 ? color : currentTheme.text.muted }}
          >
            {value > 0 ? value.toFixed(1) : '–'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={value}
          onChange={(e) => handleChange(genre, parseFloat(e.target.value))}
          className="genre-detail-range"
          aria-label={t('Bewertung {genre}', { genre: t(genre) })}
          aria-valuetext={t('{value} von 10', { value: value.toFixed(1) })}
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 10}%, var(--color-background-surface) ${value * 10}%, var(--color-background-surface) 100%)`,
          }}
        />
      </div>
    );
  };

  return (
    <div className="genre-detail">
      <div className="genre-detail-head">
        <div className="genre-detail-title">
          <strong>{t('Nach Genre')}</strong>
          <span>{t('Jedes Genre einzeln bewerten')}</span>
        </div>
        <button type="button" className="genre-detail-reset" onClick={onLevel} disabled={!differs}>
          <Tune style={{ fontSize: '16px' }} />
          {t('Angleichen')}
        </button>
      </div>

      {ownGenres.length > 0 && (
        <>
          {otherGenres.length > 0 && (
            <p className="genre-detail-caption">{t('Genres des Titels')}</p>
          )}
          <div className="genre-detail-rows">{ownGenres.map(renderRow)}</div>
        </>
      )}

      {otherGenres.length > 0 && (
        <>
          <p className="genre-detail-caption">{t('Weitere Genres')}</p>
          <div className="genre-detail-rows">{otherGenres.map(renderRow)}</div>
        </>
      )}

      <p className="genre-detail-foot">
        {differs
          ? t('Gespeichert wird je Genre — gesamt ergibt das {wert}.', {
              wert: overall.toFixed(1),
            })
          : t(
              'Alle bewerteten Genres liegen auf {wert}. Zieh einen Regler für ein eigenes Urteil.',
              {
                wert: overall.toFixed(1),
              }
            )}
      </p>
    </div>
  );
};
