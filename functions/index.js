/**
 * OG-Renderer für geteilte Detail-Links (/series/:id, /movie/:id).
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

const SITE_ORIGIN = 'https://tv-rank.de';
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
    // nur /series/** und /movie/** zeigen auf diese Function).
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(text, max) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
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
  const image = detail.poster_path
    ? `https://image.tmdb.org/t/p/w780${detail.poster_path}`
    : `${SITE_ORIGIN}/logo180.png`;
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
    `<meta property="og:url" content="${pageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');

  // Generische SPA-Tags raus (Title, Description, og:*, twitter:*), dann die
  // titelspezifischen vor </head> einsetzen.
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta[^>]+name="twitter:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta[^>]+name="description"[^>]*>\s*/gi, '')
    .replace('</head>', `${tags}\n  </head>`);
}

exports.ogRender = onRequest(
  { memory: '256MiB', timeoutSeconds: 15, maxInstances: 10 },
  async (req, res) => {
    const html = await getIndexHtml();
    if (!html) {
      // Hosting selbst nicht erreichbar (Kaltstart + Ausfall) — kurzlebig.
      res.set('Cache-Control', 'no-store');
      res.status(503).set('Retry-After', '30').send('Temporarily unavailable');
      return;
    }

    const match = (req.path || '').match(/^\/(series|movie)\/(\d+)/);
    let out = html;
    if (match) {
      const mediaType = match[1] === 'movie' ? 'movie' : 'tv';
      const detail = await getTmdbDetail(mediaType, Number(match[2]));
      if (detail) out = injectOg(html, match[1], Number(match[2]), detail);
    }

    // CDN cached pro URL — Wiederholungszugriffe (Crawler-Wellen, Klicks aus
    // demselben Chat) treffen die Function nicht mehr.
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(out);
  });
