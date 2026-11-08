import {
  AutoStories,
  Groups,
  Insights,
  MenuBook,
  NotificationsActive,
  Star,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addGuestReadingPick } from '../../services/account/guestOnboarding';
import { getMangaDetails } from '../../services/api/mangaDetails';
import {
  loadMangaCatalogItem,
  mangaCatalogItemToResult,
  type MangaCatalogItem,
} from '../../services/catalog/mangaCatalog';
import { appLocale, t } from '../../services/i18n';
import type { AniListMangaSearchResult } from '../../types/Manga';
import {
  buildHeroData,
  cleanMangaDescription,
  RELATION_LABELS,
} from '../Manga/detail/mangaDetailData';
import { mangaItem } from '../Onboarding/hooks/useReadingPicks';
import {
  GuestFinal,
  GuestHero,
  GuestLegal,
  GuestPitch,
  GuestRail,
  GuestShell,
  GuestSticky,
  GuestStory,
  type GuestNotice,
  type GuestRailItem,
} from './GuestParts';
import { useHeroCtaVisible } from './useHeroCtaVisible';

interface Loaded {
  id: number;
  anilist: AniListMangaSearchResult | null;
  catalog: MangaCatalogItem | null;
}

const STORY_RELATIONS = new Set(['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'SPIN_OFF']);

export const GuestMangaPage: React.FC<{ anilistId: number }> = ({ anilistId }) => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const current = loaded?.id === anilistId ? loaded : null;
  const anilist =
    current?.anilist ?? (current?.catalog ? mangaCatalogItemToResult(current.catalog) : null);
  const [ctaRef, heroCtaVisible] = useHeroCtaVisible(!!anilist);

  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    void Promise.all([
      getMangaDetails(anilistId).catch(() => null),
      loadMangaCatalogItem(String(anilistId)).catch(() => null),
    ]).then(([details, catalog]) => {
      if (alive) setLoaded({ id: anilistId, anilist: details, catalog });
    });
    return () => {
      alive = false;
    };
  }, [anilistId]);

  if (!anilist) return <GuestShell status={current ? 'failed' : 'loading'} />;

  const hero = buildHeroData(anilistId, undefined, anilist);
  const title = hero.title;
  const description =
    cleanMangaDescription(current?.catalog?.descriptions?.[appLocale]) || hero.description;
  const releasing = hero.statusKey === 'RELEASING';

  const facts = [
    hero.year ? String(hero.year) : '',
    hero.chapters ? t('{n} Kapitel', { n: hero.chapters }) : '',
    hero.volumes ? t('{n} Bände', { n: hero.volumes }) : '',
    hero.statusLabel,
  ].filter(Boolean);

  const notice: GuestNotice | null = releasing
    ? {
        title: t('Erscheint noch'),
        text: t('TV-RANK zeigt dir neue Kapitel und Bände, sobald sie erscheinen.'),
      }
    : null;

  const relationEdges = anilist.relations?.edges || [];
  const storyItems: GuestRailItem[] = relationEdges
    .filter((e) => e.node.type === 'MANGA' && STORY_RELATIONS.has(e.relationType))
    .map((e) => ({
      key: e.node.id,
      image: e.node.coverImage?.large,
      title: e.node.title.english || e.node.title.romaji,
      sub: RELATION_LABELS[e.relationType] || e.relationType,
      to: `/manga/${e.node.id}`,
    }));
  const animeItems: GuestRailItem[] = relationEdges
    .filter((e) => e.node.type === 'ANIME')
    .map((e) => ({
      key: e.node.id,
      image: e.node.coverImage?.large,
      title: e.node.title.english || e.node.title.romaji,
      sub: e.node.format === 'MOVIE' ? t('Film') : t('Anime'),
    }));
  const recommendationItems: GuestRailItem[] = (anilist.recommendations?.edges || [])
    .map((e) => e.node.mediaRecommendation)
    .filter((m): m is NonNullable<typeof m> => !!m?.coverImage?.large)
    .map((m) => ({
      key: m.id,
      image: m.coverImage.large,
      title: m.title.english || m.title.romaji,
      to: `/manga/${m.id}`,
    }));

  const startTracking = () => {
    addGuestReadingPick({ ...mangaItem(anilist), status: 'planned' });
    navigate('/join');
  };

  const total = hero.chapters || 120;

  return (
    <GuestShell status="ready">
      <GuestHero
        backdrop={hero.banner || hero.poster}
        blurBackdrop={!hero.banner}
        poster={hero.poster}
        eyebrow={hero.formatLabel || t('Manga')}
        eyebrowDetail={hero.genres.slice(0, 3)}
        title={title}
        byline={hero.authors.length ? hero.authors.join(', ') : undefined}
        tagline={hero.altTitle}
        rating={hero.score ? (hero.score / 10).toFixed(1) : undefined}
        facts={facts}
        ctaRef={ctaRef}
        onCta={startTracking}
      />

      <main className="gm-main">
        <GuestStory overview={description} notice={notice} />

        <GuestRail title={t('Zur Geschichte')} items={storyItems} />
        <GuestRail title={t('Auch als Anime')} items={animeItems} />

        <GuestPitch
          heading={t('Mehr als eine Liste: so liest du {title}.', { title })}
          cover={hero.poster}
          title={title}
          mockSub={t('Kapitel {c} von {n}', { c: Math.round(total * 0.35), n: total })}
          progress={35}
          chips={[
            { icon: <MenuBook />, label: t('Weiterlesen') },
            { icon: <Star />, label: t('Deine Bewertung') },
          ]}
          features={[
            {
              icon: <AutoStories />,
              title: t('Kapitel oder Bände'),
              text: t('Zähl {title} so, wie du liest — nach Kapiteln oder nach Bänden im Regal.', {
                title,
              }),
            },
            {
              icon: <NotificationsActive />,
              title: t('Neue Kapitel sofort wissen'),
              text: t('Neue Kapitel und Bände landen direkt bei dir.'),
            },
            {
              icon: <Groups />,
              title: t('Mit Freunden lesen'),
              text: t('Sieh, was Freunde lesen, empfiehl Bücher und tausch dich aus.'),
            },
            {
              icon: <Insights />,
              title: t('Dein Lesejahr'),
              text: t('Seiten, Bücher und Rekorde — dazu Serien, Filme und Manga in einer App.'),
            },
          ]}
        />

        <GuestRail title={t('Wenn dir {title} gefällt', { title })} items={recommendationItems} />

        <GuestFinal cover={hero.poster} title={title} onCta={startTracking} />
        <GuestLegal source={t('Daten und Bilder: AniList')} />
      </main>

      <GuestSticky
        visible={!heroCtaVisible}
        cover={hero.poster}
        title={title}
        onCta={startTracking}
      />
    </GuestShell>
  );
};
