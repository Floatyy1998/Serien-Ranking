/**
 * OG-Renderer für geteilte Detail-Links (/series/:id, /movie/:id, /books/:id,
 * /manga/:id), geteilte Folgen (/episode/:id/s/:s/e/:e) und geteilte Listen (/list/:id). Vorschaubilder unter /og/list,
 * /og/book und /og/manga.
 *
 * Firebase Hosting rewritet diese Routen hierher; die Function nimmt das
 * gebaute index.html der Live-Site, ersetzt Title/Description/OG-Tags durch
 * titelspezifische Werte (TMDB, de-DE) und liefert es aus. Messenger-Crawler
 * (WhatsApp, Discord, Telegram, …) sehen so eine Poster-Karte statt der
 * generischen SPA-Tags; für Menschen ist die Seite byte-gleich bis auf den
 * <head>.
 *
 * Kostenkontrolle: CDN-Cache pro URL (s-maxage) + In-Memory-Caches pro
 * Instanz + maxInstances-Deckel. Deploy: manuell `firebase deploy --only
 * functions` aus frontend/ (functions/.env mit TMDB_API_KEY nötig, gitignored)
 * — bewusst NICHT über die CI (deren Service-Account deployt nur Hosting).
 */

// Bewusst nur der v2-HTTPS-Provider: der v1-Sammel-Einstieg lädt alle
// Provider inkl. firebase-admin/database und crasht im Functions-Container.
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const sharp = require('sharp');

const SITE_ORIGIN = 'https://tv-rank.de';
const RTDB_ORIGIN = 'https://serien-ranking.firebaseio.com';
const LIST_ID_RE = /^[\w-]{1,64}$/;
const TMDB_KEY = process.env.TMDB_API_KEY || '';

// index.html der Live-Site: best-effort aktualisiert, stale ist besser als
// gar keine Antwort (Fallback bei Fetch-Fehlern).
const INDEX_TTL_MS = 10 * 60 * 1000;
let indexCache = { html: '', at: 0 };

// TMDB-Antworten pro Titel (Instanz-lokal; CDN cached die fertige Seite).
const TMDB_TTL_MS = 6 * 60 * 60 * 1000;
const TMDB_CACHE_MAX = 500;
const tmdbCache = new Map();

async function getIndexHtml() {
  if (indexCache.html && Date.now() - indexCache.at < INDEX_TTL_MS) {
    return indexCache.html;
  }
  try {
    // /index.html wird von Hosting direkt ausgeliefert (kein Rewrite-Zyklus:
    // nur Detail-, Listen- und /og-Routen zeigen auf diese Function).
    const res = await fetch(`${SITE_ORIGIN}/index.html`);
    if (res.ok) {
      const html = await res.text();
      if (html.includes('</head>')) {
        indexCache = { html, at: Date.now() };
        return html;
      }
    }
  } catch (err) {
    logger.warn('index.html-Fetch fehlgeschlagen', { message: err && err.message });
  }
  if (indexCache.html) return indexCache.html; // stale, aber funktionsfähig
  return null;
}

