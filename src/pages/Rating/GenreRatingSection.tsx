import { Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Drama, Heart, Smile, Sparkles, TrendingUp, Zap } from 'lucide-react';

const genreIcons: Record<string, React.ReactNode> = {
  Action: <Zap size={20} />,
  Comedy: <Smile size={20} />,
  Drama: <Drama size={20} />,
  Romance: <Heart size={20} />,
  'Sci-Fi': <Sparkles size={20} />,
  Fantasy: <Sparkles size={20} />,
  Thriller: <TrendingUp size={20} />,
};

const genreColors: Record<string, string> = {
  Action: '#ff6b6b',
  Comedy: '#ffd43b',
  Drama: 'var(--theme-secondary-gradient, #667eea)',
  Romance: '#f06292',
  'Sci-Fi': '#4ecdc4',
  Fantasy: 'var(--theme-secondary-gradient, #764ba2)',
  Thriller: '#e74c3c',
};

interface GenreRatingSectionProps {
  genreRatings: Record<string, number>;
  onGenreRatingChange: (genre: string, value: number) => void;
}

export const GenreRatingSection = ({
  genreRatings,
  onGenreRatingChange,
}: GenreRatingSectionProps) => {
  return (
    <motion.div
      key="genre"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="rate-genre-list"
    >
      {Object.keys(genreRatings).map((genre) => {
        const color = genreColors[genre] || 'var(--theme-secondary-gradient, #667eea)';
        return (
          <div key={genre} className="rate-genre-item">
            <div className="rate-genre-header">
              <div className="rate-genre-info">
                <div
                  className="rate-genre-icon"
                  style={{
                    background: `${color}20`,
                    color: color,
                  }}
                >
                  {genreIcons[genre] || <Star />}
                </div>
                <span className="rate-genre-name">{genre}</span>
              </div>
              <span className="rate-genre-value">{genreRatings[genre].toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={genreRatings[genre]}
              onChange={(e) => onGenreRatingChange(genre, parseFloat(e.target.value))}
              className="rate-genre-range"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${genreRatings[genre] * 10}%, var(--color-background-surface) ${genreRatings[genre] * 10}%, var(--color-background-surface) 100%)`,
              }}
            />
          </div>
        );
      })}
    </motion.div>
  );
};
