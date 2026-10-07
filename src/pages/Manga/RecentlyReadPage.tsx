import { AutoStories, CalendarMonth, History, MenuBook, Replay } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, PageHeader, PageLayout } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/feedback/LoadingSpinner';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useMangaReadEvents } from '../../hooks/manga/useMangaReadEvents';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';
import { buildReadHistory, type ReadHistoryEntry } from '../../lib/manga/readHistory';
import { dateLocale, t } from '../../services/i18n';
import './RecentlyReadPage.css';

const TIME_RANGES = [
  { days: 7, label: t('7 Tage') },
  { days: 30, label: t('30 Tage') },
  { days: 90, label: t('3 Monate') },
] as const;

function formatDay(date: number, now: number): string {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday.getTime() - date) / 86400000);
  if (days <= 0) return t('Heute');
  if (days === 1) return t('Gestern');
  return new Date(date).toLocaleDateString(dateLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function chapterLabel(entry: ReadHistoryEntry): string {
  if (entry.chapters === null) {
    if (!entry.toChapter) return '';
    return entry.imported
      ? t('Stand nachgetragen: Kap. {n}', { n: entry.toChapter })
      : t('Stand: Kap. {n}', { n: entry.toChapter });
  }
  if (
    entry.fromChapter !== null &&
    entry.toChapter !== null &&
    entry.toChapter > entry.fromChapter
  ) {
    return t('Kap. {a}–{b}', { a: entry.fromChapter, b: entry.toChapter });
  }
  return entry.toChapter !== null ? t('Kap. {n}', { n: entry.toChapter }) : '';
}

export const RecentlyReadPage = () => {
  const { currentTheme } = useTheme();
  const { mangaList, hiddenMangaList } = useMangaList();
  const navigate = useNavigate();
  const [rangeDays, setRangeDays] = useState(30);
  const [now] = useState(() => Date.now());
  const { events, loading } = useMangaReadEvents(rangeDays, now);

  const library = useMemo(
    () => [...mangaList, ...(hiddenMangaList || [])],
    [mangaList, hiddenMangaList]
  );
  const history = useMemo(
    () => buildReadHistory(events, library, now, rangeDays),
    [events, library, now, rangeDays]
  );

  const summary = [
    ...(history.totalChapters > 0
      ? [{ key: 'chapters', icon: <MenuBook />, value: history.totalChapters, label: t('Kapitel') }]
      : []),
    { key: 'days', icon: <CalendarMonth />, value: history.activeDays, label: t('Lesetage') },
    { key: 'manga', icon: <AutoStories />, value: history.mangaCount, label: 'Manga' },
  ];

  return (
    <PageLayout>
      <PageHeader
        title={t('Lese-Verlauf')}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        subtitle={
          history.totalChapters > 0
            ? t('{n} Kapitel gelesen', { n: history.totalChapters })
            : undefined
        }
        icon={<History />}
      />

      <div className="rr-page">
        <div className="rr-toolbar">
          <div className="rr-ranges" role="tablist" aria-label={t('Zeitraum')}>
            {TIME_RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                role="tab"
                aria-selected={rangeDays === r.days}
                className={`rr-range ${rangeDays === r.days ? 'rr-range--active' : ''}`}
                onClick={() => setRangeDays(r.days)}
              >
                {r.label}
              </button>
            ))}
          </div>
          {history.days.length > 0 && (
            <div className="rr-summary">
              {summary.map((pod) => (
                <div key={pod.key} className="rr-pod">
                  <span className="rr-pod-icon">{pod.icon}</span>
                  <span className="rr-pod-value">{pod.value.toLocaleString()}</span>
                  <span className="rr-pod-label">{pod.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && history.days.length === 0 ? (
          <LoadingSpinner text={t('Verlauf wird geladen …')} />
        ) : history.days.length === 0 ? (
          <EmptyState
            icon={<History style={{ fontSize: 48 }} />}
            title={t('Kein Lese-Verlauf')}
            description={t(
              'Hier siehst du deine zuletzt gelesenen Manga, sobald du Kapitel als gelesen markierst.'
            )}
          />
        ) : (
          <div className="rr-days">
            {history.days.map((day) => (
              <section key={day.key} className="rr-day">
                <header className="rr-day-head">
                  <h2 className="rr-day-title">{formatDay(day.date, now)}</h2>
                  {day.chapters > 0 && (
                    <span className="rr-day-count">
                      {day.chapters === 1 ? t('1 Kapitel') : t('{n} Kapitel', { n: day.chapters })}
                    </span>
                  )}
                </header>
                <div className="rr-entries">
                  {day.entries.map((entry) => (
                    <div
                      key={entry.anilistId}
                      className="rr-entry"
                      role="button"
                      tabIndex={0}
                      aria-label={t('{title} öffnen', { title: entry.title })}
                      onClick={() => navigate(`/manga/${entry.anilistId}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/manga/${entry.anilistId}`);
                        }
                      }}
                    >
                      <img
                        className="rr-entry-poster"
                        src={entry.poster || PLACEHOLDER_SVG}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="rr-entry-body">
                        <div className="rr-entry-title">{entry.title}</div>
                        <div className="rr-entry-meta">
                          <span style={{ color: currentTheme.primary }}>{chapterLabel(entry)}</span>
                          {entry.reread && (
                            <span className="rr-entry-reread">
                              <Replay style={{ fontSize: 12 }} />
                              {t('Erneut')}
                            </span>
                          )}
                        </div>
                        <div className="rr-entry-time">
                          {new Date(entry.lastAt).toLocaleTimeString(dateLocale(), {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      {entry.chapters !== null && entry.chapters > 0 && (
                        <span className="rr-entry-count">+{entry.chapters}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
