// Essai dans un navigateur, sans toucher à l'appli en ligne du gérant :
//   node outils/essai-local.mjs   puis   http://localhost:8787/   (lien d'une table et de YÄYA Service affichés)
// La page client (site/) parle à la copie fidèle de son appli (tests/faux-google.mjs) au lieu de Google.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projet, SERVEUR, GERANT, SOIR } from '../tests/soiree.mjs';

const ICI = fileURLToPath(new URL('..', import.meta.url));
const PORT = +(process.env.PORT || 8787);
const debut = Date.now();
const y = projet({ horloge: () => SOIR + (Date.now() - debut), reelle: process.env.CARTE !== 'exemple' }); // sa vraie carte (relue le 19/11), ou CARTE=exemple
if (process.env.OUVERT !== '0') y.api('scanIn', { lat: 48.92746, lng: 2.222845, acc: 10 }); // Sam a pris son service

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const corps = (req) => new Promise((ok) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => ok(s)); });

// Les pages Apps Script appellent google.script.run : ici, un simple POST vers /gas.
const CALE_GAS = `<script>window.google={script:{run:(function mk(ok,ko){return new Proxy({},{get:(_, f)=>f==='withSuccessHandler'?(h)=>mk(h,ko):f==='withFailureHandler'?(h)=>mk(ok,h):(...a)=>fetch('/gas',{method:'POST',body:JSON.stringify({f,a})}).then(r=>r.json()).then(r=>r.erreur?ko&&ko(new Error(r.erreur)):ok&&ok(r.ok))});})()}};</script>`;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'POST' && url.pathname === '/exec') {
      const sortie = y.ctx.doPost({ postData: { contents: await corps(req) } }).getContent();
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(sortie);
    }
    if (req.method === 'POST' && url.pathname === '/gas') {
      const { f, a } = JSON.parse(await corps(req));
      let r;
      try { r = { ok: JSON.parse(JSON.stringify(y.ctx[f](...a) ?? null)) }; } catch (e) { r = { erreur: e.message }; }
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(r));
    }
    if (url.pathname === '/service' || url.pathname === '/gerant' || url.pathname === '/qr') {
      const k = url.pathname === '/service' ? SERVEUR : GERANT;
      const html = y.ctx.doGet({ parameter: { k, ...(url.pathname === '/qr' ? { app: 'qr' } : {}) } }).getContent();
      res.writeHead(200, { 'content-type': TYPES['.html'] }); return res.end(html.replace('<head>', '<head>' + CALE_GAS));
    }
    let chemin = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
    let contenu = await readFile(join(ICI, 'site', chemin));
    if (chemin === '/index.html') {
      contenu = String(contenu)
        .replace(/(name="yaya-api" content=")[^"]+/, '$1/exec')
        .replace('connect-src https://script.google.com https://script.googleusercontent.com', "connect-src 'self'");
    }
    res.writeHead(200, { 'content-type': TYPES[extname(chemin)] || 'application/octet-stream' }); res.end(contenu);
  } catch (e) {
    res.writeHead(404); res.end('introuvable');
  }
}).listen(PORT, () => {
  console.log(`Table 7      http://localhost:${PORT}/?t=7&k=${y.k(7)}`);
  console.log(`YÄYA Service http://localhost:${PORT}/service   (code 1234)`);
  console.log(`YÄYA Gérant  http://localhost:${PORT}/gerant    ·  QR : http://localhost:${PORT}/qr`);
});
