/**
 * Prüft die Zeichenlimits in docs/STORE_LISTINGS.md, damit kein Text im
 * Store-Backend abgeschnitten wird. Läuft ohne Abhängigkeiten: node scripts/check-store-listings.js
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '..', 'docs', 'STORE_LISTINGS.md');

/** Label im Dokument → erlaubtes Maximum. */
const LIMITS = [
  [/^\*\*(Play-Name|Play name|Nombre en Play|Nom Play|Nome Play)/i, 30, 'Name'],
  [/^\*\*(App-Store-Untertitel|App Store subtitle|Subtítulo|Sous-titre|Subtítulo)/i, 30, 'Untertitel'],
  [/^\*\*(Kurzbeschreibung|Short description|Descripción breve|Description courte|Descrição breve)/i, 80, 'Kurzbeschreibung'],
  [/^\*\*(Werbetext|Promotional text|Texto promocional|Texte promotionnel)/i, 170, 'Werbetext'],
  [/^\*\*Keywords/i, 100, 'Keywords'],
  [/^\*\*(Beschreibung|Description|Descripción|Descrição)\*\*/i, 4000, 'Beschreibung'],
];

// Zeilenenden vereinheitlichen: unter Windows steht CRLF in der Datei, und ein
// mitgezaehltes \r meldet Texte faelschlich als zu lang.
const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
let section = '';
let problems = 0;
let checked = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('## ')) section = line.slice(3).trim();

  const rule = LIMITS.find(([re]) => re.test(line));
  if (!rule) continue;
  const [, limit, label] = rule;

  // Nächster ```-Block ist der Wert
  let start = i + 1;
  while (start < lines.length && !lines[start].startsWith('```')) start++;
  let end = start + 1;
  while (end < lines.length && !lines[end].startsWith('```')) end++;
  if (start >= lines.length || end >= lines.length) continue;

  const value = lines.slice(start + 1, end).join('\n');
  const length = [...value].length; // Codepoints, nicht UTF-16-Einheiten
  checked++;
  const over = length > limit;
  if (over) problems++;
  const mark = over ? 'ZU LANG' : 'ok';
  console.log(
    `${over ? 'x' : ' '} ${section.padEnd(10)} ${label.padEnd(18)} ${String(length).padStart(4)}/${limit}  ${mark}`
  );
}

console.log(`\n${checked} Felder geprüft, ${problems} über dem Limit.`);
process.exit(problems ? 1 : 0);
