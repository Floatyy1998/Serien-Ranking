/**
 * Tägliche CVE-Prüfung (GitHub Actions, .github/workflows/security-audit.yml):
 * npm audit für App und Cloud Function, neue kritische/hohe Funde gehen als
 * Glocke + Push an den Admin. Bereits gemeldete Funde stehen in
 * admin/securityAudit und lösen keine zweite Meldung aus.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const { createRequire } = require('module');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGETS = [
  { name: 'App', dir: ROOT },
  { name: 'Cloud Function', dir: path.join(ROOT, 'functions') },
];
const ADMIN_UID = '83fRTz3YqgMkjz646AJ1GO6I8Kg1';
const SEVERITIES = new Set(['critical', 'high']);
const LABEL = { critical: 'kritisch', high: 'hoch' };

function audit(dir, omitDev) {
  const args = ['audit', '--json', ...(omitDev ? ['--omit=dev'] : [])];
  let out;
  try {
    out = execFileSync('npm', args, { cwd: dir, encoding: 'utf8', shell: true });
  } catch (e) {
    // npm audit beendet sich mit Code 1, sobald es Funde gibt.
    out = e.stdout;
  }
  return JSON.parse(out).vulnerabilities || {};
}

function collect() {
  const findings = [];
  for (const target of TARGETS) {
    const all = audit(target.dir, false);
    const runtime = audit(target.dir, true);
    for (const [pkg, v] of Object.entries(all)) {
      if (!SEVERITIES.has(v.severity)) continue;
      const advisories = (v.via || []).filter((x) => typeof x === 'object');
      const fix = v.fixAvailable;
      findings.push({
        key: `${target.name}:${pkg}:${v.severity}:${advisories
          .map((a) => a.source)
          .sort()
          .join(',')}`,
        target: target.name,
        pkg,
        severity: v.severity,
        runtime: !!runtime[pkg],
        titles: [...new Set(advisories.map((a) => a.title))],
        urls: [...new Set(advisories.map((a) => a.url))],
        fix: fix === true ? 'npm audit fix' : fix ? `${fix.name}@${fix.version}` : 'kein Fix',
      });
    }
  }
  return findings.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1
  );
}

function summary(findings, fresh) {
  const lines = ['## CVE-Prüfung', ''];
  if (!findings.length) {
    lines.push('Keine kritischen oder hohen Lücken.');
    return lines.join('\n');
  }
  lines.push(
    '| | Schwere | Ort | Paket | Laufzeit | Fix | Advisory |',
    '|---|---|---|---|---|---|---|'
  );
  for (const f of findings) {
    lines.push(
      `| ${fresh.has(f.key) ? 'neu' : ''} | ${LABEL[f.severity]} | ${f.target} | ${f.pkg} | ${
        f.runtime ? 'ja' : 'nur Build/Dev'
      } | ${f.fix} | ${f.urls.map((u) => `[link](${u})`).join(' ') || '—'} |`
    );
  }
  return lines.join('\n');
}

// firebase-admin liegt nur in functions/ — von dort laden statt es der App aufzuzwingen.
async function openState() {
  const fnRequire = createRequire(path.join(ROOT, 'functions', 'package.json'));
  const { initializeApp, cert } = fnRequire('firebase-admin/app');
  const { getDatabase, ServerValue } = fnRequire('firebase-admin/database');
  const app = initializeApp({
    credential: cert(
      JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
    ),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  const db = getDatabase(app);
  const stateRef = db.ref('admin/securityAudit');
  const known = new Set(((await stateRef.child('known').get()).val() || []).filter(Boolean));
  return { db, stateRef, known, ServerValue };
}

async function main() {
  const findings = collect();
  const hasDb = !!(process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.FIREBASE_DATABASE_URL);
  let fresh = new Set(findings.map((f) => f.key));

  if (hasDb) {
    const { db, stateRef, known, ServerValue } = await openState();
    fresh = new Set(findings.filter((f) => !known.has(f.key)).map((f) => f.key));
    const neu = findings.filter((f) => fresh.has(f.key));
    const test = process.env.AUDIT_TEST === '1';
    if (neu.length || test) {
      const critical = neu.filter((f) => f.severity === 'critical').length;
      const title = !neu.length
        ? `CVE-Prüfung eingerichtet: ${findings.length} offene kritische/hohe Lücken`
        : critical > 0
          ? `Sicherheitslücke: ${critical} kritisch, ${neu.length - critical} hoch`
          : `Sicherheitslücke: ${neu.length} hoch`;
      const message = !neu.length
        ? 'Testmeldung: Die tägliche Prüfung läuft und meldet neue kritische und hohe Funde hier.'
        : neu
            .map(
              (f) =>
                `${LABEL[f.severity]} · ${f.pkg} (${f.target}${f.runtime ? '' : ', nur Build'}) · ${
                  f.titles[0] || 'ohne Titel'
                } · Fix: ${f.fix}`
            )
            .join('\n')
            .slice(0, 1900);
      await db.ref(`users/${ADMIN_UID}/notifications`).push({
        type: 'security_alert',
        title,
        message,
        data: { navigateTo: '/admin' },
        timestamp: Date.now(),
        read: false,
      });
      await db.ref('pushQueue').push({
        to: ADMIN_UID,
        from: ADMIN_UID,
        title: title.slice(0, 100),
        body: (neu.length
          ? neu.map((f) => `${f.pkg} (${LABEL[f.severity]})`).join(', ')
          : 'Testmeldung: Die tägliche Prüfung läuft.'
        ).slice(0, 300),
        url: '/admin',
        ts: ServerValue.TIMESTAMP,
      });
    }
    await stateRef.update({
      known: findings.map((f) => f.key),
      lastRun: ServerValue.TIMESTAMP,
      open: findings.length,
    });
    console.log(`${findings.length} offen, ${neu.length} neu gemeldet`);
  } else {
    console.log('Ohne Firebase-Zugang: nur Bericht, keine Meldung.');
  }

  const text = summary(findings, fresh);
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
