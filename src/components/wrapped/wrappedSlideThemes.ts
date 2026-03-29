import type { useTheme } from '../../contexts/ThemeContextDef';

export const getSlideThemes = (currentTheme: ReturnType<typeof useTheme>['currentTheme']) => ({
  intro: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
  totalTime: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  topSeries: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  topMovies: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  topGenres: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  topProviders: `linear-gradient(135deg, #6366f1 0%, ${currentTheme.accent} 100%)`,
  timePattern: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  bingeStats: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  achievements: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  monthlyBreakdown: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  summary: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
});
