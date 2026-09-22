import {
  EmojiEvents,
  Group,
  InfoOutlined,
  LocalFireDepartment,
  Movie,
  PersonAddAlt1,
  PlayCircle,
  Public,
  Timer,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui';
import { BottomSheet } from '../../components/ui/overlay/BottomSheet';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';
import type { RankingCategory, RankingPeriod } from '../../types/Leaderboard';
import { CelebrationModal } from './CelebrationModal';
import './LeaderboardPage.css';
import { PodiumSection } from './PodiumSection';
import { RankingList } from './RankingList';
import { SelfStandBand } from './SelfStandBand';
import { TrophyHistory } from './TrophyHistory';
import { useLeaderboardData } from './useLeaderboardData';

interface CategoryDef {
  id: RankingCategory;
  label: string;
  icon: React.ReactNode;
  unit: string;
}

const MONTH_CATEGORIES: CategoryDef[] = [
  {
    id: 'episodesThisMonth',
    label: t('Episoden'),
    icon: <PlayCircle sx={{ fontSize: 16 }} />,
    unit: t('Ep.'),
  },
  {
    id: 'moviesThisMonth',
    label: t('Filme'),
    icon: <Movie sx={{ fontSize: 16 }} />,
    unit: t('Filme'),
  },
  { id: 'watchtimeThisMonth', label: 'Watchtime', icon: <Timer sx={{ fontSize: 16 }} />, unit: '' },
  {
    id: 'streakThisMonth',
    label: t('Monats-Streak'),
    icon: <LocalFireDepartment sx={{ fontSize: 16 }} />,
    unit: t('Tage'),
  },
];

const TOTAL_CATEGORIES: CategoryDef[] = [
  { id: 'watchtimeMinutes', label: 'Watchtime', icon: <Timer sx={{ fontSize: 16 }} />, unit: '' },
  {
    id: 'seriesStarted',
    label: t('Serien'),
    icon: <Tv sx={{ fontSize: 16 }} />,
    unit: t('Serien'),
  },
  { id: 'movies', label: t('Filme'), icon: <Movie sx={{ fontSize: 16 }} />, unit: t('Filme') },
  {
    id: 'episodes',
    label: t('Episoden'),
    icon: <PlayCircle sx={{ fontSize: 16 }} />,
    unit: t('Ep.'),
  },
  {
    id: 'streakAllTime',
    label: t('Längste Streak'),
    icon: <EmojiEvents sx={{ fontSize: 16 }} />,
    unit: t('Tage'),
  },
];

export const LeaderboardPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [explainOpen, setExplainOpen] = useState(false);

  const {
    user,
    mode,
    setMode,
    period,
    setPeriod,
    activeCategory,
    setActiveCategory,
    rankings,
    friendCount,
    missingTotals,
    trophies,
    loading,
    celebration,
    setCelebration,
    scrollContainerRef,
  } = useLeaderboardData();

  const categories = period === 'total' ? TOTAL_CATEGORIES : MONTH_CATEGORIES;
  const activeCat = useMemo(
    () => categories.find((c) => c.id === activeCategory),
    [categories, activeCategory]
  );
  const topThree = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const controls = (
    <div className="lb-deck">
      <div className="lb-deck-row">
        <ModeToggle mode={mode} onModeChange={setMode} disabled={period === 'total'} />
        <PeriodToggle period={period} onPeriodChange={setPeriod} />
      </div>

      <div className="lb-cats">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileTap={tapScale}
            onClick={() => setActiveCategory(cat.id)}
            className={`lb-cat ${cat.id === activeCategory ? 'lb-cat--active' : ''}`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="lb-root" style={{ background: currentTheme.background.default }}>
        <div className="lb-page">
          <PageHeader title={t('Rangliste')} subtitle={t('Rangliste wird geladen...')} />
          <div className="lb-skeleton">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="lb-skeleton-row skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'friends' && friendCount === 0) {
    return (
      <div className="lb-root" style={{ background: currentTheme.background.default }}>
        <div className="lb-page">
          <PageHeader title={t('Rangliste')} />
          {controls}

          <section className="lb-empty">
            <div className="lb-empty-orbit">
              <Group style={{ fontSize: 30, color: currentTheme.accent }} />
            </div>
            <h2 style={{ color: currentTheme.text.secondary }}>{t('Noch keine Freunde')}</h2>
            <p style={{ color: currentTheme.text.muted }}>
              {t('Füge Freunde hinzu, um in der Rangliste gegeneinander anzutreten!')}
            </p>
            <motion.button
              whileTap={tapScale}
              className="lb-empty-cta"
              onClick={() => navigate('/activity')}
            >
              <PersonAddAlt1 style={{ fontSize: 18 }} />
              {t('Freunde finden')}
            </motion.button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="lb-root"
      style={{ background: currentTheme.background.default }}
    >
      <CelebrationModal
        celebration={celebration}
        onClose={() => setCelebration(null)}
        userName={user?.displayName || t('Du')}
      />

      <div className="lb-page">
        <PageHeader
          title={t('Rangliste')}
          subtitle={`${activeCat?.label} · ${period === 'total' ? t('Aller Zeiten') : t('Diesen Monat')}${mode === 'global' ? ` · ${t('Alle Nutzer')}` : ''}`}
        />

        {controls}

        <button type="button" className="lb-explain" onClick={() => setExplainOpen(true)}>
          <InfoOutlined sx={{ fontSize: 14 }} />
          <span>
            {period === 'total'
              ? t('Alles, was du je gesehen hast — ohne Wertung')
              : t('Zählt am 1. wieder bei null · Nachgetragene Folgen zählen nicht')}
          </span>
        </button>

        <SelfStandBand
          entries={rankings}
          category={activeCategory}
          unit={activeCat?.unit ?? ''}
          categoryLabel={activeCat?.label ?? ''}
        />

        <PodiumSection topThree={topThree} category={activeCategory} unit={activeCat?.unit ?? ''} />

        <RankingList
          entries={rest}
          category={activeCategory}
          unit={activeCat?.unit ?? ''}
          leaderValue={topThree[0]?.value}
        />

        {missingTotals > 0 && (
          <p className="lb-missing-note">
            {missingTotals === 1
              ? t(
                  'Ein Freund hat noch keine Gesamtdaten — sie erscheinen, sobald die App wieder geöffnet wird.'
                )
              : t(
                  '{n} Freunde haben noch keine Gesamtdaten — sie erscheinen, sobald die App wieder geöffnet wird.',
                  { n: missingTotals }
                )}
          </p>
        )}

        {/* Trophäen gehören zur Monatswertung */}
        {period === 'month' && <TrophyHistory trophies={trophies} currentUserId={user?.uid} />}

        <div className="lb-bottom-pad" />
      </div>

      <ExplainSheet
        isOpen={explainOpen}
        onClose={() => setExplainOpen(false)}
        period={period}
        onShowTotals={() => {
          setExplainOpen(false);
          setPeriod('total');
        }}
      />
    </div>
  );
};

const ExplainSheet = ({
  isOpen,
  onClose,
  period,
  onShowTotals,
}: {
  isOpen: boolean;
  onClose: () => void;
  period: RankingPeriod;
  onShowTotals: () => void;
}) => {
  const { currentTheme } = useTheme();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel={t('Wie die Rangliste zählt')}>
      <div className="lb-explain-sheet">
        <h2 style={{ color: currentTheme.text.secondary }}>{t('Wie die Rangliste zählt')}</h2>

        <section>
          <h3 style={{ color: currentTheme.accent }}>{t('Diesen Monat')}</h3>
          <p style={{ color: currentTheme.text.muted }}>
            {t(
              'Der Wettbewerb läuft monatlich: Am Monatsersten starten alle wieder bei null, der Vormonat wandert in die Trophäen.'
            )}
          </p>
          <p style={{ color: currentTheme.text.muted }}>
            {t(
              'Damit niemand die Wertung verfälscht, zählen nachgetragene Folgen nicht mit: Wer in kurzer Zeit viele Folgen auf einmal abhakt, trägt seine Bibliothek nach, statt zu schauen.'
            )}
          </p>
        </section>

        <section>
          <h3 style={{ color: currentTheme.accent }}>{t('Aller Zeiten')}</h3>
          <p style={{ color: currentTheme.text.muted }}>
            {t(
              'Die Gesamtwertung zeigt alles, was du je gesehen hast — inklusive nachgetragener Folgen und Rewatches. Deshalb passt sie zu deiner Statistik-Seite, vergibt aber bewusst keine Trophäen.'
            )}
          </p>
        </section>

        {period === 'month' && (
          <button type="button" className="lb-explain-cta" onClick={onShowTotals}>
            {t('Gesamt ansehen')}
          </button>
        )}
      </div>
    </BottomSheet>
  );
};

const ModeToggle = React.memo(function ModeToggle({
  mode,
  onModeChange,
  disabled = false,
}: {
  mode: 'friends' | 'global';
  onModeChange: (m: 'friends' | 'global') => void;
  disabled?: boolean;
}) {
  const options = [
    { id: 'friends' as const, label: t('Freunde'), icon: <Group sx={{ fontSize: 15 }} /> },
    { id: 'global' as const, label: t('Alle'), icon: <Public sx={{ fontSize: 15 }} /> },
  ];

  return (
    <div className={`lb-seg ${disabled ? 'lb-seg--off' : ''}`}>
      {options.map((opt) => (
        <motion.button
          key={opt.id}
          whileTap={disabled ? undefined : tapScale}
          onClick={() => !disabled && onModeChange(opt.id)}
          disabled={disabled}
          title={disabled ? t('Die Gesamtwertung gibt es nur unter Freunden') : undefined}
          className={`lb-seg-btn ${mode === opt.id ? 'lb-seg-btn--on' : ''}`}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </motion.button>
      ))}
    </div>
  );
});

// Zeitraum: Monat = Wettbewerb, Gesamt = Vergleich. Zweiter Umschalter neben
// Freunde/Alle, damit beide Achsen gleichzeitig sichtbar bleiben.
const PeriodToggle = React.memo(function PeriodToggle({
  period,
  onPeriodChange,
}: {
  period: RankingPeriod;
  onPeriodChange: (p: RankingPeriod) => void;
}) {
  const options: { id: RankingPeriod; label: string }[] = [
    { id: 'month', label: t('Monat') },
    { id: 'total', label: t('Gesamt') },
  ];

  return (
    <div className="lb-seg">
      {options.map((opt) => (
        <motion.button
          key={opt.id}
          whileTap={tapScale}
          onClick={() => onPeriodChange(opt.id)}
          className={`lb-seg-btn ${period === opt.id ? 'lb-seg-btn--on' : ''}`}
        >
          <span>{opt.label}</span>
        </motion.button>
      ))}
    </div>
  );
});