async function getTmdbDetail(mediaType, tmdbId) {
  if (!TMDB_KEY) return null;
  const key = `${mediaType}-${tmdbId}`;
  const cached = tmdbCache.get(key);
  if (cached && Date.now() - cached.at < TMDB_TTL_MS) return cached.data;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_KEY}&language=de-DE`
    );
    // 404 (unbekannte ID) als null cachen, damit Crawler-Wellen nicht
    // wiederholt gegen TMDB laufen.
    const data = res.ok ? await res.json() : null;
    if (tmdbCache.size >= TMDB_CACHE_MAX) {
      const oldest = tmdbCache.keys().next().value;
      if (oldest) tmdbCache.delete(oldest);
    }
    tmdbCache.set(key, { data, at: Date.now() });
    return data;
  } catch (err) {
    logger.warn('TMDB-Fetch fehlgeschlagen', { key, message: err && err.message });
    return null;
  }
}

async function getTmdbEpisode(tmdbId, season, episode) {
  if (!TMDB_KEY) return null;
  const key = `ep-${tmdbId}-${season}-${episode}`;
  const cached = tmdbCache.get(key);
  if (cached && Date.now() - cached.at < TMDB_TTL_MS) return cached.data;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season}/episode/${episode}?api_key=${TMDB_KEY}&language=de-DE`
    );
    const data = res.ok ? await res.json() : null;
    if (tmdbCache.size >= TMDB_CACHE_MAX) {
      const oldest = tmdbCache.keys().next().value;
      if (oldest) tmdbCache.delete(oldest);
    }
    tmdbCache.set(key, { data, at: Date.now() });
    return data;
  } catch (err) {
    logger.warn('TMDB-Fetch fehlgeschlagen', { key, message: err && err.message });
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(text, max) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function injectOg(html, mediaType, tmdbId, detail) {
  const rawTitle = detail.name || detail.title || '';
  if (!rawTitle) return html;

  const year = String(detail.first_air_date || detail.release_date || '').slice(0, 4);
  const pageTitle = escapeHtml(`${rawTitle}${year ? ` (${year})` : ''} | TV-RANK`);
  const description = escapeHtml(
    truncate(
      detail.overview || 'Folgen abhaken, bewerten und mit Freunden vergleichen — auf TV-RANK.',
      250
    )
  );
  // Backdrop (Querformat) statt Poster: Hochformat wirkt in den großen
  // Vorschau-Karten wuchtig und wird beschnitten — 16:9 ist die klassische
  // Medienkarte. Poster nur als Fallback, wenn kein Backdrop existiert.
  const image = detail.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`
    : detail.poster_path
      ? `https://image.tmdb.org/t/p/w780${detail.poster_path}`
      : `${SITE_ORIGIN}/logo180.png`;
  const imageDims = detail.backdrop_path
    ? [
        '<meta property="og:image:width" content="1280" />',
        '<meta property="og:image:height" content="720" />',
      ]
    : [];
  const pageUrl = `${SITE_ORIGIN}/${mediaType === 'movie' ? 'movie' : 'series'}/${tmdbId}`;
  const ogType = mediaType === 'movie' ? 'video.movie' : 'video.tv_show';
  const ogTitle = escapeHtml(rawTitle);

  const tags = [
    `<title>${pageTitle}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:site_name" content="TV-RANK" />`,
    `<meta property="og:title" content="${ogTitle}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    ...imageDims,
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');

  return replaceHeadTags(html, tags);
}

// Geteilte Folge: Serientitel + Folge im Titel, Szenenbild als Karte. Die Handlung
// bleibt bewusst draußen — eine Link-Vorschau im Chat soll nicht spoilern.
function injectEpisodeOg(html, tmdbId, season, episode, series, detail) {
  const seriesTitle = series.name || '';
  if (!seriesTitle) return html;
  const label = `S${season} E${episode}`;
  const episodeName = detail && detail.name ? detail.name : '';
  const rawTitle = `${seriesTitle} · ${label}${episodeName ? ` – ${episodeName}` : ''}`;
  const pageTitle = escapeHtml(`${rawTitle} | TV-RANK`);
  const ogTitle = escapeHtml(rawTitle);
  const description = escapeHtml(
    `Staffel ${season}, Folge ${episode} von ${seriesTitle} — abhaken, bewerten und ohne Spoiler diskutieren auf TV-RANK.`
  );
  const still = detail && detail.still_path;
  const image = still
    ? `https://image.tmdb.org/t/p/original${still}`
    : series.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${series.backdrop_path}`
      : series.poster_path
        ? `https://image.tmdb.org/t/p/w780${series.poster_path}`
        : `${SITE_ORIGIN}/logo180.png`;
  const pageUrl = `${SITE_ORIGIN}/episode/${tmdbId}/s/${season}/e/${episode}`;

  const tags = [
    `<title>${pageTitle}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:type" content="video.episode" />`,
    `<meta property="og:site_name" content="TV-RANK" />`,
    `<meta property="og:title" content="${ogTitle}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');

  return replaceHeadTags(html, tags);
}

// Geteilte Listen (/list/:id): öffentlicher Snapshot aus sharedLists (RTDB,
// .read: true), kurz gecacht, damit Umbenennungen bald in Vorschauen landen.
const LIST_TTL_MS = 60 * 1000;
const listCache = new Map();

async function getSharedList(id) {
  if (!LIST_ID_RE.test(id)) return null;
  const cached = listCache.get(id);
  if (cached && Date.now() - cached.at < LIST_TTL_MS) return cached.data;
  try {
    const res = await fetch(`${RTDB_ORIGIN}/sharedLists/${id}.json`);
    const data = res.ok ? await res.json() : null;
    const list = data && typeof data.name === 'string' ? data : null;
    if (listCache.size >= TMDB_CACHE_MAX) {
      const oldest = listCache.keys().next().value;
      if (oldest) listCache.delete(oldest);
    }
    listCache.set(id, { data: list, at: Date.now() });
    return list;
  } catch (err) {
    logger.warn('Listen-Fetch fehlgeschlagen', { id, message: err && err.message });
    return null;
  }
}

const listItems = (list) =>
  (Array.isArray(list.items) ? list.items : Object.values(list.items || {})).filter(
    (i) => i && typeof i.t === 'string'
  );

// Vorschaubild: bis zu vier Poster als Fächer auf dem Plum-Verlauf der App.
const OG_W = 1200;
const OG_H = 630;
const POSTER_H = 430;
const POSTER_W = Math.round((POSTER_H * 2) / 3);

function injectListOg(html, id, list) {
  const items = listItems(list);
  const count = items.length;
  const countText = count === 1 ? '1 Titel' : `${count} Titel`;
  const owner = list.ownerName ? ` von ${list.ownerName}` : '';
  const pageTitle = escapeHtml(`${list.name} · Liste${owner} | TV-RANK`);
  const ogTitle = escapeHtml(`${list.name} · Liste${owner}`);
  const names = items
    .slice(0, 5)
    .map((i) => i.t)
    .join(', ');
  const description = escapeHtml(
    truncate(`${countText}${names ? `: ${names}${count > 5 ? ' …' : ''}` : ''}`, 250)
  );
  const image = `${SITE_ORIGIN}/og/list/${id}?v=${Number(list.updatedAt) || 0}`;
  const pageUrl = `${SITE_ORIGIN}/list/${id}`;

  const tags = [
    `<title>${pageTitle}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="TV-RANK" />`,
    `<meta property="og:title" content="${ogTitle}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="${OG_W}" />`,
    `<meta property="og:image:height" content="${OG_H}" />`,
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');

  return replaceHeadTags(html, tags);
}

async function fetchPoster(path) {
  const url = /^https?:\/\//.test(path) ? path : `https://image.tmdb.org/t/p/w500${path}`;
  if (!/^https:\/\/image\.tmdb\.org\//.test(url)) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

const roundedMask = Buffer.from(
  `<svg width="${POSTER_W}" height="${POSTER_H}"><rect width="${POSTER_W}" height="${POSTER_H}" rx="22" ry="22"/></svg>`
);

const shadow = Buffer.from(
  `<svg width="${POSTER_W + 80}" height="${POSTER_H + 80}"><defs><filter id="b"><feGaussianBlur stdDeviation="16"/></filter></defs><rect x="40" y="52" width="${POSTER_W}" height="${POSTER_H}" rx="22" fill="black" fill-opacity="0.55" filter="url(#b)"/></svg>`
);

const background = Buffer.from(
  `<svg width="${OG_W}" height="${OG_H}"><defs>` +
    `<radialGradient id="g" cx="50%" cy="0%" r="85%"><stop offset="0" stop-color="#ef6f8a" stop-opacity="0.45"/><stop offset="1" stop-color="#ef6f8a" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="a" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f2a648" stop-opacity="0.18"/><stop offset="0.6" stop-color="#f2a648" stop-opacity="0"/></linearGradient>` +
    `</defs><rect width="${OG_W}" height="${OG_H}" fill="#2b1a2e"/><rect width="${OG_W}" height="${OG_H}" fill="url(#g)"/><rect width="${OG_W}" height="${OG_H}" fill="url(#a)"/></svg>`
);

async function renderListImage(list) {
  const paths = listItems(list)
    .map((i) => i.p)
    .filter((p) => typeof p === 'string' && p.length > 0)
    .slice(0, 4);
  const posters = (
    await Promise.all(
      paths.map(async (p) => {
        const buf = await fetchPoster(p);
        if (!buf) return null;
        try {
          return await sharp(buf)
            .resize(POSTER_W, POSTER_H, { fit: 'cover' })
            .composite([{ input: roundedMask, blend: 'dest-in' }])
            .png()
            .toBuffer();
        } catch {
          return null;
        }
      })
    )
  ).filter(Boolean);

  const layers = [];
  const n = posters.length;
  if (n > 0) {
    const step = n > 1 ? Math.min(POSTER_W + 24, (OG_W - 60 - POSTER_W) / (n - 1)) : 0;
    const left = Math.round((OG_W - (POSTER_W + step * (n - 1))) / 2);
    const top = Math.round((OG_H - POSTER_H) / 2);
    posters.forEach((poster, i) => {
      const x = Math.round(left + step * i);
      layers.push({ input: shadow, left: Math.max(0, x - 40), top: Math.max(0, top - 40) });
      layers.push({ input: poster, left: x, top });
    });
  }

  return sharp(background).composite(layers).jpeg({ quality: 86 }).toBuffer();
}

// Bücher und Manga: statischer Katalog des Backends, Manga ohne Katalogeintrag direkt von AniList.
const CATALOG_ORIGIN = 'https://serienapi.konrad-dinges.de';
const BOOK_ID_RE = /^[a-z]+-[\w.:-]{1,120}$/;
const MANGA_ID_RE = /^-?\d{1,14}$/;
const COVER_HOSTS =
  /^https:\/\/(serienapi\.konrad-dinges\.de|s4\.anilist\.co|image\.tmdb\.org|covers\.openlibrary\.org|books\.google\.com|books\.googleusercontent\.com|assets\.hardcover\.app|portal\.dnb\.de)\//;
const VERSION_TTL_MS = 10 * 60 * 1000;
const versions = new Map();
const readingCache = new Map();

async function catalogVersion(kind) {
  const hit = versions.get(kind);
  if (hit && Date.now() - hit.at < VERSION_TTL_MS) return hit.v;
  try {
    const res = await fetch(`${CATALOG_ORIGIN}/${kind}/version`);
    const v = res.ok ? (await res.json()).version || 0 : 0;
    versions.set(kind, { v, at: Date.now() });
    return v;
  } catch {
    return hit ? hit.v : 0;
  }
}

function remember(key, data) {
  if (readingCache.size >= TMDB_CACHE_MAX) {
    const oldest = readingCache.keys().next().value;
    if (oldest) readingCache.delete(oldest);
  }
  readingCache.set(key, { data, at: Date.now() });
  return data;
}

async function getCatalogItem(kind, id) {
  const key = `${kind}:${id}`;
  const cached = readingCache.get(key);
  if (cached && Date.now() - cached.at < TMDB_TTL_MS) return cached.data;
  try {
    const v = await catalogVersion(kind);
    const res = await fetch(
      `${CATALOG_ORIGIN}/catalog/${kind}/items/${encodeURIComponent(id)}.json?v=${v}`
    );
    const data = res.ok ? await res.json() : null;
    return remember(key, data && data.title ? data : null);
  } catch (err) {
    logger.warn('Katalog-Fetch fehlgeschlagen', { key, message: err && err.message });
    return null;
  }
}

const ANILIST_QUERY =
  'query ($id: Int) { Media(id: $id, type: MANGA) { id title { romaji english } description(asHtml: false) coverImage { extraLarge large } startDate { year } staff(perPage: 4) { edges { role node { name { full } } } } } }';

async function getAniListManga(id) {
  const key = `anilist:${id}`;
  const cached = readingCache.get(key);
  if (cached && Date.now() - cached.at < TMDB_TTL_MS) return cached.data;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { id } }),
    });
    const media = res.ok ? (await res.json()).data?.Media : null;
    if (!media) return remember(key, null);
    const authors = (media.staff?.edges || [])
      .filter((e) => /story|art/i.test(e.role || ''))
      .map((e) => e.node?.name?.full)
      .filter(Boolean);
    return remember(key, {
      title: media.title?.english || media.title?.romaji || '',
      description: media.description || '',
      cover: media.coverImage?.extraLarge || media.coverImage?.large || '',
      year: media.startDate?.year || null,
      authors: [...new Set(authors)].slice(0, 2),
      v: 0,
    });
  } catch (err) {
    logger.warn('AniList-Fetch fehlgeschlagen', { id, message: err && err.message });
    return null;
  }
}

