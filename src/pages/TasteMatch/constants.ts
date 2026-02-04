// ==================== ACCENT COLORS ====================
export const USER_COLOR = '#667eea';       // Lila für User
export const USER_GRADIENT = 'linear-gradient(135deg, #667eea, #764ba2)';
export const FRIEND_COLOR = '#f093fb';     // Pink für Friend
export const FRIEND_GRADIENT = 'linear-gradient(135deg, #f093fb, #f5576c)';

// Weitere Accent-Farben für Variety
export const ACCENT_COLORS = {
  series: '#667eea',      // Lila für Serien
  movies: '#f093fb',      // Pink für Filme
  genres: '#00cec9',      // Cyan für Genres
  ratings: '#fdcb6e',     // Gold für Ratings
  providers: '#00b894',   // Grün für Provider
  match: '#ff6b9d',       // Herz-Pink
};

// Premium gradient for compatibility score display
export const getCompatibilityGradient = (score: number): string => {
  if (score >= 80) return 'linear-gradient(135deg, #00cec9, #00b894)';
  if (score >= 60) return 'linear-gradient(135deg, #fdcb6e, #f39c12)';
  if (score >= 40) return 'linear-gradient(135deg, #e17055, #d63031)';
  return 'linear-gradient(135deg, #636e72, #2d3436)';
};

export const getCompatibilityColors = (score: number): { from: string; to: string } => {
  if (score >= 80) return { from: '#00cec9', to: '#00b894' };
  if (score >= 60) return { from: '#fdcb6e', to: '#f39c12' };
  if (score >= 40) return { from: '#e17055', to: '#d63031' };
  return { from: '#636e72', to: '#2d3436' };
};
