/** Jahres-Bilanz auf der letzten Wrapped-Slide: Zahlen, Top-Listen, Highlights. */

import {
  AccessTime,
  AutoStories,
  CalendarMonth,
  LocalFireDepartment,
  Movie,
  Tv,
  Whatshot,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { dateLocale, t } from '../../../services/i18n';
import type { WrappedStats } from '../../../types/Wrapped';
import { GenreIcon } from './GenreIcon';

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 16,
  backdropFilter: 'var(--blur-sm)',
  WebkitBackdropFilter: 'var(--blur-sm)',
};

const label: React.CSSProperties = {
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  opacity: 0.65,
};

export const SummaryRecap: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  const locale = dateLocale();
  const number = (n: number) => n.toLocaleString(locale);
  const topGenre = stats.topGenres[0];
  const topProvider = stats.topProviders[0];
  const recordDay = stats.mostActiveDay;

  const tiles = [
    { key: 'eps', icon: <Tv />, value: number(stats.totalEpisodesWatched), label: t('Episoden') },
    { key: 'movies', icon: <Movie />, value: number(stats.totalMoviesWatched), label: t('Filme') },
    {
      key: 'series',
      icon: <Whatshot />,
      value: number(stats.uniqueSeriesWatched),
      label: t('Serien'),
    },
    ...(stats.manga
      ? [
          {
            key: 'manga',
            icon: <AutoStories />,
            value: number(stats.manga.totalChapters),
            label: t('Manga-Kapitel'),
          },
        ]
      : []),
    {
      key: 'streak',
      icon: <LocalFireDepartment />,
      value: number(stats.longestStreak),
      label: t('Tage Streak'),
    },
    ...(stats.longestBingeSession
      ? [
          {
            key: 'binge',
            icon: <AccessTime />,
            value: number(stats.longestBingeSession.episodeCount),
            label: t('Folgen am Stück'),
          },
        ]
      : []),
  ].slice(0, 6);

  const highlights = [
    topGenre && {
      key: 'genre',
      icon: <GenreIcon genre={topGenre.genre} style={{ fontSize: 20 }} />,
      title: t('Lieblings-Genre'),
      value: t(topGenre.genre),
    },
    topProvider && {
      key: 'provider',
      icon: topProvider.logo ? (
        <img src={topProvider.logo} alt="" style={{ width: 22, height: 22, borderRadius: 6 }} />
      ) : (
        <Tv style={{ fontSize: 20 }} />
      ),
      title: t('Meistgenutzt'),
      value: topProvider.name,
    },
    stats.favoriteTimeOfDay?.count > 0 && {
      key: 'time',
      icon: <AccessTime style={{ fontSize: 20 }} />,
      title: t('Lieblingszeit'),
      value: `${stats.favoriteDayOfWeek.dayName}, ${stats.favoriteTimeOfDay.label}`,
    },
    recordDay?.episodesWatched + recordDay?.moviesWatched > 0 && {
      key: 'record',
      icon: <CalendarMonth style={{ fontSize: 20 }} />,
      title: t('Rekordtag'),
      value: `${new Date(recordDay.date).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
      })} · ${t('{n} Titel', { n: recordDay.episodesWatched + recordDay.moviesWatched })}`,
    },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; title: string; value: string }[];

  const lists = [
    {
      key: 'series',
      title: t('Top Serien'),
      items: stats.topSeries.slice(0, 3).map((s) => ({
        id: s.id,
        title: s.title,
        poster: s.poster ? `https://image.tmdb.org/t/p/w92${s.poster}` : undefined,
        meta: t('{n} Ep.', { n: s.episodesWatched }),
      })),
    },
    stats.manga && stats.manga.topManga.length > 0
      ? {
          key: 'manga',
          title: t('Top Manga'),
          items: stats.manga.topManga.slice(0, 3).map((m) => ({
            id: m.anilistId,
            title: m.title,
            poster: m.poster,
            meta: t('{n} Kap.', { n: m.chapters }),
          })),
        }
      : {
          key: 'movies',
          title: t('Top Filme'),
          items: stats.topMovies.slice(0, 3).map((m) => ({
            id: m.id,
            title: m.title,
            poster: m.poster ? `https://image.tmdb.org/t/p/w92${m.poster}` : undefined,
            meta: m.rating ? `${m.rating.toFixed(1)} / 10` : '',
          })),
        },
  ].filter((list) => list.items.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{
        width: 'min(100%, 460px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 1,
        color: 'white',
        marginBottom: 22,
      }}
    >
      <div style={{ ...glass, padding: '14px 16px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 'clamp(2.4rem, 12vw, 3.4rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            lineHeight: 1,
          }}
        >
          {number(Math.round(stats.totalHoursWatched))}
        </div>
        <div style={{ ...label, marginTop: 6 }}>
          {t('Stunden · ≈ {n} Tage', { n: stats.totalDaysEquivalent })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {tiles.map((tile) => (
          <div key={tile.key} style={{ ...glass, padding: '10px 6px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.8 }}>
              {React.cloneElement(tile.icon, { style: { fontSize: 18 } })}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 2 }}>{tile.value}</div>
            <div style={{ ...label, fontSize: '0.6rem' }}>{tile.label}</div>
          </div>
        ))}
      </div>

      {lists.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${lists.length}, minmax(0, 1fr))`,
            gap: 8,
          }}
        >
          {lists.map((list) => (
            <div key={list.key} style={{ ...glass, padding: '10px 10px 8px' }}>
              <div style={{ ...label, marginBottom: 6 }}>{list.title}</div>
              {list.items.map((item, index) => (
                <div
                  key={item.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
                >
                  <span style={{ fontWeight: 800, opacity: 0.55, width: 10, fontSize: '0.8rem' }}>
                    {index + 1}
                  </span>
                  {item.poster ? (
                    <img
                      src={item.poster}
                      alt=""
                      style={{ width: 26, height: 39, borderRadius: 5, objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 26,
                        height: 39,
                        borderRadius: 5,
                        background: 'rgba(255,255,255,0.12)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </div>
                    {item.meta && (
                      <div style={{ fontSize: '0.68rem', opacity: 0.65 }}>{item.meta}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {highlights.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {highlights.map((h) => (
            <div
              key={h.key}
              style={{
                ...glass,
                padding: '9px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
              }}
            >
              <span style={{ display: 'flex', flexShrink: 0, opacity: 0.85 }}>{h.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ ...label, fontSize: '0.58rem' }}>{h.title}</div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {h.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
