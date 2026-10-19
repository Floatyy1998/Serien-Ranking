import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';
import type { TasteMatchResult } from '../../services/social/tasteMatchService';
import { OverviewTab } from '../TasteMatch/tabs/OverviewTab';
import { ReadingTab } from '../TasteMatch/tabs/ReadingTab';
import '../TasteMatch/TasteMatchPage.css';

const overlap = (shared: TasteMatchResult['mangaOverlap']['shared']) => ({
  score: 40,
  shared,
  userOnlyCount: 3,
  friendOnlyCount: 5,
});

const RESULT: TasteMatchResult = {
  overallMatch: 72,
  seriesOverlap: { score: 30, sharedSeries: [], userOnlyCount: 0, friendOnlyCount: 0 },
  movieOverlap: { score: 20, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
  mangaOverlap: overlap([
    {
      id: '30002',
      title: 'Berserk',
      poster: PLACEHOLDER_SVG,
      userRating: 9.5,
      friendRating: 9,
      ratingDiff: 0.5,
    },
    { id: '30013', title: 'One Piece', poster: PLACEHOLDER_SVG, userRating: 8, friendRating: 6 },
    { id: '105398', title: 'Solo Leveling', poster: PLACEHOLDER_SVG },
  ]),
  bookOverlap: overlap([
    {
      id: 'b1',
      title: 'Der Herr der Ringe',
      authors: ['J. R. R. Tolkien'],
      userRating: 10,
      friendRating: 9.5,
      ratingDiff: 0.5,
    },
    { id: 'b2', title: 'Der Wüstenplanet', authors: ['Frank Herbert'], userRating: 7 },
  ]),
  reading: { shown: true, compared: true, score: 40 },
  genreMatch: { score: 60, sharedGenres: [], userTopGenres: [], friendTopGenres: [] },
  ratingMatch: { score: 80, averageDifference: 1, sameRatingCount: 4 },
  providerMatch: { score: 0, sharedProviders: [] },
};

const CARD_BG = 'rgba(255, 255, 255, 0.04)';

export const TasteMatchReadingPreview = () => (
  <div className="tm-page" style={{ minHeight: 'auto', paddingTop: 16 }}>
    <div className="tm-content">
      <div className="tm-tab-content">
        <ReadingTab result={RESULT} cardBg={CARD_BG} />
      </div>
    </div>
  </div>
);

export const TasteMatchOverviewPreview = () => (
  <div className="tm-page" style={{ minHeight: 'auto', paddingTop: 16 }}>
    <div className="tm-content">
      <div className="tm-tab-content">
        <OverviewTab result={RESULT} cardBg={CARD_BG} />
      </div>
    </div>
  </div>
);
