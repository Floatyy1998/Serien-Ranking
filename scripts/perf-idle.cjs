// Leerlauf-Kosten einzelner App-Szenen messen (headless Chrome, iPhone-Maße, CDP Performance.getMetrics).
// Fand am 27.10.2026 das Laufband (rAF-Schleife 60/s) und den Fledermaus-Schatten der Spooky-Deko als Heizquellen.
//
//   npm run dev            (Dev-Server auf 5173)
//   node scripts/perf-idle.cjs "http://localhost:5173/dev/ui-preview?solo=books" [weitere URLs]
//
// Je Szene: Style-Neuberechnungen/s, Layouts/s, Hauptthread- und Prozess-Anteil — erst komplett, dann ohne
// Saison-Deko, dann mit pausierten Animationen. Dazu die häufigsten setInterval-/requestAnimationFrame-Aufrufer.
// Faustregel: unter 40 Style-Neuberechnungen/s und unter 5 % Hauptthread im Leerlauf ist die Seite kühl.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const SETTLE_MS = 7000;
const WINDOW_MS = 3000;
const urls = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

const metric = (list, name) => (list.find((m) => m.name === name) || { value: 0 }).value;

async function measure(url) {
  const target = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  const cdp = new Cdp(ws);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Performance.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      const stats = (window.__perfHooks = { interval: {}, raf: {}, rafCalls: 0 });
      const site = () => (new Error().stack || '').split('\\n').slice(2, 5).map((l) => l.trim().replace(/^at /, '').replace(/https?:\\/\\/localhost:5173/g, '')).join(' <- ').slice(0, 200);
      const oi = window.setInterval; window.setInterval = function (fn, ms, ...rest) { const k = (ms || 0) + 'ms ' + site(); stats.interval[k] = (stats.interval[k] || 0) + 1; return oi.call(this, fn, ms, ...rest); };
      const or = window.requestAnimationFrame; window.requestAnimationFrame = function (fn) { stats.rafCalls++; const k = site(); stats.raf[k] = (stats.raf[k] || 0) + 1; return or.call(this, fn); };
    })();`,
  });
  await cdp.send('Page.navigate', { url });
  await sleep(SETTLE_MS);
  const evalIn = (expression) => cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  const dom = JSON.parse(
    (
      await evalIn(
        `JSON.stringify({ season: !!document.querySelector('.season-layer'), animations: document.getAnimations().length, backdrop: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).backdropFilter !== 'none').length })`
      )
    ).result.value
  );
  const sample = async (label) => {
    const a = (await cdp.send('Performance.getMetrics')).metrics;
    await sleep(WINDOW_MS);
    const b = (await cdp.send('Performance.getMetrics')).metrics;
    const secs = metric(b, 'Timestamp') - metric(a, 'Timestamp') || WINDOW_MS / 1000;
    const d = (n) => metric(b, n) - metric(a, n);
    return `  ${label.padEnd(26)} style/s ${String(+(d('RecalcStyleCount') / secs).toFixed(1)).padStart(6)}  layout/s ${String(+(d('LayoutCount') / secs).toFixed(1)).padStart(5)}  main% ${String(+((d('ThreadTime') / secs) * 100).toFixed(1)).padStart(5)}  prozess% ${String(+((d('ProcessTime') / secs) * 100).toFixed(1)).padStart(5)}`;
  };
  const lines = [await sample('komplett')];
  await evalIn(`document.querySelector('.season-layer')?.remove()`);
  lines.push(await sample('ohne Saison-Deko'));
  await evalIn(`document.getAnimations().forEach((a) => a.pause())`);
  lines.push(await sample('alle Animationen pausiert'));
  const before = (await evalIn(`window.__perfHooks.rafCalls`)).result.value;
  await sleep(2000);
  const hooks = JSON.parse(
    (
      await evalIn(
        `JSON.stringify({ rafPerSec: (window.__perfHooks.rafCalls - ${before}) / 2, raf: Object.entries(window.__perfHooks.raf).sort((a, b) => b[1] - a[1]).slice(0, 4), intervals: Object.entries(window.__perfHooks.interval).filter(([k]) => Number(k) < 5000).slice(0, 6) })`
      )
    ).result.value
  );
  ws.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
  console.log(
    `== ${url.replace(/^http:\/\/localhost:5173/, '')}  (Saison ${dom.season ? 'an' : 'aus'}, ${dom.animations} Animationen, ${dom.backdrop} Backdrop-Elemente)`
  );
  for (const line of lines) console.log(line);
  console.log(`  rAF/s ${hooks.rafPerSec}`);
  for (const [site, n] of hooks.raf) console.log(`    rAF x${n}: ${site}`);
  for (const [site, n] of hooks.intervals) console.log(`    setInterval x${n}: ${site}`);
}

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--window-size=390,844',
    'about:blank',
  ]);
  try {
    for (let i = 0; i < 40; i++) {
      try {
        await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
        break;
      } catch {
        await sleep(250);
      }
    }
    for (const url of urls) {
      try {
        await measure(url);
      } catch (err) {
        console.log(`== ${url}: Fehler ${err.message}`);
      }
    }
  } finally {
    chrome.kill();
  }
})();
