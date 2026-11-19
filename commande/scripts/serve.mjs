// Essai en local, sans compte Netlify : node scripts/serve.mjs → http://localhost:8888
//   stockage en mémoire, carte de tests/fixtures/menu-kerro.json (ou la vraie avec KERRO=1),
//   code de la cuisine 246810, HEURE=21:30 pour simuler une heure d'ouverture.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../config.json' with { type: 'json' };
import { stockageMemoire } from '../src/adaptateurs/sortants/stockage-memoire.js';
import { sourceCarteKerro } from '../src/adaptateurs/sortants/carte-kerro.js';
import { aleatoire } from '../src/adaptateurs/entrants/http.js';
import { signerTable } from '../src/domaine/table.js';
import carte from '../netlify/functions/carte.mjs';
import commande from '../netlify/functions/commande.mjs';
import cuisine from '../netlify/functions/cuisine.mjs';

const RACINE = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 8888);
const PHOTOS = process.env.PHOTOS || join(RACINE, '../../yaya-lounge/src/static/photos');
const SECRET = 'secret-local-de-demonstration-0123456789';

const decalage = process.env.HEURE ? (() => {
  const [hh, mm] = process.env.HEURE.split(':').map(Number);
  const paris = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const cible = new Date(paris); cible.setHours(hh, mm || 0, 0, 0);
  return cible - paris;
})() : 0;
const horloge = { maintenant: () => new Date(Date.now() + decalage) };
const stockage = stockageMemoire();
const menu = JSON.parse(await readFile(join(RACINE, 'tests/fixtures/menu-kerro.json'), 'utf8'));
const fauxKerro = async () => ({ ok: true, status: 200, json: async () => structuredClone(menu) });
const photosSite = { ...config.photosSite, base: '/photos-dev/' };

globalThis.__yayaDeps = {
  config,
  secret: SECRET,
  versionTables: '1',
  codeValide: (c) => String(c).trim() === '246810',
  stockage,
  horloge,
  aleatoire,
  carte: sourceCarteKerro({ ...config.carte, photosSite, stockage, horloge, ...(process.env.KERRO ? {} : { fetch: fauxKerro }) }),
};

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8' };
const toml = await readFile(join(RACINE, 'netlify.toml'), 'utf8');
const csp = toml.match(/Content-Security-Policy = "([^"]+)"/)[1];

async function fichier(chemin) {
  for (const p of [chemin, join(chemin, 'index.html')]) {
    try { if ((await stat(p)).isFile()) return { corps: await readFile(p), type: TYPES[extname(p)] ?? 'application/octet-stream' }; } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const corps = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((ok) => { const b = []; req.on('data', (c) => b.push(c)); req.on('end', () => ok(Buffer.concat(b))); });
  const requete = new Request(url, { method: req.method, headers: req.headers, body: corps });
  const fn = url.pathname === '/api/carte' ? carte : ['/api/commande', '/api/suivi'].includes(url.pathname) ? commande : url.pathname.startsWith('/api/cuisine/') ? cuisine : null;
  let r;
  if (fn) r = await fn(requete, { ip: req.socket.remoteAddress });
  else {
    let chemin = url.pathname.startsWith('/t/') ? '/table.html' : url.pathname;
    const base = chemin.startsWith('/photos-dev/') ? PHOTOS : join(RACINE, 'public');
    if (chemin.startsWith('/photos-dev/')) chemin = chemin.slice('/photos-dev'.length);
    const f = await fichier(join(base, normalize(decodeURIComponent(chemin)).replace(/^(\.\.[/\\])+/, '')));
    r = f ? new Response(f.corps, { headers: { 'content-type': f.type, 'content-security-policy': csp, 'cache-control': 'no-store' } }) : new Response('Introuvable', { status: 404 });
  }
  res.writeHead(r.status, Object.fromEntries([...r.headers].filter(([k]) => k !== 'set-cookie').concat(r.headers.getSetCookie().length ? [['set-cookie', r.headers.getSetCookie()]] : [])));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(PORT, () => {
  console.log(`Commande Yäya en local : http://localhost:${PORT}`);
  console.log(`  Table 12 : http://localhost:${PORT}/t/12?k=${signerTable(SECRET, '1', 12)}`);
  console.log(`  Cuisine  : http://localhost:${PORT}/cuisine/  (code 246810)`);
});