const stripHtml = (text) =>
  String(text || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&');

async function getReadingItem(kind, id) {
  if (kind === 'book') {
    if (!BOOK_ID_RE.test(id)) return null;
    const item = await getCatalogItem('books', id);
    if (!item) return null;
    return {
      title: item.title,
      authors: item.authors || [],
      year: item.publishedYear || null,
      description: (item.descriptions && item.descriptions.de) || item.description || '',
      cover: item.cover || '',
      v: item.v || 0,
    };
  }
  if (!MANGA_ID_RE.test(id)) return null;
  const item = await getCatalogItem('manga', id);
  if (item) {
    return {
      title: item.title,
      authors: [],
      year: Number(String(item.startDate || '').slice(0, 4)) || null,
      description: (item.descriptions && item.descriptions.de) || item.description || '',
      cover: item.cover || item.poster || '',
      v: item.v || 0,
    };
  }
  return Number(id) > 0 ? getAniListManga(Number(id)) : null;
}

function injectReadingOg(html, kind, id, item) {
  const byline = item.authors.slice(0, 2).join(', ');
  const label = kind === 'book' ? 'Buch' : 'Manga';
  const pageTitle = escapeHtml(`${item.title}${byline ? ` – ${byline}` : ''} | TV-RANK`);
  const ogTitle = escapeHtml(item.title);
  const lead = [label, byline, item.year].filter(Boolean).join(' · ');
  const body = truncate(stripHtml(item.description), 220);
  const description = escapeHtml(
    body ? `${lead} — ${body}` : `${lead} — Lesestand, Bewertungen und neue Bände auf TV-RANK.`
  );
  const image = item.cover
    ? `${SITE_ORIGIN}/og/${kind}/${encodeURIComponent(id)}?v=${item.v}`
    : `${SITE_ORIGIN}/logo180.png`;
  const pageUrl = `${SITE_ORIGIN}/${kind === 'book' ? 'books' : 'manga'}/${encodeURIComponent(id)}`;
  const tags = [
    `<title>${pageTitle}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:type" content="${kind === 'book' ? 'book' : 'website'}" />`,
    `<meta property="og:site_name" content="TV-RANK" />`,
    `<meta property="og:title" content="${ogTitle}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    ...(item.cover
      ? [
          `<meta property="og:image:type" content="image/jpeg" />`,
          `<meta property="og:image:width" content="${OG_W}" />`,
          `<meta property="og:image:height" content="${OG_H}" />`,
        ]
      : []),
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');
  return replaceHeadTags(html, tags);
}

const COVER_MAX_H = 500;
const COVER_MAX_W = 420;

async function renderCoverImage(coverUrl) {
  if (!COVER_HOSTS.test(coverUrl)) return null;
  const res = await fetch(coverUrl);
  if (!res.ok) return null;
  const source = Buffer.from(await res.arrayBuffer());
  const cover = await sharp(source)
    .resize(COVER_MAX_W, COVER_MAX_H, { fit: 'inside' })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = cover.info;
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="18" ry="18"/></svg>`
  );
  const rounded = await sharp(cover.data)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const coverShadow = Buffer.from(
    `<svg width="${width + 120}" height="${height + 120}"><defs><filter id="b"><feGaussianBlur stdDeviation="22"/></filter></defs><rect x="60" y="76" width="${width}" height="${height}" rx="18" fill="black" fill-opacity="0.6" filter="url(#b)"/></svg>`
  );
  const backdrop = await sharp(source)
    .resize(OG_W, OG_H, { fit: 'cover' })
    .blur(36)
    .modulate({ brightness: 0.55, saturation: 1.2 })
    .toBuffer();
  const tint = Buffer.from(
    `<svg width="${OG_W}" height="${OG_H}"><defs><radialGradient id="v" cx="50%" cy="50%" r="75%"><stop offset="0.35" stop-color="#2b1a2e" stop-opacity="0.15"/><stop offset="1" stop-color="#2b1a2e" stop-opacity="0.8"/></radialGradient></defs><rect width="${OG_W}" height="${OG_H}" fill="url(#v)"/></svg>`
  );
  const left = Math.round((OG_W - width) / 2);
  const top = Math.round((OG_H - height) / 2);
  return sharp(backdrop)
    .composite([
      { input: tint, left: 0, top: 0 },
      { input: coverShadow, left: Math.max(0, left - 60), top: Math.max(0, top - 60) },
      { input: rounded, left, top },
    ])
    .jpeg({ quality: 86 })
    .toBuffer();
}

function replaceHeadTags(html, tags) {
  // Generische SPA-Tags raus (Title, Description, og:*, twitter:*), dann die
  // seitenspezifischen vor </head> einsetzen.
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta[^>]+name="twitter:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta[^>]+name="description"[^>]*>\s*/gi, '')
    .replace('</head>', `${tags}\n  </head>`);
}

exports.ogRender = onRequest(
  { memory: '512MiB', timeoutSeconds: 20, maxInstances: 10 },
  async (req, res) => {
    const imageMatch = (req.path || '').match(/^\/og\/list\/([\w-]{1,64})\/?$/);
    if (imageMatch) {
      const list = await getSharedList(imageMatch[1]);
      if (!list) {
        res.set('Cache-Control', 'public, max-age=60, s-maxage=60');
        res.status(404).send('Not found');
        return;
      }
      try {
        const jpeg = await renderListImage(list);
        // URL trägt ?v=updatedAt — jede Änderung bekommt eine neue Bild-URL.
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        res.set('Content-Type', 'image/jpeg');
        res.status(200).send(jpeg);
      } catch (err) {
        logger.warn('Listen-Bild fehlgeschlagen', { message: err && err.message });
        res.set('Cache-Control', 'no-store');
        res.status(500).send('Render failed');
      }
      return;
    }

    const coverMatch = (req.path || '').match(/^\/og\/(book|manga)\/([^/]{1,140})\/?$/);
    if (coverMatch) {
      const kind = coverMatch[1];
      const item = await getReadingItem(kind, decodeURIComponent(coverMatch[2]));
      try {
        const jpeg = item && item.cover ? await renderCoverImage(item.cover) : null;
        if (!jpeg) {
          res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
          res.status(404).send('Not found');
          return;
        }
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        res.set('Content-Type', 'image/jpeg');
        res.status(200).send(jpeg);
      } catch (err) {
        logger.warn('Cover-Bild fehlgeschlagen', { message: err && err.message });
        res.set('Cache-Control', 'no-store');
        res.status(500).send('Render failed');
      }
      return;
    }

    const html = await getIndexHtml();
    if (!html) {
      // Hosting selbst nicht erreichbar (Kaltstart + Ausfall) — kurzlebig.
      res.set('Cache-Control', 'no-store');
      res.status(503).set('Retry-After', '30').send('Temporarily unavailable');
      return;
    }

    const match = (req.path || '').match(/^\/(series|movie)\/(\d+)/);
    const listMatch = (req.path || '').match(/^\/list\/([\w-]{1,64})/);
    const readingMatch = (req.path || '').match(/^\/(books|manga)\/([^/]{1,140})\/?$/);
    const episodeMatch = (req.path || '').match(/^\/episode\/(\d{1,9})\/s\/(\d{1,4})\/e\/(\d{1,5})\/?$/);
    let out = html;
    let cacheControl = 'public, max-age=300, s-maxage=3600';
    if (episodeMatch) {
      const [, id, season, episode] = episodeMatch.map(Number);
      const [series, detail] = await Promise.all([
        getTmdbDetail('tv', id),
        getTmdbEpisode(id, season, episode),
      ]);
      if (series) out = injectEpisodeOg(html, id, season, episode, series, detail);
    } else if (listMatch) {
      const list = await getSharedList(listMatch[1]);
      if (list) out = injectListOg(html, listMatch[1], list);
      cacheControl = 'public, max-age=60, s-maxage=300';
    } else if (readingMatch) {
      const kind = readingMatch[1] === 'books' ? 'book' : 'manga';
      const id = decodeURIComponent(readingMatch[2]);
      const item = await getReadingItem(kind, id);
      if (item) out = injectReadingOg(html, kind, id, item);
    } else if (match) {
      const mediaType = match[1] === 'movie' ? 'movie' : 'tv';
      const detail = await getTmdbDetail(mediaType, Number(match[2]));
      if (detail) out = injectOg(html, match[1], Number(match[2]), detail);
    }

    // CDN cached pro URL — Wiederholungszugriffe (Crawler-Wellen, Klicks aus
    // demselben Chat) treffen die Function nicht mehr.
    res.set('Cache-Control', cacheControl);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(out);
  }
);
