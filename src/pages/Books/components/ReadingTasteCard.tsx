import { Person } from '@mui/icons-material';
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { hasReadingTaste, tasteGenres, type ReadingTaste } from '../../../lib/books/readingTaste';
import { t } from '../../../services/i18n';
import { GENRES } from '../data/genres';
import './books.css';

/** Lieblingsgenres als Balken in Genre-Farbe, darunter die meistgelesenen Autoren. */
export const ReadingTasteCard: React.FC<{ taste: ReadingTaste }> = ({ taste }) => {
  const { currentTheme } = useTheme();
  if (!hasReadingTaste(taste)) return null;
  const genres = tasteGenres(taste);

  return (
    <div className="bk-taste">
      {genres.map(({ id, share }) => {
        const meta = GENRES.find((g) => g.id === id);
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <div key={id} className="bk-taste-row">
            <span
              className="bk-taste-icon"
              style={{
                background: `linear-gradient(140deg, ${meta.colors[0]}, ${meta.colors[1]})`,
              }}
            >
              <Icon style={{ fontSize: 17, color: '#fff' }} />
            </span>
            <span className="bk-taste-body">
              <span className="bk-taste-label" style={{ color: currentTheme.text.secondary }}>
                {meta.label()}
                <span style={{ color: currentTheme.text.muted }}>{share} %</span>
              </span>
              <span className="bk-taste-bar" aria-hidden>
                <span
                  style={{
                    width: `${Math.max(6, share)}%`,
                    background: `linear-gradient(90deg, ${meta.colors[0]}, ${meta.colors[1]})`,
                  }}
                />
              </span>
            </span>
          </div>
        );
      })}
      {taste.authors.length > 0 && (
        <div className="bk-taste-authors">
          {taste.authors.map((a) => (
            <span
              key={a.name}
              className="bk-taste-author"
              style={{
                color: currentTheme.text.secondary,
                borderColor: `${currentTheme.primary}40`,
              }}
            >
              <Person style={{ fontSize: 15, color: currentTheme.primary }} />
              {a.name}
              <span style={{ color: currentTheme.text.muted }}>
                {t('{n} Bücher', { n: a.count })}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
